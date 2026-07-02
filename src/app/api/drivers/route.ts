import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';
import { errorResponse } from '@/lib/api-helpers';

// Esquema para validar dados de motorista
const driverSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome não pode exceder 100 caracteres'),
  license_number: z
    .string()
    .min(9, 'Número da CNH deve ter pelo menos 9 caracteres')
    .max(11, 'Número da CNH não pode exceder 11 caracteres')
    .regex(/^[0-9]+$/, 'O número da CNH deve conter apenas dígitos'),
  license_type: z.enum(['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE']).optional(),
  license_expiry: z.string().optional()
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Data de validade deve estar no formato YYYY-MM-DD',
    }),
  phone: z.string().optional()
    .refine(val => !val || /^(\+\d{1,3})?\s?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}$/.test(val), {
      message: 'Formato de telefone inválido',
    }),
  email: z.string().email('Email inválido').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().max(500, 'Observações não podem exceder 500 caracteres').optional()
});

// O cadastro de motoristas depende de uma tabela `drivers` que não existe no
// schema canônico (src/lib/schema.ts). Conforme o baseline OpenSpec de
// production-readiness, caminhos não suportados devem ser explícitos (501)
// em vez de simular sucesso.
const NOT_SUPPORTED_MESSAGE = 'Gerenciamento de motoristas não é suportado nesta versão';

function notSupportedResponse() {
  return errorResponse(NOT_SUPPORTED_MESSAGE, undefined, 501);
}

/**
 * GET /api/drivers - Listar motoristas (não suportado: tabela inexistente)
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return errorResponse(authResult.error || 'Não autorizado', undefined, authResult.status || 401);
  }

  return notSupportedResponse();
}

/**
 * POST /api/drivers - Criar motorista (não suportado: tabela inexistente)
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return errorResponse(authResult.error || 'Não autorizado', undefined, authResult.status || 401);
  }

  // Extrair e validar corpo da requisição
  const body = await request.json();
  const validationResult = driverSchema.safeParse(body);

  if (!validationResult.success) {
    return errorResponse(
      'Dados inválidos',
      validationResult.error.format(),
      400
    );
  }

  return notSupportedResponse();
}

/**
 * PUT /api/drivers - Atualizar motorista (não suportado: tabela inexistente)
 */
export async function PUT(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return errorResponse(authResult.error || 'Não autorizado', undefined, authResult.status || 401);
  }

  // Obter ID do motorista
  const url = new URL(request.url);
  const driverId = url.searchParams.get('id');

  if (!driverId) {
    return errorResponse('ID do motorista é obrigatório');
  }

  // Extrair e validar corpo da requisição
  const body = await request.json();
  const validationResult = driverSchema.safeParse(body);

  if (!validationResult.success) {
    return errorResponse(
      'Dados inválidos',
      validationResult.error.format(),
      400
    );
  }

  return notSupportedResponse();
}

/**
 * DELETE /api/drivers - Excluir motorista (não suportado: tabela inexistente)
 */
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return errorResponse(authResult.error || 'Não autorizado', undefined, authResult.status || 401);
  }

  // Obter ID do motorista
  const url = new URL(request.url);
  const driverId = url.searchParams.get('id');

  if (!driverId) {
    return errorResponse('ID do motorista é obrigatório');
  }

  return notSupportedResponse();
}
