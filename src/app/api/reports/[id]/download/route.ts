import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const reportId = params.id;
    
    // Buscar relatório pelo ID
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();
      
    if (reportError || !report) {
      console.error('Erro ao buscar relatório:', reportError);
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o relatório está pronto
    if (report.status !== 'completed') {
      return NextResponse.json(
        { error: 'Relatório ainda não está pronto para download' },
        { status: 400 }
      );
    }
    
    // Em uma aplicação real, aqui você buscaria o arquivo do armazenamento
    // como Supabase Storage ou serviço similar
    
    // Como exemplo, vamos gerar um PDF simples
    const reportContent = `
      Relatório: ${report.report_type}
      Período: ${report.start_date} a ${report.end_date}
      Gerado em: ${new Date().toLocaleString()}
      Veículos: ${report.vehicle_ids.join(', ')}
      
      Este é um relatório de exemplo.
    `;
    
    // Criar resposta com cabeçalhos de download
    const headers = new Headers();
    headers.append('Content-Type', 'application/pdf');
    headers.append('Content-Disposition', `attachment; filename="relatorio-${reportId}.pdf"`);
    
    // Em um ambiente real, retornaria o arquivo PDF real
    // Para este exemplo, retornamos um texto simulando o PDF
    return new NextResponse(reportContent, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Erro ao processar download:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 