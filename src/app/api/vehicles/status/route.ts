import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { vehicles, vehicleStatus } from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta na requisição GET
const querySchema = z.object({
  ids: z
    .string()
    .optional()
    .transform(val => {
      if (!val) return undefined;
      const parsed = val
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => Number.isInteger(id) && id > 0);
      return parsed.length > 0 ? parsed : undefined;
    }),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
});

/**
 * GET /api/vehicles/status
 * Lista os veículos do usuário autenticado (opcionalmente filtrados por
 * status cadastral e/ou ids) com o último estado de telemetria conhecido.
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
      return NextResponse.json(
        { error: 'Parâmetros de consulta inválidos', details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { ids, status } = queryResult.data;

    const conditions = [eq(vehicles.userId, userId)];
    if (status) {
      conditions.push(eq(vehicles.status, status));
    }
    if (ids) {
      conditions.push(inArray(vehicles.id, ids));
    }

    const rows = await db
      .select({
        vehicle: vehicles,
        telemetry: vehicleStatus,
      })
      .from(vehicles)
      .leftJoin(vehicleStatus, eq(vehicleStatus.vehicleId, vehicles.id))
      .where(and(...conditions));

    const data = rows.map(({ vehicle, telemetry }) => ({
      id: String(vehicle.id),
      name: vehicle.name,
      license_plate: vehicle.plate,
      model: vehicle.model ?? undefined,
      year: vehicle.year ? parseInt(vehicle.year, 10) || undefined : undefined,
      status: (vehicle.status ?? 'active') as 'active' | 'inactive' | 'maintenance',
      telemetry: telemetry
        ? {
            status: telemetry.status,
            is_moving: telemetry.isMoving,
            last_update: telemetry.lastUpdate,
            lat: telemetry.lat,
            lng: telemetry.lng,
            speed: telemetry.speed,
            battery_level: telemetry.batteryLevel,
            fuel_level: telemetry.fuelLevel,
            ignition: telemetry.ignition,
          }
        : null,
    }));

    return NextResponse.json({ vehicles: data });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT/POST /api/vehicles/status
 * A escrita de telemetria por HTTP não faz parte do baseline de produção:
 * o estado dos veículos é alimentado pelo servidor de rastreamento (tracker-server).
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Operação não suportada no baseline de produção', code: 'UNSUPPORTED' },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Operação não suportada no baseline de produção', code: 'UNSUPPORTED' },
    { status: 501 }
  );
}
