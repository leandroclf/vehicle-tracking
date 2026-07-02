import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { reports } from '@/lib/schema';
import { z } from 'zod';
import {
  generateReportContent,
  getOwnedVehicles,
} from '@/lib/reports/report-service';

const customReportSchema = z.object({
  title: z.string().min(1),
  vehicleIds: z.array(z.coerce.number().int().positive()).min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  format: z.string().optional().default('pdf'),
  customFields: z.array(z.string()).optional().default([]),
  customFilters: z.record(z.unknown()).optional().default({}),
  reportType: z.literal('custom').optional().default('custom'),
});

/**
 * POST /api/reports/custom - Gera e persiste um relatório customizado
 * com dados reais (trips/events/alerts) para o período e veículos.
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
    const parsed = customReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { title, vehicleIds, startDate, endDate, format, customFields, customFilters } = parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    }

    const owned = await getOwnedVehicles(userId, vehicleIds);
    if (owned.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum veículo válido para o relatório' },
        { status: 404 }
      );
    }

    const content = await generateReportContent(owned, start, end);

    const [row] = await db
      .insert(reports)
      .values({
        userId,
        title,
        type: 'custom',
        params: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          vehicle_ids: owned.map(v => String(v.id)),
          format,
          custom_fields: customFields,
          custom_filters: customFilters,
        },
        status: 'completed',
        content,
      })
      .returning();

    return NextResponse.json({ report: { id: String(row.id) } }, { status: 201 });
  } catch (error) {
    console.error('Erro ao gerar relatório customizado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
