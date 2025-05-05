import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar parâmetros de exportação
const exportSchema = z.object({
  vehicle_id: z.string().min(1, 'ID do veículo é obrigatório'),
  start_date: z.string().min(1, 'Data inicial é obrigatória'),
  end_date: z.string().min(1, 'Data final é obrigatória'),
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  include_events: z.boolean().optional().default(false),
  include_alerts: z.boolean().optional().default(false)
});

// Handler para exportar dados de monitoramento
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const validationResult = exportSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const exportData = validationResult.data;
    
    // Verificar se o veículo pertence ao usuário
    const { data: vehicleCheck, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name, license_plate')
      .eq('id', exportData.vehicle_id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (vehicleError) {
      console.error('Erro ao verificar veículo:', vehicleError);
      return NextResponse.json({ 
        error: 'Erro ao verificar veículo' 
      }, { status: 500 });
    }
    
    if (!vehicleCheck) {
      return NextResponse.json({ 
        error: 'Veículo não encontrado ou não pertence ao usuário' 
      }, { status: 404 });
    }
    
    // Buscar posições do veículo no período especificado
    const { data: positions, error: positionsError } = await supabase
      .from('vehicle_positions')
      .select('*')
      .eq('vehicle_id', exportData.vehicle_id)
      .gte('timestamp', exportData.start_date)
      .lte('timestamp', exportData.end_date)
      .order('timestamp', { ascending: true });
    
    if (positionsError) {
      console.error('Erro ao buscar posições do veículo:', positionsError);
      return NextResponse.json({ 
        error: 'Erro ao buscar posições do veículo' 
      }, { status: 500 });
    }
    
    // Dados para exportação
    const exportDataResult: {
      vehicle: typeof vehicleCheck;
      positions: typeof positions;
      events?: any[];
      alerts?: any[];
    } = {
      vehicle: vehicleCheck,
      positions: positions || []
    };
    
    // Buscar eventos se solicitados
    if (exportData.include_events) {
      const { data: events, error: eventsError } = await supabase
        .from('monitoring_events')
        .select('*')
        .eq('vehicle_id', exportData.vehicle_id)
        .gte('timestamp', exportData.start_date)
        .lte('timestamp', exportData.end_date)
        .order('timestamp', { ascending: true });
      
      if (eventsError) {
        console.error('Erro ao buscar eventos do veículo:', eventsError);
      } else {
        exportDataResult.events = events || [];
      }
    }
    
    // Buscar alertas se solicitados
    if (exportData.include_alerts) {
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('vehicle_id', exportData.vehicle_id)
        .gte('created_at', exportData.start_date)
        .lte('created_at', exportData.end_date)
        .order('created_at', { ascending: true });
      
      if (alertsError) {
        console.error('Erro ao buscar alertas do veículo:', alertsError);
      } else {
        exportDataResult.alerts = alerts || [];
      }
    }
    
    // Gerar identificador único para o arquivo
    const fileId = `${exportData.vehicle_id}_${Date.now()}`;
    
    // Criar registro de exportação para rastreamento
    const { data: exportRecord, error: exportError } = await supabase
      .from('exports')
      .insert({
        user_id: userId,
        vehicle_id: exportData.vehicle_id,
        start_date: exportData.start_date,
        end_date: exportData.end_date,
        format: exportData.format,
        file_id: fileId,
        status: 'processing',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (exportError) {
      console.error('Erro ao registrar exportação:', exportError);
      return NextResponse.json({ 
        error: 'Erro ao registrar exportação' 
      }, { status: 500 });
    }
    
    // Na prática, aqui iniciaríamos um processo em background para 
    // gerar o arquivo e depois notificar o usuário quando estiver pronto.
    // Para este exemplo, vamos apenas simular que o processo foi iniciado.
    
    // Em uma implementação real, o arquivo seria gerado e armazenado,
    // e o status no banco seria atualizado para 'completed' após a conclusão.
    
    return NextResponse.json({
      success: true,
      message: 'Exportação iniciada com sucesso',
      export_id: exportRecord.id,
      file_id: fileId,
      status: 'processing',
      format: exportData.format,
      download_url: `/api/monitoring/export/${fileId}/download`,
      total_records: {
        positions: exportDataResult.positions.length,
        events: exportDataResult.events?.length || 0,
        alerts: exportDataResult.alerts?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar exportação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para verificar status da exportação
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair ID da exportação da URL
    const url = new URL(request.url);
    const exportId = url.searchParams.get('id');
    
    if (!exportId) {
      // Se não houver ID específico, listar todas as exportações do usuário
      const { data: exports, error: exportsError } = await supabase
        .from('exports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (exportsError) {
        console.error('Erro ao listar exportações:', exportsError);
        return NextResponse.json({ 
          error: 'Erro ao listar exportações' 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        exports: exports || []
      });
    }
    
    // Buscar exportação específica
    const { data: exportData, error: exportError } = await supabase
      .from('exports')
      .select('*, vehicles:vehicle_id(name, license_plate)')
      .eq('id', exportId)
      .eq('user_id', userId)
      .single();
    
    if (exportError) {
      console.error('Erro ao buscar exportação:', exportError);
      return NextResponse.json({ 
        error: 'Erro ao buscar exportação' 
      }, { status: 500 });
    }
    
    if (!exportData) {
      return NextResponse.json({ 
        error: 'Exportação não encontrada' 
      }, { status: 404 });
    }
    
    // Verificar se o arquivo está disponível para download
    let downloadUrl = null;
    
    if (exportData.status === 'completed') {
      downloadUrl = `/api/monitoring/export/${exportData.file_id}/download`;
    }
    
    return NextResponse.json({
      ...exportData,
      download_url: downloadUrl
    });
    
  } catch (error) {
    console.error('Erro ao verificar status da exportação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 