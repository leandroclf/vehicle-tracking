import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-middleware';

// PUT /api/users/[id]/role
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAuth(request);
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Checagem de permissão: apenas administradores
  // TODO: Implementar query SQL direta
  const pool = getDbPool();
  const profileQuery = `
    SELECT p.role_id, r.name as role_name
    FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = $1
  `;
  const profileResult = await pool.query(profileQuery, [auth.user.id]);
  const profile = profileResult.rows[0];
  const profileError = null;
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  const roleName = profile?.role_name;
  if (!profile || roleName !== 'Administrador') {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
  }

  const body = (await request.json()) as { role_id?: string };
  const role_id = body.role_id;
  if (!role_id) return NextResponse.json({ error: 'role_id é obrigatório' }, { status: 400 });

  // Validar se o role_id existe
  const roleQuery = `
    SELECT id
    FROM roles
    WHERE id = $1
  `;
  const roleResult = await pool.query(roleQuery, [role_id]);
  const role = roleResult.rows[0];
  if (!role) return NextResponse.json({ error: 'Perfil/role não encontrado' }, { status: 400 });

  // TODO: Implementar query SQL direta
  const updateQuery = `
    UPDATE profiles
    SET role_id = $1
    WHERE id = $2
    RETURNING id, role_id
  `;
  const updateResult = await pool.query(updateQuery, [role_id, params.id]);
  const data = updateResult.rows[0];
  const error = null;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}