import { NextRequest, NextResponse } from 'next/server';
import { VehiclesService } from '@/lib/vehicles/vehicles-service';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { z } from 'zod';
import { ApiError, handleApiError } from '@/lib/api-error';
import { configureProductHarness } from '@/lib/product-harness/configure';
import { createProductEvent, emitProductEvent } from '@/lib/product-harness/events';

configureProductHarness();

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  status: z.enum(['active', 'inactive', 'maintenance', 'all']).optional().default('all'),
  sort: z.enum(['asc', 'desc']).optional().default('asc')
});

// Esquema para validar dados de criação/atualização de veículo
const vehicleSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  licensePlate: z.string().min(3, 'Placa deve ter pelo menos 3 caracteres'),
  model: z.string().optional(),
  year: z.number().int().positive().optional(),
  deviceId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  color: z.string().optional(),
  vin: z.string().optional()
});

// Handler para listar veículos (GET)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    if (!user) {
      throw new ApiError(401, 'Token de autenticação necessário');
    }

    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

    if (!queryResult.success) {
      throw new ApiError(400, 'Parâmetros de consulta inválidos', queryResult.error.format());
    }

    const { limit, offset, status, sort } = queryResult.data;

    // Buscar veículos usando o serviço real
    const result = await VehiclesService.getVehicles(user.id, {
      limit,
      offset,
      status,
      sort
    });

    // Retornar resultados no shape consumido pelos clientes reais
    // (vehicles-client e a tela de relatórios leem `vehicles`)
    return NextResponse.json({
      vehicles: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Handler para criar veículo (POST)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    if (!user) {
      throw new ApiError(401, 'Token de autenticação necessário');
    }

    // Extrair e validar dados do corpo da requisição
    const body = await request.json();
    const bodyResult = vehicleSchema.safeParse(body);

    if (!bodyResult.success) {
      throw new ApiError(400, 'Dados inválidos', bodyResult.error.format());
    }

    const vehicleData = bodyResult.data;

    // Criar novo veículo usando o serviço real
    const newVehicle = await VehiclesService.createVehicle(user.id, vehicleData);

    await emitProductEvent(createProductEvent('activation_completed', {
      user_id: user.id,
      account_id: user.id,
      feature: 'vehicle_created',
      outcome: 'success',
    }));

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// Handler para atualizar veículo (PUT)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    if (!user) {
      throw new ApiError(401, 'Token de autenticação necessário');
    }

    // Extrair e validar corpo da requisição
    const body = await request.json() as { id: string;[key: string]: unknown };
    const { id, ...vehicleData } = body;

    if (!id) {
      throw new ApiError(400, 'ID do veículo é obrigatório');
    }

    const vehicleResult = vehicleSchema.partial().safeParse(vehicleData);

    if (!vehicleResult.success) {
      throw new ApiError(400, 'Dados inválidos', vehicleResult.error.format());
    }

    // Atualizar veículo usando o serviço real
    const updatedVehicle = await VehiclesService.updateVehicle(user.id, id, vehicleData);
    return NextResponse.json(updatedVehicle);
  } catch (error) {
    return handleApiError(error);
  }
}

// Handler para excluir veículo (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    if (!user) {
      throw new ApiError(401, 'Token de autenticação necessário');
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      throw new ApiError(400, 'ID do veículo é obrigatório');
    }

    await VehiclesService.deleteVehicle(user.id, id);
    return NextResponse.json({ message: 'Veículo excluído com sucesso' });
  } catch (error) {
    return handleApiError(error);
  }
}