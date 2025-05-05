import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar dados de atualização de perfil
const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().optional(),
  preferences: z.record(z.any()).optional()
});

// Handler para obter perfil do usuário (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Buscar dados do perfil no Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar dados do perfil' 
      }, { status: 500 });
    }
    
    if (!profile) {
      return NextResponse.json({ 
        error: 'Perfil não encontrado' 
      }, { status: 404 });
    }
    
    // Buscar dados do usuário na tabela auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      userId
    );
    
    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      // Continuar apenas com dados do perfil se não conseguir buscar dados de autenticação
    }
    
    // Combinar dados do perfil com dados do usuário autenticado
    const completeProfile = {
      id: profile.id,
      name: profile.name,
      email: userData?.user?.email || authResult.user.email,
      phone: profile.phone,
      preferences: profile.preferences || {},
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };
    
    return NextResponse.json(completeProfile);
    
  } catch (error) {
    console.error('Erro ao processar requisição de perfil:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para atualizar perfil (PUT)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const profileResult = profileSchema.safeParse(body);
    
    if (!profileResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: profileResult.error.format() 
      }, { status: 400 });
    }
    
    const profileData = profileResult.data;
    
    // Verificar se o perfil existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar perfil existente:', checkError);
      return NextResponse.json({ 
        error: 'Erro ao verificar perfil existente' 
      }, { status: 500 });
    }
    
    let updatedProfile;
    
    // Se o perfil não existir, criar um novo
    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        return NextResponse.json({ 
          error: 'Erro ao criar perfil' 
        }, { status: 500 });
      }
      
      updatedProfile = newProfile;
    } 
    // Se o perfil existir, atualizá-lo
    else {
      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        return NextResponse.json({ 
          error: 'Erro ao atualizar perfil' 
        }, { status: 500 });
      }
      
      updatedProfile = profile;
    }
    
    // Buscar dados do usuário na tabela auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      userId
    );
    
    if (userError) {
      console.error('Erro ao buscar dados do usuário após atualização:', userError);
      // Continuar apenas com dados do perfil se não conseguir buscar dados de autenticação
    }
    
    // Retornar perfil atualizado
    const completeProfile = {
      ...updatedProfile,
      email: userData?.user?.email || authResult.user.email
    };
    
    return NextResponse.json({
      success: true,
      user: completeProfile
    });
    
  } catch (error) {
    console.error('Erro ao processar atualização de perfil:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 