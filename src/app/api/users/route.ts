import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { db, getDbPool } from '@/lib/database';
import { users } from '@/lib/schema';
import { count, ilike, or } from 'drizzle-orm';

/**
 * Verifica se o usuário autenticado é administrador segundo o modelo
 * de papéis usado pelas demais rotas administrativas (roles/profiles.role_id).
 * Sem as tabelas de RBAC provisionadas, a checagem falha fechada (403).
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const pool = getDbPool();
    const result = await pool.query(
      `SELECT r.name AS role_name
       FROM profiles p
       JOIN roles r ON p.role_id = r.id
       WHERE p.id = $1`,
      [userId]
    );
    const roleName = (result.rows[0] as { role_name?: string } | undefined)?.role_name;
    return roleName === 'Administrador';
  } catch {
    // Tabelas de RBAC ausentes ou erro na consulta: nega acesso.
    return false;
  }
}

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    // Extrair token de autenticação
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação necessário' }, { status: 401 });
    }

    // Verificar token e obter usuário
    let user;
    try {
      user = await AuthService.verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // Verificar se é administrador
    if (!(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }

    // Paginação e busca
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;
    const search = searchParams.get('search') || '';

    const searchCondition = search
      ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      : undefined;

    const [totalResult] = searchCondition
      ? await db.select({ count: count() }).from(users).where(searchCondition)
      : await db.select({ count: count() }).from(users);

    const baseQuery = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    const rows = searchCondition
      ? await baseQuery.where(searchCondition).limit(limit).offset(offset)
      : await baseQuery.limit(limit).offset(offset);

    return NextResponse.json({
      data: rows,
      total: totalResult?.count ?? rows.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
