import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/database';
import { alerts, events, vehicles } from '@/lib/schema';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

// Esquema para validar parâmetros de exportação
const exportSchema = z.object({
  vehicle_id: z.string().min(1, 'ID do veículo é obrigatório'),
  start_date: z.string().min(1, 'Data inicial é obrigatória'),
  end_date: z.string().min(1, 'Data final é obrigatória'),
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  include_events: z.boolean().optional().default(false),
  include_alerts: z.boolean().optional().default(false)
});

// Handler para exportar dados de monitoramento
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({
        error: authResult.error || 'Não autorizado'
      }, { status: authResult.status || 401 });
    }

    const userId = authResult.user.id;

    // Extrair e validar corpo da requisição
    const body = await request.json();
    const validationResult = exportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: validationResult.error.format()
      }, { status: 400 });
    }

    const exportData = validationResult.data;
    const vehicleIdNumber = parseInt(exportData.vehicle_id, 10);

    if (Number.isNaN(vehicleIdNumber)) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: { vehicle_id: 'Deve ser um identificador numérico' }
      }, { status: 400 });
    }

    const startDate = new Date(exportData.start_date);
    const endDate = new Date(exportData.end_date);

    // Verificar se o veículo pertence ao usuário
    const [vehicleCheck] = await db
      .select({ id: vehicles.id, name: vehicles.name, plate: vehicles.plate })
      .from(vehicles)
      .where(and(
        eq(vehicles.id, vehicleIdNumber),
        eq(vehicles.userId, userId)
      ))
      .limit(1);

    if (!vehicleCheck) {
      return NextResponse.json({
        error: 'Veículo não encontrado ou não pertence ao usuário'
      }, { status: 404 });
    }

    // Buscar eventos do veículo no período (histórico de posições vem de events)
    const periodEvents = await db
      .select()
      .from(events)
      .where(and(
        eq(events.vehicleId, vehicleIdNumber),
        gte(events.timestamp, startDate),
        lte(events.timestamp, endDate)
      ))
      .orderBy(asc(events.timestamp));

    // Posições derivadas de eventos com coordenadas
    const positions = periodEvents
      .filter(event => event.lat != null && event.lng != null)
      .map(event => ({
        vehicle_id: event.vehicleId,
        lat: event.lat,
        lng: event.lng,
        speed: event.speed,
        heading: event.heading,
        timestamp: event.timestamp
      }));

    // Dados para exportação
    const exportDataResult: {
      vehicle: typeof vehicleCheck;
      positions: typeof positions;
      events?: typeof periodEvents;
      alerts?: Array<typeof alerts.$inferSelect>;
    } = {
      vehicle: vehicleCheck,
      positions
    };

    // Incluir eventos se solicitados
    if (exportData.include_events) {
      exportDataResult.events = periodEvents;
    }

    // Buscar alertas se solicitados
    if (exportData.include_alerts) {
      exportDataResult.alerts = await db
        .select()
        .from(alerts)
        .where(and(
          eq(alerts.vehicleId, vehicleIdNumber),
          gte(alerts.createdAt, startDate),
          lte(alerts.createdAt, endDate)
        ))
        .orderBy(asc(alerts.createdAt));
    }

    // Gerar identificador único para o arquivo.
    // Não há tabela de exports no schema, portanto não há persistência do
    // registro: o identificador gerado também é usado como export_id.
    const fileId = `${exportData.vehicle_id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: 'Exportação iniciada com sucesso',
      export_id: fileId,
      file_id: fileId,
      status: 'processing',
      format: exportData.format,
      download_url: `/api/monitoring/export/${fileId}/download`,
      total_records: {
        positions: exportDataResult.positions.length,
        events: exportDataResult.events?.length || 0,
        alerts: exportDataResult.alerts?.length || 0
      }
    });

  } catch (error) {
    console.error('Erro ao processar exportação:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// Handler para verificar status da exportação
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({
        error: authResult.error || 'Não autorizado'
      }, { status: authResult.status || 401 });
    }

    // Extrair ID da exportação da URL
    const url = new URL(request.url);
    const exportId = url.searchParams.get('id');

    if (!exportId) {
      // Não há tabela de exports no schema: sem registros persistidos
      return NextResponse.json({
        exports: []
      });
    }

    // Sem persistência de exports, nenhum registro pode ser localizado
    return NextResponse.json({
      error: 'Exportação não encontrada'
    }, { status: 404 });

  } catch (error) {
    console.error('Erro ao verificar status da exportação:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
