import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-middleware';

// GET /api/roles
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // Checagem de permissão: apenas administradores
    const pool = getDbPool();
    const profileQuery = `
      SELECT p.role_id, r.name as role_name
      FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = $1
    `;
    const profileResult = await pool.query(profileQuery, [auth.user.id]);
    const profile = profileResult.rows[0] as { role_id: string; role_name: string } | undefined;
    if (!profile || profile.role_name !== 'Administrador') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const rolesResult = await pool.query('SELECT id, name FROM roles ORDER BY name');

    return NextResponse.json(rolesResult.rows);
  } catch (error) {
    console.error('Erro ao listar perfis de acesso:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
