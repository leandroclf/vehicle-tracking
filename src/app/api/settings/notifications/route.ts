import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getDbPool } from '@/lib/database';
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
    const pool = getDbPool();
    const settingsQuery = `
      SELECT notification_settings
      FROM user_settings
      WHERE user_id = $1
    `;
    const settingsResult = await pool.query(settingsQuery, [userId]);
    const settings = settingsResult.rows[0];

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
    const pool = getDbPool();
    const checkQuery = `
      SELECT id
      FROM user_settings
      WHERE user_id = $1
    `;
    const checkResult = await pool.query(checkQuery, [userId]);
    const existingSettings = checkResult.rows[0];

    let result;
    
    // Se já existir, atualizar; caso contrário, inserir
    if (existingSettings) {
      // Atualizar configurações existentes
      const updateQuery = `
        UPDATE user_settings
        SET notification_settings = $1, updated_at = $2
        WHERE user_id = $3
        RETURNING notification_settings
      `;
      const updateResult = await pool.query(updateQuery, [
        JSON.stringify(notificationSettings),
        new Date().toISOString(),
        userId
      ]);
      result = { data: updateResult.rows[0], error: null };
    } else {
      // Inserir novas configurações
      const insertQuery = `
        INSERT INTO user_settings (
          user_id, notification_settings, created_at, updated_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING notification_settings
      `;
      const insertResult = await pool.query(insertQuery, [
        userId,
        JSON.stringify(notificationSettings),
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      result = { data: insertResult.rows[0], error: null };
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