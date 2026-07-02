import { NextResponse } from 'next/server';

/**
 * POST /api/reports/generate
 * Rota legada sem consumidores no produto. A geração suportada é
 * POST /api/reports (síncrona, persistida na tabela `reports`).
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Rota não suportada no baseline de produção. Use POST /api/reports.',
      code: 'UNSUPPORTED',
    },
    { status: 501 }
  );
}
