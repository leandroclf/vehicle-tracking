/**
 * API Endpoints - Dashboard Analytics
 * @description Endpoints para fornecer dados do dashboard analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { z } from 'zod';
import type {
  FleetMetrics,
  UsageMetrics,
  SecurityMetrics,
  AnalyticsInsight
} from '@/types/analytics';

// Schema de validação para filtros (alinhado a DashboardConfig['filters'])
const filtersSchema = z.object({
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
    preset: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional()
  }),
  vehicles: z.array(z.string()).default([]),
  drivers: z.array(z.string()).default([]),
  routes: z.array(z.string()).default([])
});

interface MetricsPayload {
  fleet?: FleetMetrics;
  usage?: UsageMetrics;
  security?: SecurityMetrics;
  insights?: AnalyticsInsight[];
}

/**
 * GET /api/analytics/metrics
 * Retorna métricas consolidadas do dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // Parse filters se fornecidos
    let filters: z.infer<typeof filtersSchema> | undefined;
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      try {
        filters = filtersSchema.parse(JSON.parse(filtersParam));
      } catch {
        return NextResponse.json(
          { success: false, error: 'Filtros inválidos' },
          { status: 400 }
        );
      }
    }

    const metrics: MetricsPayload = {};

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
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json() as { thresholds?: unknown };
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
