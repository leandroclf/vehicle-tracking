import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { db } from '@/lib/database';
import { users, profiles } from '@/lib/schema';
import { eq, ilike, or, and } from 'drizzle-orm';

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Verificar se é administrador
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }

    // Paginação e busca
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    // Construir query
    let whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(profiles.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    if (roleFilter) {
      whereConditions.push(eq(users.role, roleFilter));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Buscar usuários com perfis
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        name: profiles.name,
        phone: profiles.phone,
        avatarUrl: profiles.avatarUrl,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(profiles.name);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}