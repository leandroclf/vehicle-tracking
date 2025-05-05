import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RegisterRequest;
    const { name, email, phone, password } = body;

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    // Verificar se o email já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = não encontrado, que é o que queremos
      console.error('Erro ao verificar email existente:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar disponibilidade do email' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 });
    }

    // Registrar o usuário no Auth do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (authError) {
      console.error('Erro ao criar conta:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
    }

    // Inserir dados do usuário em nossa tabela personalizada
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          phone: phone || null,
          role: 'user', // Papel padrão para novos usuários
          created_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      console.error('Erro ao salvar dados do usuário:', insertError);
      
      // Tentar remover o usuário auth se não conseguirmos criar o perfil
      // para manter consistência
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json({ error: 'Erro ao criar perfil do usuário' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário registrado com sucesso. Por favor, verifique seu email para confirmar sua conta.'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 