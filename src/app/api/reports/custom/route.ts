import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Definir interface de tipos para a requisição
interface CustomReportRequest {
  title: string;
  vehicleIds: string[];
  startDate: string;
  endDate: string;
  format?: 'pdf' | 'excel';
  reportType: string;
  customFields: string[];
  customFilters?: {
    field: string;
    operator: string;
    value: string | number;
  }[];
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { 
      title,
      vehicleIds,
      startDate,
      endDate,
      format = 'pdf',
      reportType,
      customFields,
      customFilters = []
    } = await request.json() as CustomReportRequest;
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Validação básica
    if (!title || !startDate || !endDate || !vehicleIds || vehicleIds.length === 0 || !customFields || customFields.length === 0) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar filtros
    for (const filter of customFilters) {
      if (!filter.field || !filter.operator || filter.value === undefined) {
        return NextResponse.json(
          { error: 'Todos os campos do filtro devem ser preenchidos' },
          { status: 400 }
        );
      }
    }
    
    // Criar o registro do relatório
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        title: title,
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        vehicle_ids: vehicleIds,
        format: format,
        status: 'processing',
        custom_fields: customFields,
        custom_filters: customFilters
      })
      .select()
      .single();
      
    if (reportError) {
      console.error('Erro ao criar relatório customizado:', reportError);
      return NextResponse.json(
        { error: 'Erro ao criar relatório customizado' },
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
          file_url: `/reports/custom_${report.id}.${format}` // URL fictícia
        })
        .eq('id', report.id);
    }, 3000);
    
    return NextResponse.json({
      message: 'Relatório customizado em processamento',
      reportId: report.id
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição customizada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 