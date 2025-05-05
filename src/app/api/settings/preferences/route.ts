import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar dados de preferências
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  sidebar_collapsed: z.boolean().default(false),
  dashboard_layout: z.enum(['compact', 'detailed', 'grid']).default('detailed'),
  favorite_vehicles: z.array(z.string()).default([]),
  default_page: z.enum(['dashboard', 'map', 'vehicles', 'reports']).default('dashboard'),
  map_settings: z.object({
    default_zoom: z.number().int().min(1).max(20).default(13),
    show_traffic: z.boolean().default(true),
    show_weather: z.boolean().default(false),
    style: z.enum(['standard', 'satellite', 'terrain', 'night']).default('standard')
  }).default({})
});

// Função para estruturar respostas de erro de forma consistente
function errorResponse(message: string, details?: any, status: number = 400) {
  return NextResponse.json({ 
    success: false,
    error: message,
    details: details || undefined
  }, { status });
}

// Função para estruturar respostas de sucesso de forma consistente
function successResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json({ 
    success: true,
    message,
    data
  }, { status });
}

// Handler para obter preferências do usuário (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return errorResponse(
        authResult.error || 'Não autorizado',
        undefined,
        authResult.status || 401
      );
    }
    
    const userId = authResult.user.id;
    
    // Buscar preferências do usuário
    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
      console.error('Erro ao buscar preferências:', error);
      return errorResponse('Erro ao buscar preferências', undefined, 500);
    }
    
    // Se não existirem preferências, retornar valores padrão
    const defaultPreferences = {
      theme: 'system',
      sidebar_collapsed: false,
      dashboard_layout: 'detailed',
      favorite_vehicles: [],
      default_page: 'dashboard',
      map_settings: {
        default_zoom: 13,
        show_traffic: true,
        show_weather: false,
        style: 'standard'
      }
    };
    
    const preferences = userSettings?.preferences || defaultPreferences;
    
    return successResponse({ preferences });
    
  } catch (error) {
    console.error('Erro ao processar requisição de preferências:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
}

// Handler para atualizar preferências (PUT)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return errorResponse(
        authResult.error || 'Não autorizado',
        undefined,
        authResult.status || 401
      );
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const preferencesResult = preferencesSchema.safeParse(body);
    
    if (!preferencesResult.success) {
      return errorResponse(
        'Dados inválidos', 
        preferencesResult.error.format()
      );
    }
    
    const preferencesData = preferencesResult.data;
    
    // Verificar se o usuário já tem configurações
    const { data: existingSettings, error: checkError } = await supabase
      .from('user_settings')
      .select('id, preferences')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar configurações existentes:', checkError);
      return errorResponse('Erro ao verificar configurações existentes', undefined, 500);
    }
    
    let result;
    
    if (existingSettings) {
      // Mesclar preferências existentes com as novas
      const updatedPreferences = {
        ...existingSettings.preferences,
        ...preferencesData
      };
      
      // Atualizar registro existente
      const { data, error: updateError } = await supabase
        .from('user_settings')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('preferences')
        .single();
      
      if (updateError) {
        console.error('Erro ao atualizar preferências:', updateError);
        return errorResponse('Erro ao atualizar preferências', undefined, 500);
      }
      
      result = data;
    } else {
      // Criar novo registro
      const { data, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          preferences: preferencesData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('preferences')
        .single();
      
      if (insertError) {
        console.error('Erro ao criar registro de preferências:', insertError);
        return errorResponse('Erro ao salvar preferências', undefined, 500);
      }
      
      result = data;
    }
    
    return successResponse(
      { preferences: result.preferences },
      'Preferências atualizadas com sucesso'
    );
    
  } catch (error) {
    console.error('Erro ao processar atualização de preferências:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
} 