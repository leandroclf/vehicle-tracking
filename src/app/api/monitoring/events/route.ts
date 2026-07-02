import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { events, vehicles } from '@/lib/schema';
import { and, asc, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  vehicle_id: z.string().optional(),
  type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  sort: z.enum(['asc', 'desc']).optional().default('desc')
});

// Handler para listar eventos de monitoramento (GET)
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

    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

    if (!queryResult.success) {
      return NextResponse.json({
        error: 'Parâmetros de consulta inválidos',
        details: queryResult.error.format()
      }, { status: 400 });
    }

    const { vehicle_id, type, from, to, limit, offset, sort } = queryResult.data;

    // Construir condições da consulta (escopo por usuário via join com vehicles)
    const conditions: SQL[] = [eq(vehicles.userId, userId)];

    if (vehicle_id) {
      const vehicleIdNumber = parseInt(vehicle_id, 10);
      if (Number.isNaN(vehicleIdNumber)) {
        return NextResponse.json({
          error: 'Parâmetros de consulta inválidos',
          details: { vehicle_id: 'Deve ser um identificador numérico' }
        }, { status: 400 });
      }
      conditions.push(eq(events.vehicleId, vehicleIdNumber));
    }

    if (type) {
      conditions.push(eq(events.type, type));
    }

    if (from) {
      conditions.push(gte(events.timestamp, new Date(from)));
    }

    if (to) {
      conditions.push(lte(events.timestamp, new Date(to)));
    }

    const whereClause = and(...conditions);

    // Executar consulta paginada e contagem total em paralelo
    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: events.id,
          vehicleId: events.vehicleId,
          type: events.type,
          timestamp: events.timestamp,
          description: events.description,
          attributes: events.attributes,
          lat: events.lat,
          lng: events.lng,
          speed: events.speed,
          heading: events.heading,
          vehicleName: vehicles.name,
          licensePlate: vehicles.plate
        })
        .from(events)
        .innerJoin(vehicles, eq(events.vehicleId, vehicles.id))
        .where(whereClause)
        .orderBy(sort === 'asc' ? asc(events.timestamp) : desc(events.timestamp))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(events)
        .innerJoin(vehicles, eq(events.vehicleId, vehicles.id))
        .where(whereClause),
    ]);

    // Formatar resultados
    const formattedEvents = rows.map(event => ({
      id: event.id,
      vehicle_id: event.vehicleId,
      vehicleName: event.vehicleName || 'Veículo desconhecido',
      licensePlate: event.licensePlate,
      type: event.type,
      timestamp: event.timestamp,
      details: event.attributes ?? event.description ?? null,
      position: event.lat != null && event.lng != null
        ? {
            latitude: event.lat,
            longitude: event.lng,
            speed: event.speed ?? undefined,
            heading: event.heading ?? undefined
          }
        : undefined
    }));

    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        total: totalRow?.value || 0,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Erro ao processar requisição de eventos:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
