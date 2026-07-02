import { requireAuth } from '@/lib/auth/auth-middleware';
import { db } from '@/lib/database';
import { vehicles } from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Esquema para validar filtros personalizados
const customFilterSchema = z.object({
  field: z.string().min(1, 'Campo é obrigatório'),
  operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte', 'contains', 'between'], {
    errorMap: () => ({ message: 'Operador inválido' })
  }),
  value: z.union([z.string(), z.number()]).or(z.array(z.union([z.string(), z.number()]))).refine(val => {
    // Se o operador for 'between', precisa ser um array com dois valores
    if (Array.isArray(val) && val.length !== 2) {
      return false;
    }
    return true;
  }, { message: 'Valor inválido para o operador' })
});

// Esquema para validar a requisição de relatório personalizado
const customReportSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  vehicleIds: z.array(z.string().min(1)).min(1, 'Selecione pelo menos um veículo'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Data inicial inválida' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Data final inválida' }),
  format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  reportType: z.enum(['trajectory', 'stops', 'events', 'summary', 'custom'], {
    errorMap: () => ({ message: 'Tipo de relatório inválido' })
  }),
  customFields: z.array(z.string()).min(1, 'Selecione pelo menos um campo'),
  customFilters: z.array(customFilterSchema).optional().default([])
}).refine(data => {
  // Verificar se a data final é maior que a data inicial
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'A data final deve ser posterior à data inicial',
  path: ['endDate']
}).refine(data => {
  // Verificar se o período não é muito longo (exemplo: máximo de 31 dias)
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 31;
}, {
  message: 'O período máximo permitido é de 31 dias',
  path: ['endDate']
});

export async function POST(request: NextRequest) {
  try {
    // Obter e validar dados usando Zod
    const rawData = await request.json();
    const validationResult = customReportSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verificar autenticação
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult.user;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se os veículos pertencem ao usuário
    const numericVehicleIds = validatedData.vehicleIds
      .map(id => parseInt(id, 10))
      .filter(id => !Number.isNaN(id));

    const userVehicles = numericVehicleIds.length > 0
      ? await db
          .select({ id: vehicles.id })
          .from(vehicles)
          .where(and(
            inArray(vehicles.id, numericVehicleIds),
            eq(vehicles.userId, user.id)
          ))
      : [];

    // Verificar se todos os veículos foram encontrados
    const foundVehicleIds = new Set(userVehicles.map(v => String(v.id)));
    const missingVehicles = validatedData.vehicleIds.filter(id => !foundVehicleIds.has(id));

    if (missingVehicles.length > 0) {
      return NextResponse.json(
        { error: 'Alguns veículos selecionados não foram encontrados ou você não tem permissão para acessá-los' },
        { status: 403 }
      );
    }

    // Não há tabela de relatórios no schema: gera um identificador para o
    // acompanhamento do processamento sem persistência.
    const reportId = `custom_${Date.now()}`;

    return NextResponse.json({
      message: 'Relatório customizado em processamento',
      reportId,
      status: 'processing',
      estimatedTime: '30 segundos'
    }, { status: 202 }); // 202 Accepted é mais apropriado para processamento assíncrono

  } catch (error) {
    console.error('Erro ao processar requisição customizada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
