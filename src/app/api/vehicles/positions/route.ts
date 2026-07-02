import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { events, vehicles, vehicleStatus } from '@/lib/schema';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  vehicleId: z.coerce.number().int().positive().optional(),
  history: z.coerce.number().int().min(0).max(1000).optional().default(0),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

interface PositionPayload {
  vehicle_id: number;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  heading: number | null;
  address: string | null;
  timestamp: Date | string | null;
}

/**
 * GET /api/vehicles/positions
 * - Sem parâmetros: última posição conhecida (vehicle_status) de todos os veículos do usuário.
 * - ?vehicleId=1: última posição conhecida do veículo.
 * - ?vehicleId=1&history=50[&from=...&to=...]: histórico real de posições (tabela events).
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.user.id;

    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

    if (!queryResult.success) {
      return NextResponse.json({
        error: 'Parâmetros de consulta inválidos',
        details: queryResult.error.format()
      }, { status: 400 });
    }

    const { vehicleId, history, from, to } = queryResult.data;

    if (vehicleId) {
      // Verificar se o veículo pertence ao usuário
      const [vehicle] = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
        .limit(1);

      if (!vehicle) {
        return NextResponse.json(
          { error: 'Veículo não encontrado ou não pertence ao usuário' },
          { status: 404 }
        );
      }

      // Histórico real de posições a partir da tabela events
      if (history > 0) {
        const conditions = [eq(events.vehicleId, vehicleId)];
        if (from) conditions.push(gte(events.timestamp, new Date(from)));
        if (to) conditions.push(lte(events.timestamp, new Date(to)));

        const rows = await db
          .select({
            vehicle_id: events.vehicleId,
            lat: events.lat,
            lng: events.lng,
            speed: events.speed,
            heading: events.heading,
            address: events.address,
            timestamp: events.timestamp,
          })
          .from(events)
          .where(and(...conditions))
          .orderBy(desc(events.timestamp))
          .limit(history);

        const positions: PositionPayload[] = rows.filter(row => row.lat != null && row.lng != null);
        return NextResponse.json({ positions });
      }

      // Última posição conhecida (vehicle_status)
      const [status] = await db
        .select()
        .from(vehicleStatus)
        .where(eq(vehicleStatus.vehicleId, vehicleId))
        .limit(1);

      if (!status || status.lat == null || status.lng == null) {
        return NextResponse.json(
          { error: 'Nenhuma posição encontrada para este veículo' },
          { status: 404 }
        );
      }

      const position: PositionPayload = {
        vehicle_id: status.vehicleId,
        lat: status.lat,
        lng: status.lng,
        speed: status.speed,
        heading: status.heading,
        address: status.address,
        timestamp: status.lastUpdate,
      };

      return NextResponse.json({ position });
    }

    // Última posição conhecida de todos os veículos do usuário
    const userVehicles = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.userId, userId));

    if (userVehicles.length === 0) {
      return NextResponse.json({ positions: [] });
    }

    const statusRows = await db
      .select()
      .from(vehicleStatus)
      .where(inArray(vehicleStatus.vehicleId, userVehicles.map(v => v.id)));

    const positions: PositionPayload[] = statusRows
      .filter(status => status.lat != null && status.lng != null)
      .map(status => ({
        vehicle_id: status.vehicleId,
        lat: status.lat,
        lng: status.lng,
        speed: status.speed,
        heading: status.heading,
        address: status.address,
        timestamp: status.lastUpdate,
      }));

    return NextResponse.json({ positions });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
