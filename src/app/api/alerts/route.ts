import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth, validateBody, validateQuery, respondWithError } from '@/lib/api-utils';
import { db } from '@/lib/database';
import { alerts, vehicles } from '@/lib/schema';
import { and, count, desc, asc, eq, inArray } from 'drizzle-orm';

// Esquema para validação de parâmetros de consulta
const querySchema = z.object({
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0),
  read: z.union([
    z.literal('true').transform(() => true),
    z.literal('false').transform(() => false),
    z.string().optional().transform(() => undefined)
  ]).optional(),
  vehicle_id: z.coerce.number().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc')
});

// Corpo do PATCH: aceita `alertIds` (contrato original) ou `ids` (alias)
const markReadSchema = z.object({
  alertIds: z.array(z.coerce.number().int().positive()).optional(),
  ids: z.array(z.coerce.number().int().positive()).optional(),
}).refine(data => (data.alertIds?.length || 0) + (data.ids?.length || 0) > 0, {
  message: 'Pelo menos um ID de alerta é necessário',
});

// Handler para obter alertas (GET) — escopo por usuário via join com vehicles
export const GET = withApiAuth(async (req, { user }) => {
  const queryResult = validateQuery(req, querySchema);
  if (queryResult.error) {
    return respondWithError(queryResult.error);
  }

  const { limit, offset, read, vehicle_id, sort } = queryResult.data!;

  const conditions = [eq(vehicles.userId, user.id)];
  if (read !== undefined) conditions.push(eq(alerts.isRead, read));
  if (vehicle_id) conditions.push(eq(alerts.vehicleId, vehicle_id));

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        alert: alerts,
        vehicleName: vehicles.name,
        vehiclePlate: vehicles.plate,
      })
      .from(alerts)
      .innerJoin(vehicles, eq(alerts.vehicleId, vehicles.id))
      .where(and(...conditions))
      .orderBy(sort === 'asc' ? asc(alerts.createdAt) : desc(alerts.createdAt))
      .limit(Math.min(limit, 200))
      .offset(offset),
    db
      .select({ value: count() })
      .from(alerts)
      .innerJoin(vehicles, eq(alerts.vehicleId, vehicles.id))
      .where(and(...conditions)),
  ]);

  const formattedAlerts = rows.map(({ alert, vehicleName, vehiclePlate }) => ({
    id: alert.id,
    vehicle_id: alert.vehicleId,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message ?? '',
    read: alert.isRead ?? false,
    resolved: alert.isResolved ?? false,
    timestamp: alert.createdAt,
    created_at: alert.createdAt,
    vehicleName,
    vehiclePlate,
  }));

  return NextResponse.json({
    alerts: formattedAlerts,
    data: formattedAlerts,
    pagination: {
      total: totalRow?.value ?? 0,
      limit,
      offset
    }
  });
});

// Handler para marcar alertas como lidos (PATCH) — persistido, escopo por usuário
export const PATCH = withApiAuth(async (req, { user }) => {
  const bodyResult = await validateBody(req, markReadSchema);
  if (bodyResult.error) {
    return respondWithError(bodyResult.error);
  }

  const alertIds = bodyResult.data!.alertIds ?? bodyResult.data!.ids ?? [];

  // Restringir aos alertas de veículos do usuário
  const ownedAlertIds = await db
    .select({ id: alerts.id })
    .from(alerts)
    .innerJoin(vehicles, eq(alerts.vehicleId, vehicles.id))
    .where(and(inArray(alerts.id, alertIds), eq(vehicles.userId, user.id)));

  if (ownedAlertIds.length === 0) {
    return NextResponse.json({ error: 'Nenhum alerta encontrado' }, { status: 404 });
  }

  await db
    .update(alerts)
    .set({ isRead: true })
    .where(inArray(alerts.id, ownedAlertIds.map(row => row.id)));

  return NextResponse.json({
    success: true,
    message: `${ownedAlertIds.length} alerta(s) marcado(s) como lido(s) com sucesso`
  });
});

// Handler para marcar todos os alertas como lidos (PUT)
export const PUT = withApiAuth(async (_req, { user }) => {
  const owned = await db
    .select({ id: alerts.id })
    .from(alerts)
    .innerJoin(vehicles, eq(alerts.vehicleId, vehicles.id))
    .where(and(eq(vehicles.userId, user.id), eq(alerts.isRead, false)));

  if (owned.length > 0) {
    await db
      .update(alerts)
      .set({ isRead: true })
      .where(inArray(alerts.id, owned.map(row => row.id)));
  }

  return NextResponse.json({
    success: true,
    count: owned.length,
    message: 'Todos os alertas marcados como lidos'
  });
});
