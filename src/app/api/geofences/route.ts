import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { geofences } from '@/lib/schema';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { checkEntitlement } from '@/lib/product-harness/entitlements';
import { createProductEvent, emitProductEvent } from '@/lib/product-harness/events';
import { configureProductHarness } from '@/lib/product-harness/configure';
import { toSalesSignal } from '@/lib/product-harness/sales-signals';
import { enqueueSalesSignal } from '@/lib/product-harness/sales-outbox';

configureProductHarness();

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sort: z.enum(['asc', 'desc']).optional().default('asc')
});

// Esquema para validar dados de criação/atualização de geocerca
const geofenceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  type: z.enum(['circle', 'polygon', 'rectangle']),
  coordinates: z.string().min(1, 'Coordenadas são obrigatórias'),
  radius: z.number().positive().optional(),
  color: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  vehicle_ids: z.array(z.string()).optional()
});

// A cor da geocerca é persistida junto às coordenadas (jsonb) sob a chave
// reservada `_color`, já que a tabela não tem coluna própria para isso.
function parseCoordinates(raw: string, color?: string): Record<string, unknown> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    parsed = { raw };
  }
  if (color) parsed._color = color;
  return parsed;
}

function toApiShape(row: typeof geofences.$inferSelect) {
  const stored = (row.coordinates ?? {}) as Record<string, unknown>;
  const { _color, ...coords } = stored;
  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? undefined,
    type: row.type as 'circle' | 'polygon' | 'rectangle',
    radius: row.radius ?? undefined,
    coordinates: JSON.stringify(coords),
    color: typeof _color === 'string' ? _color : undefined,
    status: row.isActive ? 'active' : 'inactive',
    user_id: row.userId,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

// Handler para listar geocercas (GET)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }

    const userId = authResult.user.id;

    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parâmetros de consulta inválidos', details: queryResult.error.format() }, { status: 400 });
    }

    const { limit, offset, status, sort } = queryResult.data;

    const conditions = [eq(geofences.userId, userId)];
    if (status !== 'all') {
      conditions.push(eq(geofences.isActive, status === 'active'));
    }

    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(geofences)
        .where(and(...conditions))
        .orderBy(sort === 'asc' ? asc(geofences.name) : desc(geofences.name))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(geofences)
        .where(and(...conditions)),
    ]);

    return NextResponse.json({
      geofences: rows.map(toApiShape),
      pagination: {
        total: totalRow?.value ?? 0,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para criar geocerca (POST)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }

    const userId = authResult.user.id;

    const body = await request.json();
    const geofenceResult = geofenceSchema.safeParse(body);

    if (!geofenceResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: geofenceResult.error.format() }, { status: 400 });
    }

    const { name, description, type, coordinates, radius, color, status } = geofenceResult.data;

    const configuredLimit = Number.parseInt(process.env.FREE_GEOFENCE_LIMIT || '', 10);
    if (Number.isFinite(configuredLimit) && configuredLimit >= 0) {
      const [usageRow] = await db
        .select({ value: count() })
        .from(geofences)
        .where(eq(geofences.userId, userId));

      const decision = checkEntitlement({
        plan: 'free',
        capability: 'geofences',
        usage: usageRow?.value ?? 0,
        limits: { geofences: configuredLimit },
      });

      if (!decision.allowed) {
        const productEvent = createProductEvent('limit_reached', {
          user_id: userId,
          account_id: userId,
          plan_id: decision.plan,
          feature: decision.capability,
          outcome: decision.reason,
        });
        await emitProductEvent(productEvent);
        const salesSignal = toSalesSignal(productEvent);
        if (salesSignal) await enqueueSalesSignal(salesSignal);
        return NextResponse.json({
          error: 'Limite de geocercas atingido',
          code: 'ENTITLEMENT_LIMIT_REACHED',
          entitlement: decision,
        }, { status: 403 });
      }
    }

    const [newGeofence] = await db
      .insert(geofences)
      .values({
        userId,
        name,
        description,
        type,
        coordinates: parseCoordinates(coordinates, color),
        radius,
        isActive: status === 'active',
      })
      .returning();

    return NextResponse.json(toApiShape(newGeofence), { status: 201 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar geocerca (PUT)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }

    const userId = authResult.user.id;

    const body = await request.json();

    if (!body || typeof body !== 'object' || !('id' in body)) {
      return NextResponse.json({ error: 'ID da geocerca é obrigatório' }, { status: 400 });
    }

    const id = parseInt(String((body as { id: unknown }).id), 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID da geocerca inválido' }, { status: 400 });
    }

    const geofenceData: Record<string, unknown> = { ...body };
    delete geofenceData.id;

    const geofenceResult = geofenceSchema.partial().safeParse(geofenceData);

    if (!geofenceResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: geofenceResult.error.format() }, { status: 400 });
    }

    const [existingGeofence] = await db
      .select({ id: geofences.id })
      .from(geofences)
      .where(and(eq(geofences.id, id), eq(geofences.userId, userId)))
      .limit(1);

    if (!existingGeofence) {
      return NextResponse.json({ error: 'Geocerca não encontrada' }, { status: 404 });
    }

    const { name, description, type, coordinates, radius, color, status } = geofenceResult.data;

    const [updatedGeofence] = await db
      .update(geofences)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(coordinates !== undefined && { coordinates: parseCoordinates(coordinates, color) }),
        ...(radius !== undefined && { radius }),
        ...(status !== undefined && { isActive: status === 'active' }),
        updatedAt: new Date(),
      })
      .where(and(eq(geofences.id, id), eq(geofences.userId, userId)))
      .returning();

    return NextResponse.json(toApiShape(updatedGeofence));
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para excluir geocerca (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }

    const userId = authResult.user.id;

    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ error: 'ID da geocerca é obrigatório' }, { status: 400 });
    }

    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID da geocerca inválido' }, { status: 400 });
    }

    const deleted = await db
      .delete(geofences)
      .where(and(eq(geofences.id, id), eq(geofences.userId, userId)))
      .returning({ id: geofences.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Geocerca não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
