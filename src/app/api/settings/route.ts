import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Esquema para validar dados de configurações
const settingsSchema = z.object({
  notification_email: z.string().email('Email inválido').optional().nullable(),
  notification_sms: z.boolean().optional(),
  notification_push: z.boolean().optional(),
  language: z.string().min(2, 'Código de idioma inválido').optional(),
  timezone: z.string().optional(),
  distance_unit: z.enum(['km', 'mi']).optional(),
  temperature_unit: z.enum(['C', 'F']).optional(),
  map_type: z.enum(['roadmap', 'satellite', 'hybrid', 'terrain']).optional(),
  default_view: z.enum(['map', 'list', 'dashboard']).optional(),
  alert_sound: z.boolean().optional(),
  dark_mode: z.boolean().optional(),
  auto_refresh: z.number().int().min(0).optional()
});

// Handler para obter configurações do usuário (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Buscar configurações do usuário
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }
    
    // Se não existirem configurações, retornar valores padrão
    if (!settings) {
      const defaultSettings = {
        notification_email: null,
        notification_sms: false,
        notification_push: true,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        distance_unit: 'km',
        temperature_unit: 'C',
        map_type: 'roadmap',
        default_view: 'map',
        alert_sound: true,
        dark_mode: false,
        auto_refresh: 30
      };
      
      return NextResponse.json(defaultSettings);
    }
    
    // Retornar configurações encontradas
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar configurações (PUT)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const settingsResult = settingsSchema.safeParse(body);
    
    if (!settingsResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: settingsResult.error.format() }, { status: 400 });
    }
    
    const settingsData = settingsResult.data;
    
    // Verificar se já existem configurações para o usuário
    const { data: existingSettings, error: checkError } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar configurações existentes:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar configurações existentes' }, { status: 500 });
    }
    
    let result;
    
    if (existingSettings) {
      // Atualizar configurações existentes
      const { data: updatedSettings, error: updateError } = await supabase
        .from('settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Erro ao atualizar configurações:', updateError);
        return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
      }
      
      result = updatedSettings;
    } else {
      // Criar novas configurações
      const { data: newSettings, error: insertError } = await supabase
        .from('settings')
        .insert({
          ...settingsData,
          user_id: userId
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao criar configurações:', insertError);
        return NextResponse.json({ error: 'Erro ao criar configurações' }, { status: 500 });
      }
      
      result = newSettings;
    }
    
    // Retornar configurações atualizadas/criadas
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}