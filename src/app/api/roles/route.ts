import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-middleware';

// GET /api/roles
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Checagem de permissão: apenas administradores
  // TODO: Implementar query SQL direta
  const profile = null;`r`n    const profileError = null;`r`n    // await pool.query(...)
  // .from('profiles')
  // .select('role_id, roles(name)')
  // .eq('id', auth.user.id)
  // .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  const roleName = Array.isArray(profile.roles) ? (profile.roles[0] as any)?.name : (profile.roles as any)?.name;
  if (!profile || roleName !== 'Administrador') {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
  }

  // TODO: Implementar query SQL direta
  const data = null;`r`n    const error = null;`r`n    // await pool.query(...).from('roles').select('id, name').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}