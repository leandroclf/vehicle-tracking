import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Esquema para validar dados de alteração de senha
const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(6, 'A senha atual deve ter pelo menos 6 caracteres'),
  newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const passwordResult = passwordUpdateSchema.safeParse(body);
    
    if (!passwordResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dados inválidos', 
        details: passwordResult.error.format() 
      }, { status: 400 });
    }
    
    const { currentPassword, newPassword } = passwordResult.data;
    
    // Buscar usuário para verificar email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }
    
    // Verificar a senha atual usando o Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword
    });
    
    if (signInError || !signInData.user) {
      console.error('Erro ao verificar senha atual:', signInError);
      return NextResponse.json({ 
        success: false, 
        error: 'Senha atual incorreta' 
      }, { status: 400 });
    }
    
    // Atualizar a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar senha', 
        details: updateError.message 
      }, { status: 500 });
    }
    
    // Registrar atualização de senha no log
    console.log(`Senha atualizada com sucesso para o usuário ${userId}`);
    
    // Retornar sucesso
    return NextResponse.json({ 
      success: true, 
      message: 'Senha atualizada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 