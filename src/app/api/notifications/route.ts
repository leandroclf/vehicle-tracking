import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { db } from '@/lib/database';
import { notifications } from '@/lib/schema';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  read: z.enum(['read', 'unread', 'all', 'true', 'false']).optional().default('all'),
  sort: z.enum(['asc', 'desc']).optional().default('desc')
});

// Esquema para marcar notificações como lidas
// Aceita { id } (uma) ou { ids: [...] } (várias); sem ambos, marca todas.
const markReadSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  ids: z.array(z.coerce.number().int().positive()).optional(),
  read: z.boolean().optional().default(true),
});

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = AuthService.extractTokenFromHeader(authHeader || '');
  if (!token) return null;
  try {
    return await AuthService.verifyToken(token);
  } catch {
    return null;
  }
}

function toApiShape(row: typeof notifications.$inferSelect) {
  return {
    id: String(row.id),
    user_id: row.userId,
    type: row.type,
    title: row.title,
    message: row.message ?? '',
    link: row.link ?? undefined,
    read: row.read ?? false,
    timestamp: row.createdAt ? row.createdAt.toISOString() : null,
    created_at: row.createdAt,
  };
}

/**
 * GET /api/notifications — lista notificações persistidas do usuário autenticado.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros de consulta inválidos', details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { limit, offset, read, sort } = queryResult.data;

    const conditions = [eq(notifications.userId, user.id)];
    if (read === 'read' || read === 'true') conditions.push(eq(notifications.read, true));
    if (read === 'unread' || read === 'false') conditions.push(eq(notifications.read, false));

    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(sort === 'asc' ? asc(notifications.createdAt) : desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(notifications)
        .where(and(...conditions)),
    ]);

    // Array na raiz (contrato dos consumidores atuais) com paginação em header
    const response = NextResponse.json(rows.map(toApiShape));
    response.headers.set('X-Total-Count', String(totalRow?.value ?? 0));
    return response;
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications — marca notificações como lidas (persistido).
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { id, ids, read } = parsed.data;
    const targetIds = id ? [id] : ids ?? [];

    const conditions = [eq(notifications.userId, user.id)];
    if (targetIds.length > 0) {
      conditions.push(inArray(notifications.id, targetIds));
    }

    const updated = await db
      .update(notifications)
      .set({ read })
      .where(and(...conditions))
      .returning({ id: notifications.id });

    return NextResponse.json({ success: true, updated: updated.length });
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
