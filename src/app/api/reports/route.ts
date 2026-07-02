import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { reports } from '@/lib/schema';
import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  generateReportContent,
  getAllUserVehicles,
  getOwnedVehicles,
} from '@/lib/reports/report-service';

// Parâmetros persistidos em reports.params (jsonb)
interface ReportParams {
  start_date: string;
  end_date: string;
  vehicle_ids: string[];
  format: string;
  custom_fields?: string[];
  custom_filters?: Record<string, unknown>;
}

const createReportSchema = z.object({
  reportType: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  // Lista vazia significa "todos os veículos do usuário"
  vehicleIds: z.array(z.coerce.number().int().positive()).optional().default([]),
  format: z.string().optional().default('pdf'),
});

// Mapeia uma linha da tabela para o shape consumido pela tela de relatórios
function toApiShape(row: typeof reports.$inferSelect) {
  const params = (row.params ?? {}) as Partial<ReportParams>;
  return {
    id: String(row.id),
    report_type: row.type,
    start_date: params.start_date ?? '',
    end_date: params.end_date ?? '',
    status: (row.status ?? 'completed') as 'processing' | 'completed' | 'error',
    created_at: row.createdAt,
    vehicle_ids: params.vehicle_ids ?? [],
    custom_fields: params.custom_fields,
    custom_filters: params.custom_filters,
  };
}

/**
 * POST /api/reports - Gera (síncrono) e persiste um relatório com dados reais.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: authResult.status || 401 }
      );
    }
    const userId = authResult.user.id;

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { reportType, startDate, endDate, vehicleIds, format } = parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    }

    const owned = vehicleIds.length > 0
      ? await getOwnedVehicles(userId, vehicleIds)
      : await getAllUserVehicles(userId);
    if (owned.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum veículo válido para o relatório' },
        { status: 404 }
      );
    }

    const content = await generateReportContent(owned, start, end);

    const params: ReportParams = {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      vehicle_ids: owned.map(v => String(v.id)),
      format,
    };

    const [row] = await db
      .insert(reports)
      .values({
        userId,
        title: `Relatório ${reportType} (${startDate} a ${endDate})`,
        type: reportType,
        params,
        status: 'completed',
        content,
      })
      .returning();

    return NextResponse.json({ report: toApiShape(row) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * GET /api/reports - Lista os relatórios do usuário (paginação real).
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
    const userId = authResult.user.id;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10) || 10, 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(reports)
        .where(eq(reports.userId, userId))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(reports)
        .where(eq(reports.userId, userId)),
    ]);

    return NextResponse.json({
      reports: rows.map(toApiShape),
      pagination: {
        total: totalRow?.value ?? 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
