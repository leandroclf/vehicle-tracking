import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Definir interface de tipos para a requisição
interface ReportRequest {
  reportType: string;
  startDate: string;
  endDate: string;
  vehicleIds: string[];
  format?: 'pdf' | 'excel';
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { 
      reportType, 
      startDate, 
      endDate, 
      vehicleIds,
      format = 'pdf'
    } = await request.json() as ReportRequest;
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Validação básica
    if (!reportType || !startDate || !endDate || !vehicleIds || vehicleIds.length === 0) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Criar o registro do relatório
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        vehicle_ids: vehicleIds,
        format: format,
        status: 'processing'
      })
      .select()
      .single();
      
    if (reportError) {
      console.error('Erro ao criar relatório:', reportError);
      return NextResponse.json(
        { error: 'Erro ao criar relatório' },
        { status: 500 }
      );
    }
    
    // Em uma aplicação real, aqui você iniciaria um job em background
    // para gerar o relatório de forma assíncrona
    
    // Simular processamento (em produção, isso seria feito em background)
    setTimeout(async () => {
      await supabase
        .from('reports')
        .update({ 
          status: 'completed',
          file_url: `/reports/${reportType}_${report.id}.pdf` // URL fictícia
        })
        .eq('id', report.id);
    }, 2000);
    
    return NextResponse.json({
      message: 'Relatório em processamento',
      reportId: report.id
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Parâmetros opcionais de paginação
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Buscar relatórios do usuário
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (reportsError) {
      console.error('Erro ao buscar relatórios:', reportsError);
      return NextResponse.json(
        { error: 'Erro ao buscar relatórios' },
        { status: 500 }
      );
    }
    
    // Contar total para paginação
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    if (countError) {
      console.error('Erro ao contar relatórios:', countError);
    }
    
    return NextResponse.json({
      reports,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 