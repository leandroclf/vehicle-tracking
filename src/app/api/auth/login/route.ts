import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabaseClient';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    // Validação básica
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    // Autenticação com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      console.error('Erro de autenticação:', error);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Buscar dados adicionais do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, phone, role')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 });
    }

    // Gerar token JWT com dados do usuário
    const token = generateToken({
      id: userData.id,
      email: userData.email,
      name: userData.name
    });

    // Log para depuração
    console.log('Login bem-sucedido para:', email);
    console.log('Token gerado com sucesso, comprimento:', token.length);
    
    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role
      },
      token
    }, { status: 200 });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}