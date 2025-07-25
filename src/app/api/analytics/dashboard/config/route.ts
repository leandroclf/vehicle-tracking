/**
 * API Endpoints - Dashboard Configuration
 * @description Endpoints para gerenciar configurações do dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema para configuração de dashboard
const dashboardConfigSchema = z.object({
  layout: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number()
    }),
    config: z.record(z.any()).optional()
  })),
  filters: z.object({
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional(),
    vehicleIds: z.array(z.string()).optional(),
    driverIds: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional()
  }).optional(),
  refreshInterval: z.number().optional(),
  theme: z.enum(['light', 'dark']).optional()
});

/**
 * GET /api/analytics/dashboard/config
 * Retorna configuração do dashboard do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar configuração do dashboard
    const { data: config, error } = await supabase
      .from('dashboard_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    // Se não existe configuração, retornar configuração padrão
    if (!config) {
      const defaultConfig = {
        layout: [
          {
            id: 'fleet-overview',
            type: 'fleet_metrics',
            position: { x: 0, y: 0, w: 6, h: 4 }
          },
          {
            id: 'usage-chart',
            type: 'usage_chart',
            position: { x: 6, y: 0, w: 6, h: 4 }
          },
          {
            id: 'security-alerts',
            type: 'security_metrics',
            position: { x: 0, y: 4, w: 4, h: 3 }
          },
          {
            id: 'recent-insights',
            type: 'insights_list',
            position: { x: 4, y: 4, w: 8, h: 3 }
          }
        ],
        refreshInterval: 30000, // 30 segundos
        theme: 'light'
      };

      return NextResponse.json({
        success: true,
        data: defaultConfig
      });
    }

    return NextResponse.json({
      success: true,
      data: config.config
    });

  } catch (error) {
    console.error('Erro ao buscar configuração do dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/dashboard/config
 * Atualiza configuração do dashboard do usuário
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const config = dashboardConfigSchema.parse(body);

    // Upsert da configuração
    const { data, error } = await supabase
      .from('dashboard_configs')
      .upsert({
        user_id: user.id,
        config: config,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data.config
    });

  } catch (error) {
    console.error('Erro ao salvar configuração do dashboard:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}