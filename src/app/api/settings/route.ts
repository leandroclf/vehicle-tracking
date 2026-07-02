import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { userSettings } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Esquema para validar dados de configurações gerais (persistidas em
// user_settings.preferences, mescladas às existentes)
const settingsSchema = z.object({
  company_name: z.string().optional().nullable(),
  notification_email: z.string().email('Email inválido').optional().nullable(),
  notification_sms: z.boolean().optional(),
  notification_push: z.boolean().optional(),
  language: z.string().min(2, 'Código de idioma inválido').optional(),
  timezone: z.string().optional(),
  distance_unit: z.enum(['km', 'mi']).optional(),
  speed_unit: z.enum(['kmh', 'mph']).optional(),
  fuel_unit: z.enum(['liter', 'gallon']).optional(),
  temperature_unit: z.enum(['C', 'F']).optional(),
  map_type: z.enum(['roadmap', 'satellite', 'hybrid', 'terrain']).optional(),
  default_view: z.enum(['map', 'list', 'dashboard']).optional(),
  show_traffic: z.boolean().optional(),
  alert_sound: z.boolean().optional(),
  dark_mode: z.boolean().optional(),
  auto_refresh: z.number().int().min(0).optional()
});

/**
 * GET /api/settings
 * Agregador das configurações persistidas do usuário
 * (preferences + notifications de user_settings).
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: authResult.status || 401 }
      );
    }

    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, authResult.user.id))
      .limit(1);

    return NextResponse.json({
      preferences: row?.preferences ?? {},
      notifications: row?.notifications ?? {},
      updated_at: row?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/settings
 * Mescla configurações gerais em user_settings.preferences (upsert).
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: authResult.status || 401 }
      );
    }

    const body = await request.json();
    const settingsResult = settingsSchema.safeParse(body);

    if (!settingsResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: settingsResult.error.format() },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(userSettings)
      .values({
        userId: authResult.user.id,
        preferences: settingsResult.data,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          // Mescla jsonb: preferências existentes + novas
          preferences: sql`${userSettings.preferences} || ${JSON.stringify(settingsResult.data)}::jsonb`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({
      preferences: row.preferences,
      message: 'Configurações atualizadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
