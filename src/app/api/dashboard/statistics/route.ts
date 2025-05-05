import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  period: z.enum(['today', 'week', 'month']).default('today')
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parâmetros de consulta inválidos', details: queryResult.error.format() }, { status: 400 });
    }
    
    const { period } = queryResult.data;
    
    // Obter data de início com base no período
    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const startDateISO = startDate.toISOString();
    
    // Consultar contagem total de veículos
    const { data: vehicles, error: vehiclesError, count: vehicleCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    if (vehiclesError) {
      console.error('Erro ao buscar veículos:', vehiclesError);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas de veículos' }, { status: 500 });
    }
    
    // Consultar veículos ativos (com posição atualizada recentemente)
    const { data: activeVehicles, error: activeError, count: activeCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('updated_at', startDateISO);
      
    if (activeError) {
      console.error('Erro ao buscar veículos ativos:', activeError);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas de veículos ativos' }, { status: 500 });
    }
    
    // Consultar alertas no período
    const { data: alerts, error: alertsError, count: alertsCount } = await supabase
      .from('alerts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gt('created_at', startDateISO);
      
    if (alertsError) {
      console.error('Erro ao buscar alertas:', alertsError);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas de alertas' }, { status: 500 });
    }
    
    // Calcular estatísticas de distância percorrida
    // Primeiro, obter os IDs de todos os veículos
    const vehicleIds = vehicles?.map(v => v.id) || [];
    
    // Inicializar distância total
    let totalDistance = 0;
    let fuelConsumption = 0;
    
    // Se houver veículos, buscar estatísticas de viagens
    if (vehicleIds.length > 0) {
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('distance, fuel_used')
        .in('vehicle_id', vehicleIds)
        .gt('end_time', startDateISO);
        
      if (tripsError) {
        console.error('Erro ao buscar viagens:', tripsError);
      } else if (trips) {
        // Somar distâncias e consumo de combustível
        totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
        fuelConsumption = trips.reduce((sum, trip) => sum + (trip.fuel_used || 0), 0);
      }
    }
    
    // Retornar estatísticas combinadas
    return NextResponse.json({
      vehicle_count: vehicleCount || 0,
      active_vehicles: activeCount || 0,
      total_distance: parseFloat(totalDistance.toFixed(2)),
      alerts_count: alertsCount || 0,
      fuel_consumption: parseFloat(fuelConsumption.toFixed(2)),
      period
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 