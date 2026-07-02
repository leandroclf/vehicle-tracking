import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { alerts, vehicles } from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';

async function markAllRead(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Não autorizado' },
      { status: authResult.status || 401 }
    );
  }

  const owned = await db
    .select({ id: alerts.id })
    .from(alerts)
    .innerJoin(vehicles, eq(alerts.vehicleId, vehicles.id))
    .where(and(eq(vehicles.userId, authResult.user.id), eq(alerts.isRead, false)));

  if (owned.length > 0) {
    await db
      .update(alerts)
      .set({ isRead: true })
      .where(inArray(alerts.id, owned.map(row => row.id)));
  }

  return NextResponse.json({
    message: 'Todos os alertas marcados como lidos',
    count: owned.length,
  });
}

// Handler para marcar TODOS os alertas como lidos
export async function PUT(request: NextRequest) {
  try {
    return await markAllRead(request);
  } catch (error) {
    console.error('Erro ao marcar todos os alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Alias POST (contrato usado pelo NotificationsProvider)
export async function POST(request: NextRequest) {
  return PUT(request);
}
