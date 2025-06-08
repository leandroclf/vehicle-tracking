import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LoginRequest, AuthResponse } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Autenticação nativa Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data || !data.session || !data.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Buscar perfil vinculado
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    // Montar resposta
    const user = { 
      ...data.user, 
      name: profile?.name || '', 
      email: data.user.email || '', 
      role: data.user.role || '', 
      created_at: data.user.created_at ? new Date(data.user.created_at) : new Date(),
      updated_at: data.user.updated_at ? new Date(data.user.updated_at) : undefined,
      profile 
    };
    const token = data.session.access_token;

    // Criar resposta com cookie
    const response = NextResponse.json<AuthResponse>({
      message: 'Login successful',
      token,
      user
    });

    return response;
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bloquear outros métodos
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}