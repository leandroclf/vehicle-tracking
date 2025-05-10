import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { findUserByEmail } from '@/lib/db/queries/users';
import { RegisterRequest, AuthResponse } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RegisterRequest;
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Registro nativo Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role: 'user' }
      }
    });
    if (error || !data || !data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Buscar perfil criado automaticamente
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    // Montar resposta
    const user = {
      ...data.user,
      name: profile?.name || name,
      email: data.user.email || email,
      role: data.user.role || 'user',
      created_at: data.user.created_at ? new Date(data.user.created_at) : new Date(),
      updated_at: data.user.updated_at ? new Date(data.user.updated_at) : undefined,
      profile
    };
    const token = data.session?.access_token || '';

    // Criar resposta com cookie
    const response = NextResponse.json<AuthResponse>({
      message: 'User registered successfully',
      token,
      user
    }, { status: 201 });

    if (token) {
      response.cookies.set('YUKZ_ACCESS_TOKEN', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    return response;
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bloquear outros métodos
export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

function methodNotAllowed() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 