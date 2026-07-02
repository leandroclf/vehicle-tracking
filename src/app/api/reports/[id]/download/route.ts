import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { reports } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import {
  ReportContent,
  reportContentToCsv,
} from '@/lib/reports/report-service';

/**
 * GET /api/reports/[id]/download
 * Exporta o conteúdo persistido do relatório.
 * - ?format=csv|excel → CSV (text/csv)
 * - demais formatos → JSON (application/json)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: authResult.status || 401 }
      );
    }

    const { id } = await context.params;
    const reportId = parseInt(id, 10);
    if (Number.isNaN(reportId)) {
      return NextResponse.json({ error: 'ID de relatório inválido' }, { status: 400 });
    }

    const [row] = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, reportId), eq(reports.userId, authResult.user.id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }

    if (!row.content) {
      return NextResponse.json({ error: 'Relatório sem conteúdo disponível' }, { status: 409 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const content = row.content as unknown as ReportContent;
    const baseFilename = `relatorio-${row.id}`;

    if (format === 'csv' || format === 'excel' || format === 'xlsx') {
      return new NextResponse(reportContentToCsv(content), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseFilename}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { title: row.title, type: row.type, params: row.params, content },
      {
        headers: {
          'Content-Disposition': `attachment; filename="${baseFilename}.json"`,
        },
      }
    );
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
