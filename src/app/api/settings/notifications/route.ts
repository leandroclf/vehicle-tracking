import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar dados de notificações
const notificationsSchema = z.object({
  email_notifications: z.boolean().default(true),
  push_notifications: z.boolean().default(true),
  sms_notifications: z.boolean().default(false),
  notification_types: z.array(
    z.enum(['geocerca', 'velocidade', 'bateria', 'ignição', 'movimento'])
  ).default(['geocerca', 'velocidade', 'bateria']),
  time_threshold: z.number().int().min(0).max(60).default(15) // minutos
});

// Handler para obter configurações de notificações
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Buscar configurações de notificação existentes
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('notification_settings')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
      console.error('Erro ao buscar configurações de notificação:', error);
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }
    
    // Se não encontrar configurações, retornar padrões
    const notificationSettings = settings?.notification_settings || {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      notification_types: ['geocerca', 'velocidade', 'bateria'],
      time_threshold: 15
    };
    
    return NextResponse.json({ settings: { notifications: notificationSettings } });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar configurações de notificações
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Obter e validar corpo da requisição
    const body = await request.json();
    const validationResult = notificationsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validationResult.error.format() }, { status: 400 });
    }
    
    const notificationSettings = validationResult.data;
    
    // Verificar se o usuário já tem configurações
    const { data: existingSettings, error: checkError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Erro ao verificar configurações existentes:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar configurações existentes' }, { status: 500 });
    }
    
    let result;
    
    // Se já existir, atualizar; caso contrário, inserir
    if (existingSettings) {
      // Atualizar configurações existentes
      result = await supabase
        .from('user_settings')
        .update({
          notification_settings: notificationSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('notification_settings')
        .single();
    } else {
      // Inserir novas configurações
      result = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          notification_settings: notificationSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('notification_settings')
        .single();
    }
    
    // Verificar erro na operação
    if (result.error) {
      console.error('Erro ao salvar configurações de notificação:', result.error);
      return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
    }
    
    // Retornar configurações atualizadas
    return NextResponse.json({ 
      settings: { 
        notifications: result.data.notification_settings 
      },
      message: 'Configurações de notificação atualizadas com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 