import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getDbPool } from '@/lib/database';
import { z } from 'zod';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-helpers';
import { v4 as uuidv4 } from 'uuid';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().optional(),
  license_type: z.string().optional()
});

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

// Interfaces para tipagem
interface VehicleAssignment {
  vehicle: {
    id: string;
    name: string;
    license_plate: string;
  }
}

interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_type?: string;
  license_expiry?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
  driver_vehicles?: VehicleAssignment[];
}

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Listar motoristas
 *     description: Retorna a lista de motoristas cadastrados
 *     tags:
 *       - Motoristas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filtrar por status
 *         schema:
 *           type: string
 *           enum: [active, inactive, vacation, medical_leave]
 *       - name: limit
 *         in: query
 *         description: Número máximo de registros
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: offset
 *         in: query
 *         description: Offset para paginação
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de motoristas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return errorResponse('Não autorizado', undefined, 401);
    }
    
    const { userId } = authResult;
    
    // Obter parâmetros de consulta
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Construir consulta
    // TODO: Implementar query SQL direta
    let query = null; // pool.query
    //   .from('drivers')
    //   .select('*, vehicles!driver_vehicle(*)', { count: 'exact' })
    //   .eq('user_id', userId)
    //   .range(offset, offset + limit - 1);
    
    // Aplicar filtros opcionais
    if (status) {
      query = query.eq('status', status);
    }
    
    // Executar consulta
    // TODO: Implementar query SQL direta
    const drivers = null;
    const error = null;
    const count = 0;
    // const { data: drivers, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar motoristas:', error);
      return errorResponse('Erro ao buscar motoristas', error.message, 500);
    }
    
    return successResponse({
      drivers,
      count,
      limit,
      offset
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * @swagger
 * /api/drivers:
 *   post:
 *     summary: Criar motorista
 *     description: Adiciona um novo motorista ao sistema
 *     tags:
 *       - Motoristas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Driver'
 *     responses:
 *       201:
 *         description: Motorista criado com sucesso
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return errorResponse('Não autorizado', undefined, 401);
    }
    
    const { userId } = authResult;
    
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
    
    // Preparar dados do motorista
    const driverData = {
      id: body.id || uuidv4(),
      user_id: userId,
      ...validationResult.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Inserir no banco de dados
    // TODO: Implementar query SQL direta
    const driver = null;
    const error = null;
    // await pool.query(...)
    //   .from('drivers')
    //   .insert(driverData)
    //   .select()
    //   .single();
    
    if (error) {
      console.error('Erro ao criar motorista:', error);
      return errorResponse('Erro ao criar motorista', error.message, 500);
    }
    
    return successResponse({ driver }, 'Motorista criado com sucesso', 201);
    
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * @swagger
 * /api/drivers:
 *   put:
 *     summary: Atualizar motorista
 *     description: Atualiza os dados de um motorista existente
 *     tags:
 *       - Motoristas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID do motorista a ser atualizado
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Driver'
 *     responses:
 *       200:
 *         description: Motorista atualizado com sucesso
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return errorResponse('Não autorizado', undefined, 401);
    }
    
    const { userId } = authResult;
    
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
    
    // Verificar se o motorista existe e pertence ao usuário
    // TODO: Implementar query SQL direta
    const existingDriver = null;
    const checkError = null;
    // await pool.query(...)
    //   .from('drivers')
    //   .select('id')
    //   .eq('id', driverId)
    //   .eq('user_id', userId)
    //   .single();
    
    if (checkError || !existingDriver) {
      return errorResponse('Motorista não encontrado', undefined, 404);
    }
    
    // Preparar dados atualizados
    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString()
    };
    
    // Atualizar no banco de dados
    // TODO: Implementar query SQL direta
    const driver = null;
    const error = null;
    // await pool.query(...)
    //   .from('drivers')
    //   .update(updateData)
    //   .eq('id', driverId)
    //   .select()
    //   .single();
    
    if (error) {
      console.error('Erro ao atualizar motorista:', error);
      return errorResponse('Erro ao atualizar motorista', error.message, 500);
    }
    
    return successResponse({ driver }, 'Motorista atualizado com sucesso');
    
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * @swagger
 * /api/drivers:
 *   delete:
 *     summary: Excluir motorista
 *     description: Remove um motorista do sistema
 *     tags:
 *       - Motoristas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID do motorista a ser excluído
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Motorista excluído com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return errorResponse('Não autorizado', undefined, 401);
    }
    
    const { userId } = authResult;
    
    // Obter ID do motorista
    const url = new URL(request.url);
    const driverId = url.searchParams.get('id');
    
    if (!driverId) {
      return errorResponse('ID do motorista é obrigatório');
    }
    
    // Verificar se o motorista existe e pertence ao usuário
    // TODO: Implementar query SQL direta
    const existingDriver = null;
    const checkError = null;
    // await pool.query(...)
    //   .from('drivers')
    //   .select('id')
    //   .eq('id', driverId)
    //   .eq('user_id', userId)
    //   .single();
    
    if (checkError || !existingDriver) {
      return errorResponse('Motorista não encontrado', undefined, 404);
    }
    
    // Excluir do banco de dados
    // TODO: Implementar query SQL direta
    const error = null; // await pool.query(...)
    //   .from('drivers')
    //   .delete()
    //   .eq('id', driverId);
    
    if (error) {
      console.error('Erro ao excluir motorista:', error);
      return errorResponse('Erro ao excluir motorista', error.message, 500);
    }
    
    return successResponse(null, 'Motorista excluído com sucesso');
    
  } catch (error) {
    return handleApiError(error);
  }
}