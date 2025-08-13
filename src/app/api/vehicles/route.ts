import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { db } from '@/lib/database';
import { vehicles } from '@/lib/schema';
import { eq, and, ilike } from 'drizzle-orm';
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
    // Verificar autenticação do usuário
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parâmetros de consulta inválidos', details: queryResult.error.format() }, { status: 400 });
    }
    
    const { limit, offset, status, sort } = queryResult.data;
    
    // Construir condições WHERE
    let whereConditions = [eq(vehicles.userId, user.id)];
    
    // Aplicar filtro de status se não for 'all'
    if (status !== 'all') {
      whereConditions.push(eq(vehicles.status, status));
    }
    
    // Executar consulta
    const result = await db
      .select()
      .from(vehicles)
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sort === 'asc' ? vehicles.name : vehicles.name);
    
    // Contar total de registros
    const totalResult = await db
      .select({ count: vehicles.id })
      .from(vehicles)
      .where(and(...whereConditions));
    
    // Retornar resultados
    return NextResponse.json({
      vehicles: result,
      pagination: {
        total: totalResult.length,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para criar veículo (POST)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const vehicleResult = vehicleSchema.safeParse(body);
    
    if (!vehicleResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: vehicleResult.error.format() }, { status: 400 });
    }
    
    const vehicleData = vehicleResult.data;
    
    // Verificar se já existe veículo com a mesma placa
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.licensePlate, vehicleData.licensePlate),
          eq(vehicles.userId, user.id)
        )
      )
      .limit(1);
    
    if (existingVehicle.length > 0) {
      return NextResponse.json({ error: 'Já existe um veículo com esta placa' }, { status: 409 });
    }
    
    // Inserir novo veículo
    const newVehicle = await db
      .insert(vehicles)
      .values({
        ...vehicleData,
        userId: user.id,
      })
      .returning();
    
    // Retornar veículo criado
    return NextResponse.json(newVehicle[0], { status: 201 });
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar veículo (PUT)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
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
    
    // Atualizar veículo
    const updatedVehicle = await db
      .update(vehicles)
      .set({
        ...vehicleResult.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.userId, user.id)
        )
      )
      .returning();
    
    // Retornar veículo atualizado
    return NextResponse.json(updatedVehicle[0]);
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
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