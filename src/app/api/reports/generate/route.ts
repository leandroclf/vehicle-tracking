import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar parâmetros da requisição
const reportRequestSchema = z.object({
  vehicleId: z.string().uuid('ID do veículo inválido'),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'positions', 'events']),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Data inicial inválida' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Data final inválida' }),
  format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  includeAlerts: z.boolean().default(false),
  includeStops: z.boolean().default(true),
  timePrecision: z.enum(['minute', 'hour', 'day']).default('minute')
}).refine(data => {
  // Verificar se a data final é maior que a data inicial
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'A data final deve ser posterior à data inicial',
  path: ['endDate']
}).refine(data => {
  // Verificar se o período não é muito longo (máximo de 31 dias)
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 31;
}, {
  message: 'O período máximo permitido é de 31 dias',
  path: ['endDate']
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const reportResult = reportRequestSchema.safeParse(body);
    
    if (!reportResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: reportResult.error.format() 
      }, { status: 400 });
    }
    
    const reportData = reportResult.data;
    
    // Verificar se o veículo pertence ao usuário
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name, license_plate')
      .eq('id', reportData.vehicleId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (vehicleError) {
      console.error('Erro ao verificar veículo:', vehicleError);
      return NextResponse.json({ error: 'Erro ao verificar veículo' }, { status: 500 });
    }
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado ou sem permissão' }, { status: 404 });
    }
    
    // Criar registro de relatório no banco de dados
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        vehicle_id: reportData.vehicleId,
        report_type: reportData.reportType,
        start_date: reportData.startDate,
        end_date: reportData.endDate,
        format: reportData.format,
        status: 'processing',
        params: {
          includeAlerts: reportData.includeAlerts,
          includeStops: reportData.includeStops,
          timePrecision: reportData.timePrecision
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (reportError) {
      console.error('Erro ao criar registro de relatório:', reportError);
      return NextResponse.json({ error: 'Erro ao iniciar geração de relatório' }, { status: 500 });
    }
    
    // Em um sistema real, aqui iniciaria um job em background para gerar o relatório
    
    // Coletar dados para o relatório
    const positionsPromise = supabase
      .from('positions')
      .select('*')
      .eq('vehicle_id', reportData.vehicleId)
      .gte('timestamp', reportData.startDate)
      .lte('timestamp', reportData.endDate)
      .order('timestamp', { ascending: true });
      
    const alertsPromise = reportData.includeAlerts ? 
      supabase
        .from('alerts')
        .select('*')
        .eq('vehicle_id', reportData.vehicleId)
        .gte('created_at', reportData.startDate)
        .lte('created_at', reportData.endDate)
        .order('created_at', { ascending: true }) :
      Promise.resolve({ data: [], error: null });
      
    // Aguardar resultados das consultas
    const [positionsResult, alertsResult] = await Promise.all([positionsPromise, alertsPromise]);
    
    if (positionsResult.error) {
      console.error('Erro ao buscar posições para relatório:', positionsResult.error);
      
      // Atualizar status do relatório para erro
      await supabase
        .from('reports')
        .update({
          status: 'failed',
          error_message: 'Erro ao buscar dados de posição',
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id);
        
      return NextResponse.json({ error: 'Erro ao buscar dados para o relatório' }, { status: 500 });
    }
    
    // Processar e agregar dados de acordo com a precisão solicitada
    const positions = processPositions(positionsResult.data || [], reportData.timePrecision);
    const alerts = alertsResult.data || [];
    
    // Calcular métricas básicas
    const metrics = calculateMetrics(positions);
    
    // Simular geração de arquivo
    // Em um sistema real, aqui geraria o arquivo no formato solicitado
    
    // Gerar URL de download fictícia
    const fileName = `report_${reportData.reportType}_${report.id}.${reportData.format}`;
    const downloadUrl = `/api/reports/${report.id}/download?format=${reportData.format}`;
    
    // Atualizar registro com dados de conclusão
    await supabase
      .from('reports')
      .update({
        status: 'completed',
        file_url: downloadUrl,
        file_name: fileName,
        metrics: metrics,
        points_count: positions.length,
        alerts_count: alerts.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', report.id);
    
    // Retornar resposta de sucesso
    return NextResponse.json({
      reportId: report.id,
      status: 'completed',
      vehicleName: vehicle.name,
      licensePlate: vehicle.license_plate,
      downloadUrl,
      metrics,
      pointsCount: positions.length,
      alertsCount: alerts.length
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para processar e agregar posições de acordo com a precisão
function processPositions(positions: any[], precision: string): any[] {
  if (!positions.length) return [];
  
  if (precision === 'minute') {
    return positions; // Sem agregação
  }
  
  const aggregated: Record<string, any> = {};
  
  positions.forEach(pos => {
    const date = new Date(pos.timestamp);
    let key: string;
    
    if (precision === 'hour') {
      key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`;
    } else { // day
      key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
    
    if (!aggregated[key]) {
      aggregated[key] = {
        ...pos,
        timestamp: key,
        count: 1
      };
    } else {
      aggregated[key].count += 1;
      // Pode-se agregar outros campos como média de velocidade, etc.
    }
  });
  
  return Object.values(aggregated);
}

// Função para calcular métricas básicas a partir das posições
function calculateMetrics(positions: any[]): Record<string, any> {
  if (!positions.length) {
    return {
      distance: 0,
      avg_speed: 0,
      max_speed: 0,
      duration: 0,
      points_count: 0
    };
  }
  
  let totalDistance = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  let speedPoints = 0;
  
  // Calcular distância total
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    
    if (prev.lat && prev.lng && curr.lat && curr.lng) {
      totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }
    
    // Calcular velocidade máxima
    if (curr.speed) {
      maxSpeed = Math.max(maxSpeed, curr.speed);
      totalSpeed += curr.speed;
      speedPoints++;
    }
  }
  
  // Calcular duração
  const startTime = new Date(positions[0].timestamp).getTime();
  const endTime = new Date(positions[positions.length - 1].timestamp).getTime();
  const durationMs = endTime - startTime;
  const durationHours = durationMs / (1000 * 60 * 60);
  
  return {
    distance: parseFloat(totalDistance.toFixed(2)), // em km
    avg_speed: speedPoints > 0 ? parseFloat((totalSpeed / speedPoints).toFixed(2)) : 0, // em km/h
    max_speed: parseFloat(maxSpeed.toFixed(2)), // em km/h
    duration: parseFloat(durationHours.toFixed(2)), // em horas
    points_count: positions.length
  };
}

// Função para calcular distância entre dois pontos em km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
} 