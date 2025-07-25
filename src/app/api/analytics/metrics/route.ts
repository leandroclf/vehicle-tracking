/**
 * API Endpoints - Dashboard Analytics
 * @description Endpoints para fornecer dados do dashboard analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { z } from 'zod';

// Schema de validação para filtros
const filtersSchema = z.object({
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional(),
  vehicleIds: z.array(z.string()).optional(),
  driverIds: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional()
});

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
  filters: filtersSchema.optional(),
  refreshInterval: z.number().optional(),
  theme: z.enum(['light', 'dark']).optional()
});

/**
 * GET /api/analytics/metrics
 * Retorna métricas consolidadas do dashboard
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    // Parse filters se fornecidos
    let filters;
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      try {
        filters = filtersSchema.parse(JSON.parse(filtersParam));
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Filtros inválidos' },
          { status: 400 }
        );
      }
    }

    const metrics: any = {};

    // Buscar métricas baseadas no tipo solicitado
    if (type === 'all' || type === 'fleet') {
      metrics.fleet = await analyticsService.getFleetMetrics(user.id, filters);
    }

    if (type === 'all' || type === 'usage') {
      metrics.usage = await analyticsService.getUsageMetrics(user.id, filters);
    }

    if (type === 'all' || type === 'security') {
      metrics.security = await analyticsService.getSecurityMetrics(user.id, filters);
    }

    // Gerar insights se solicitado
    if (type === 'all' || type === 'insights') {
      metrics.insights = await analyticsService.generateInsights(user.id);
    }

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/alerts/check
 * Verifica alertas baseados em thresholds
 */
export async function POST(request: NextRequest) {
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
    const thresholdsSchema = z.record(z.number());
    
    const thresholds = thresholdsSchema.parse(body.thresholds || {});

    const alerts = await analyticsService.checkAlerts(user.id, thresholds);

    return NextResponse.json({
      success: true,
      data: { alerts },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}