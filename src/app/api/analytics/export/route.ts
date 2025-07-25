/**
 * API Endpoints - Data Export
 * @description Endpoints para exportação de dados analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const exportRequest = exportSchema.parse(body);

    // Iniciar processo de exportação
    const result = await analyticsService.exportData(
      user.id,
      exportRequest.type,
      exportRequest.format,
      exportRequest.filters
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
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

/**
 * GET /api/analytics/export/[exportId]
 * Download do arquivo exportado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { exportId } = params;

    // Verificar se o export existe e pertence ao usuário
    const { data: exportRecord, error } = await supabase
      .from('data_exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (error || !exportRecord) {
      return NextResponse.json(
        { success: false, error: 'Export não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o arquivo ainda está disponível
    if (exportRecord.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Export ainda em processamento' },
        { status: 202 }
      );
    }

    // Retornar URL de download ou stream do arquivo
    // Por enquanto, simular resposta
    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: exportRecord.file_url,
        expiresAt: exportRecord.expires_at
      }
    });

  } catch (error) {
    console.error('Erro ao fazer download do export:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}