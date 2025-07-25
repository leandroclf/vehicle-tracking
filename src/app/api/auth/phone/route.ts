import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquemas de validação
const sendOTPSchema = z.object({
  phone: z.string().min(10, 'Número de telefone inválido')
});

const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Número de telefone inválido'),
  token: z.string().length(6, 'Código deve ter 6 dígitos')
});

// POST - Enviar código OTP via SMS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = sendOTPSchema.parse(body);

    // Enviar OTP via Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      console.error('Erro ao enviar OTP:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao enviar código de verificação',
          details: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Código de verificação enviado via SMS',
      data: {
        phone: phone,
        messageId: data?.messageUuid
      }
    });

  } catch (error) {
    console.error('Erro na API de phone auth:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// PUT - Verificar código OTP
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, token } = verifyOTPSchema.parse(body);

    // Verificar OTP via Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    });

    if (error) {
      console.error('Erro ao verificar OTP:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Código de verificação inválido ou expirado',
          details: error.message 
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Falha na autenticação' 
        },
        { status: 401 }
      );
    }

    // Verificar se é um novo usuário
    const isNewUser = data.user.created_at === data.user.last_sign_in_at;

    // Se for novo usuário, criar perfil
    if (isNewUser) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          phone: phone,
          name: `Usuário ${phone.slice(-4)}`, // Nome temporário
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Não falhar a autenticação por causa do perfil
      }
    }

    return NextResponse.json({
      success: true,
      message: isNewUser ? 'Conta criada e autenticada com sucesso' : 'Autenticado com sucesso',
      data: {
        user: {
          id: data.user.id,
          phone: data.user.phone,
          email: data.user.email,
          isNewUser
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        }
      }
    });

  } catch (error) {
    console.error('Erro na verificação de OTP:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}