import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-helpers';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

// Esquema para atribuição múltipla de veículos a um motorista
const bulkAssignmentSchema = z.object({
  driver_id: z.string().min(1, 'ID do motorista é obrigatório'),
  vehicle_ids: z.array(z.string().min(1, 'ID do veículo inválido')).min(1, 'É necessário fornecer pelo menos um veículo')
});

// Esquema para validar atribuição individual de veículo a motorista
const assignmentSchema = z.object({
  driver_id: z.string().min(1, 'ID do motorista é obrigatório'),
  vehicle_id: z.string().min(1, 'ID do veículo é obrigatório'),
  start_date: z.string()
    .optional()
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Data de início deve estar no formato YYYY-MM-DD',
    }),
  end_date: z.string()
    .optional()
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Data de término deve estar no formato YYYY-MM-DD',
    }),
  is_primary: z.boolean().optional().default(false)
}).refine(data => {
  // Se houver data de término, ela deve ser posterior à data de início
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: 'A data de término deve ser posterior à data de início',
  path: ['end_date']
});

// A atribuição motorista-veículo depende das tabelas `drivers` e
// `driver_vehicle_assignments`, que não existem no schema canônico
// (src/lib/schema.ts). Conforme o baseline OpenSpec de production-readiness,
// caminhos não suportados devem ser explícitos (501) em vez de simular sucesso.
const NOT_SUPPORTED_MESSAGE = 'Atribuição de veículos a motoristas não é suportada nesta versão';

function notSupportedResponse() {
  return errorResponse(NOT_SUPPORTED_MESSAGE, undefined, 501);
}

// Handler para listar atribuições de veículos (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return errorResponse(
        authResult.error || 'Não autorizado',
        undefined,
        authResult.status || 401
      );
    }

    // Extrair parâmetros de consulta
    const url = new URL(request.url);
    const driverId = url.searchParams.get('driver_id');
    const vehicleId = url.searchParams.get('vehicle_id');

    if (!driverId && !vehicleId) {
      return errorResponse('É necessário fornecer driver_id ou vehicle_id');
    }

    return notSupportedResponse();
  } catch (error) {
    console.error('Erro ao processar requisição de atribuições:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
}

// Handler para criar atribuição de veículo (POST)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return errorResponse(
        authResult.error || 'Não autorizado',
        undefined,
        authResult.status || 401
      );
    }

    // Extrair corpo da requisição
    const body = await request.json() as Record<string, unknown>;

    // Verificar se é uma atribuição múltipla ou individual
    if (body.vehicle_ids && Array.isArray(body.vehicle_ids)) {
      // Validar esquema de atribuição múltipla
      const bulkResult = bulkAssignmentSchema.safeParse(body);

      if (!bulkResult.success) {
        return errorResponse(
          'Dados inválidos para atribuição múltipla',
          bulkResult.error.format()
        );
      }
    } else {
      // Atribuição individual
      const assignmentResult = assignmentSchema.safeParse(body);

      if (!assignmentResult.success) {
        return errorResponse(
          'Dados inválidos',
          assignmentResult.error.format()
        );
      }
    }

    return notSupportedResponse();
  } catch (error) {
    console.error('Erro ao processar criação de atribuição:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
}

// Handler para excluir atribuição (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return errorResponse(
        authResult.error || 'Não autorizado',
        undefined,
        authResult.status || 401
      );
    }

    // Extrair ID da atribuição dos parâmetros
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');

    if (!assignmentId) {
      return errorResponse('ID da atribuição é obrigatório');
    }

    return notSupportedResponse();
  } catch (error) {
    console.error('Erro ao processar exclusão de atribuição:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
}
