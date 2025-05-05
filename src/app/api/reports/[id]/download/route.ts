import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

// Interface para parâmetros de rota
interface Params {
  id: string;
}

// Função para gerar conteúdo de relatório em formato CSV
function generateCsvContent(data: any[], fields: string[]): string {
  if (!data || data.length === 0) return '';
  
  // Criar cabeçalho
  const header = fields.join(',');
  
  // Criar linhas
  const rows = data.map(item => {
    return fields.map(field => {
      // Tratar campos especiais ou formatação
      let value = item[field];
      
      // Verificar se é string para adicionar aspas duplas
      if (typeof value === 'string') {
        // Escapar aspas duplas existentes
        value = value.replace(/"/g, '""');
        return `"${value}"`;
      }
      
      return value === null || value === undefined ? '' : value;
    }).join(',');
  });
  
  return `${header}\n${rows.join('\n')}`;
}

// Handler para fazer download de relatório
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    const reportId = params.id;
    
    // Extrair formato de download dos parâmetros da consulta
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'pdf';
    
    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }
    
    // Buscar relatório do banco de dados
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*, vehicles:vehicle_id(name, license_plate)')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();
      
    if (reportError) {
      console.error('Erro ao buscar relatório:', reportError);
      return NextResponse.json({ error: 'Erro ao buscar relatório' }, { status: 500 });
    }
    
    if (!report) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }
    
    // Verificar status do relatório
    if (report.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Relatório ainda não está pronto para download', 
        status: report.status 
      }, { status: 400 });
    }
    
    // Buscar dados do relatório
    // Em um sistema real, poderia recuperar os dados de um armazenamento de arquivos
    // ou de um serviço de geração de relatórios
    
    // Buscar posições para o relatório
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('*')
      .eq('vehicle_id', report.vehicle_id)
      .gte('timestamp', report.start_date)
      .lte('timestamp', report.end_date)
      .order('timestamp', { ascending: true });
      
    if (positionsError) {
      console.error('Erro ao buscar posições para download:', positionsError);
      return NextResponse.json({ error: 'Erro ao preparar dados do relatório' }, { status: 500 });
    }
    
    // Gerar conteúdo do relatório com base no formato solicitado
    
    // Em um cenário real, aqui você usaria bibliotecas específicas para cada formato
    // como pdfkit para PDF, ExcelJS para Excel, etc.
    
    // Para esta implementação, vamos apenas gerar um CSV simples
    if (format === 'csv') {
      // Definir campos para CSV
      const fields = ['timestamp', 'lat', 'lng', 'speed', 'heading', 'altitude', 'inside_geofence'];
      
      // Gerar conteúdo CSV
      const csvContent = generateCsvContent(positions || [], fields);
      
      // Definir nome do arquivo para download
      const fileName = `relatorio_${report.report_type}_${report.vehicle_id}.csv`;
      
      // Retornar resposta com arquivo CSV
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else if (format === 'excel') {
      // Placeholder para formato Excel
      // Em uma implementação real, usar biblioteca como ExcelJS
      return new NextResponse(
        `Relatório Excel para veículo ${report.vehicles?.name || 'Desconhecido'} (${report.vehicles?.license_plate || '-'})`, 
        {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="report_${reportId}.xlsx"`,
          },
        }
      );
    } else { // PDF
      // Placeholder para formato PDF
      // Em uma implementação real, usar biblioteca como PDFKit
      return new NextResponse(
        `Relatório PDF para veículo ${report.vehicles?.name || 'Desconhecido'} (${report.vehicles?.license_plate || '-'})`, 
        {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="report_${reportId}.pdf"`,
          },
        }
      );
    }
    
  } catch (error) {
    console.error('Erro ao processar download de relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 