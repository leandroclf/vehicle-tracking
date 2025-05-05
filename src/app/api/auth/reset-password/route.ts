import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar dados de solicitação de recuperação de senha
const requestResetSchema = z.object({
  email: z.string().email('Email inválido')
});

// Esquema para validar nova senha
const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Token de recuperação é obrigatório'),
  newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres')
});

// Endpoint para solicitar recuperação de senha
export async function POST(request: NextRequest) {
  try {
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const requestResult = requestResetSchema.safeParse(body);
    
    if (!requestResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dados inválidos', 
        details: requestResult.error.format() 
      }, { status: 400 });
    }
    
    const { email } = requestResult.data;
    
    // Verificar se o email está cadastrado
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (userError) {
      console.error('Erro ao verificar usuário:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao verificar email' 
      }, { status: 500 });
    }
    
    // Mesmo se o usuário não existir, não informamos ao solicitante
    // por questões de segurança, para evitar enumeração de emails
    
    // Enviar email de recuperação de senha via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
    
    if (resetError) {
      console.error('Erro ao enviar email de recuperação:', resetError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao processar solicitação de recuperação de senha' 
      }, { status: 500 });
    }
    
    // Responder com sucesso
    return NextResponse.json({ 
      success: true, 
      message: 'Se este email estiver cadastrado, você receberá um link para redefinir sua senha' 
    });
    
  } catch (error) {
    console.error('Erro ao processar solicitação de recuperação:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Endpoint para definir nova senha
export async function PUT(request: NextRequest) {
  try {
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const resetResult = resetPasswordSchema.safeParse(body);
    
    if (!resetResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dados inválidos', 
        details: resetResult.error.format() 
      }, { status: 400 });
    }
    
    const { resetToken, newPassword } = resetResult.data;
    
    // Usar a sessão do token para atualizar a senha
    // Primeiro definimos o token de acesso
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: resetToken,
      refresh_token: '',
    });
    
    if (sessionError) {
      console.error('Erro ao verificar token de recuperação:', sessionError);
      return NextResponse.json({ 
        success: false, 
        error: 'O link de recuperação é inválido ou expirou. Por favor, solicite um novo link.' 
      }, { status: 401 });
    }
    
    // Depois atualizamos a senha com a sessão estabelecida
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (updateError) {
      console.error('Erro ao redefinir senha:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao redefinir senha', 
        details: updateError.message 
      }, { status: 500 });
    }
    
    // Retornar sucesso
    return NextResponse.json({ 
      success: true, 
      message: 'Senha redefinida com sucesso. Você já pode fazer login com sua nova senha.' 
    });
    
  } catch (error) {
    console.error('Erro ao processar redefinição de senha:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 