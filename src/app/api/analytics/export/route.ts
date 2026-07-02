/**
 * API Endpoints - Data Export
 * @description Endpoints para exportação de dados analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { z } from 'zod';

// Schema para exportação
const exportSchema = z.object({
  type: z.enum(['analytics', 'raw_data', 'report']),
  format: z.enum(['csv', 'excel', 'json']),
  filters: z.object({
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional(),
    vehicleIds: z.array(z.string()).optional(),
    driverIds: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional()
  }).optional(),
  includeCharts: z.boolean().optional()
});

/**
 * POST /api/analytics/export
 * Inicia processo de exportação de dados
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

    const body = await request.json();
    const exportRequest = exportSchema.parse(body);

    // Gerar exportação de forma síncrona (não há tabela de exports no schema)
    const result = await analyticsService.exportData(
      user.id,
      exportRequest.type,
      exportRequest.format
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao exportar dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Erro ao exportar dados:', error);

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
