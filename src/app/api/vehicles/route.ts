import { NextRequest, NextResponse } from 'next/server';
// Usando vehicles-service mock temporariamente até resolver problema do PostgreSQL
import { VehiclesService } from '@/lib/vehicles-mock';
import { AuthService } from '@/lib/auth/auth-service-mock';
import { z } from 'zod';

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
    // Extrair token de autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação necessário' }, { status: 401 });
    }
    
    // Verificar token e obter usuário
    const user = await AuthService.verifyToken(token);
    
    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parâmetros de consulta inválidos', details: queryResult.error.format() }, { status: 400 });
    }
    
    const { limit, offset, status, sort } = queryResult.data;
    
    // Buscar veículos usando o serviço mock
    const result = await VehiclesService.getVehicles(user.id, {
      limit,
      offset,
      status,
      sort
    });
    
    // Retornar resultados
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para criar veículo (POST)
export async function POST(request: NextRequest) {
  try {
    // Extrair token de autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação necessário' }, { status: 401 });
    }
    
    // Verificar token e obter usuário
    const user = await AuthService.verifyToken(token);
    
    // Extrair e validar dados do corpo da requisição
    const body = await request.json();
    const bodyResult = vehicleSchema.safeParse(body);
    
    if (!bodyResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: bodyResult.error.format() }, { status: 400 });
    }
    
    const vehicleData = bodyResult.data;
    
    try {
      // Criar novo veículo usando o serviço mock
      const newVehicle = await VehiclesService.createVehicle(user.id, vehicleData);
      return NextResponse.json(newVehicle, { status: 201 });
    } catch (serviceError: any) {
      if (serviceError.message === 'Já existe um veículo com esta placa') {
        return NextResponse.json({ error: serviceError.message }, { status: 409 });
      }
      throw serviceError;
    }
  } catch (error: any) {
    console.error('Erro ao criar veículo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar veículo (PUT)
export async function PUT(request: NextRequest) {
  try {
    // Extrair token de autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação necessário' }, { status: 401 });
    }
    
    // Verificar token e obter usuário
    const user = await AuthService.verifyToken(token);
    
    // Extrair e validar corpo da requisição
    const body = await request.json() as { id: string; [key: string]: unknown };
    const { id, ...vehicleData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do veículo é obrigatório' }, { status: 400 });
    }
    
    const vehicleResult = vehicleSchema.partial().safeParse(vehicleData);
    
    if (!vehicleResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: vehicleResult.error.format() }, { status: 400 });
    }
    
    try {
       // Atualizar veículo usando o serviço mock
       const updatedVehicle = await VehiclesService.updateVehicle(user.id, id, vehicleData);
       return NextResponse.json(updatedVehicle);
    } catch (serviceError: any) {
      if (serviceError.message === 'Veículo não encontrado') {
        return NextResponse.json({ error: serviceError.message }, { status: 404 });
      }
      throw serviceError;
    }
  } catch (error: any) {
    console.error('Erro ao atualizar veículo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para excluir veículo (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Extrair ID do veículo da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do veículo é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o veículo existe e pertence ao usuário
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.userId, user.id)
        )
      )
      .limit(1);
    
    if (existingVehicle.length === 0) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }
    
    // Excluir veículo
    await db
      .delete(vehicles)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.userId, user.id)
        )
      );
    
    // Retornar sucesso
    return NextResponse.json({ message: 'Veículo excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}