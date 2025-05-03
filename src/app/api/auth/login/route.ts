import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabaseClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    console.log('Tentativa de login para:', email);

    // Validação básica
    if (!email || !password) {
      console.log('Erro: Email ou senha não fornecidos');
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    // Verificação do status do Supabase
    console.log('Verificando status do Supabase antes da autenticação');
    
    try {
      // Verificar se o serviço de autenticação está acessível
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Erro ao acessar serviço de autenticação:', authError);
        return NextResponse.json({ 
          error: 'Erro de conexão com o serviço de autenticação', 
          details: authError.message 
        }, { status: 500 });
      }
      
      console.log('Serviço de autenticação do Supabase está respondendo');
    } catch (connError) {
      console.error('Exceção ao verificar serviço de autenticação:', connError);
      return NextResponse.json({ 
        error: 'Falha na conexão com o serviço de autenticação', 
        details: connError instanceof Error ? connError.message : 'Erro desconhecido' 
      }, { status: 500 });
    }
    
    // Verificar se o usuário existe antes de tentar autenticar
    console.log('Verificando se o usuário existe:', email);
    
    // Autenticação direta com Supabase
    console.log('Iniciando autenticação com Supabase para:', email);
    console.log('Credenciais: email:', email, 'senha:', password ? '******' : 'não fornecida');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // Log detalhado do erro de autenticação
    if (error) {
      console.error('Erro detalhado de autenticação:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Credenciais inválidas', details: error.message }, { status: 401 });
    }

    if (!data.user) {
      console.error('Usuário não encontrado após autenticação');
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    console.log('Autenticação bem-sucedida, buscando dados do usuário');

    // Buscar dados adicionais do usuário na tabela profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('id', data.user.id)
      .single();

    // Se não encontrar ou ocorrer erro ao buscar o perfil, criar um objeto de usuário a partir dos dados da autenticação
    if (profileError || !profileData) {
      console.log('Perfil não encontrado ou erro, usando dados da autenticação:', profileError?.message);
      
      // Criar perfil automaticamente se não existir
      if (profileError && profileError.message.includes('não encontrada')) {
        console.log('Tentando criar perfil automaticamente para o usuário');
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0] || 'Usuário',
            updated_at: new Date().toISOString()
          });
        } catch (createProfileError) {
          console.error('Erro ao criar perfil automaticamente:', createProfileError);
        }
      }
      
      // Usar dados do usuário autenticado
      const userData = {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || email.split('@')[0] || 'Usuário'
      };
      
      // Gerar token com os dados disponíveis
      const token = generateToken(userData);
      
      console.log('Token gerado com dados da autenticação:', token ? 'Sucesso' : 'Falha');
      
      return NextResponse.json({
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name
        },
        token
      }, { status: 200 });
    }

    // Combinar dados do perfil com dados da autenticação
    const userData = {
      id: data.user.id,
      email: data.user.email || email,
      name: profileData.name || data.user.user_metadata?.name || 'Usuário',
      phone: profileData.phone
    };

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
      user: userData,
      token
    }, { status: 200 });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}