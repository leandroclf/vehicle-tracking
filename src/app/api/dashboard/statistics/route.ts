import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { vehicles, trips, alerts } from '@/lib/schema';
import { and, eq, gte, inArray } from 'drizzle-orm';
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
    const startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Consultar veículos do usuário
    const userVehicles = await db
      .select({ id: vehicles.id, status: vehicles.status })
      .from(vehicles)
      .where(eq(vehicles.userId, userId));

    const vehicleCount = userVehicles.length;
    const activeCount = userVehicles.filter(v => v.status === 'active').length;
    const vehicleIds = userVehicles.map(v => v.id);

    // Inicializar estatísticas agregadas
    let totalDistance = 0;
    let fuelConsumption = 0;
    let alertsCount = 0;

    // Se houver veículos, buscar estatísticas de alertas e viagens
    if (vehicleIds.length > 0) {
      const periodAlerts = await db
        .select({ id: alerts.id })
        .from(alerts)
        .where(and(
          inArray(alerts.vehicleId, vehicleIds),
          gte(alerts.createdAt, startDate)
        ));
      alertsCount = periodAlerts.length;

      const periodTrips = await db
        .select({ distance: trips.distance, fuelConsumed: trips.fuelConsumed })
        .from(trips)
        .where(and(
          inArray(trips.vehicleId, vehicleIds),
          gte(trips.endTime, startDate)
        ));

      // Somar distâncias e consumo de combustível
      totalDistance = periodTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
      fuelConsumption = periodTrips.reduce((sum, trip) => sum + (trip.fuelConsumed || 0), 0);
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
