/**
 * API Endpoints - Dashboard Configuration
 * @description Endpoints para gerenciar configurações do dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
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
    config: z.record(z.unknown()).optional()
  })),
  filters: z.object({
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
      preset: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional()
    }).optional(),
    vehicles: z.array(z.string()).optional(),
    drivers: z.array(z.string()).optional(),
    routes: z.array(z.string()).optional()
  }).optional(),
  refreshInterval: z.number().optional(),
  theme: z.enum(['light', 'dark']).optional()
});

// Não há tabela de configuração de dashboard no schema atual;
// a configuração padrão abaixo mantém a UI funcional sem persistência.
const DEFAULT_DASHBOARD_CONFIG = {
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

/**
 * GET /api/analytics/dashboard/config
 * Retorna configuração do dashboard do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Sem persistência disponível: retorna a configuração padrão
    return NextResponse.json({
      success: true,
      data: DEFAULT_DASHBOARD_CONFIG
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
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const config = dashboardConfigSchema.parse(body);

    // Sem tabela adequada para persistir a configuração: valida e ecoa a
    // configuração recebida para manter o contrato consumido pela UI.
    return NextResponse.json({
      success: true,
      data: config
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
