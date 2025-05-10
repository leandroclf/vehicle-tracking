import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth-middleware';

// PUT /api/users/[id]/role
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAuth(request);
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Checagem de permissão: apenas administradores
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role_id, roles(name)')
    .eq('id', auth.user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  const roleName = Array.isArray(profile.roles) ? (profile.roles[0] as any)?.name : (profile.roles as any)?.name;
  if (!profile || roleName !== 'Administrador') {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
  }

  const body = (await request.json()) as { role_id?: string };
  const role_id = body.role_id;
  if (!role_id) return NextResponse.json({ error: 'role_id é obrigatório' }, { status: 400 });

  // Validar se o role_id existe
  const { data: role } = await supabase.from('roles').select('id').eq('id', role_id).single();
  if (!role) return NextResponse.json({ error: 'Perfil/role não encontrado' }, { status: 400 });

  const { data, error } = await supabase
    .from('profiles')
    .update({ role_id })
    .eq('id', params.id)
    .select('id, role_id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
} 