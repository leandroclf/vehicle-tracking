import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sort: z.enum(['asc', 'desc']).optional().default('asc')
});

// Esquema para validar dados de criação/atualização de veículo
const vehicleSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  license_plate: z.string().min(3, 'Placa deve ter pelo menos 3 caracteres'),
  model: z.string().optional(),
  year: z.number().int().positive().optional(),
  device_id: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  color: z.string().optional(),
  vin: z.string().optional()
});

// Interface para o veículo vindo do Supabase
interface DbVehicle {
  id: string;
  user_id: string;
  name: string;
  license_plate: string;
  model: string | null;
  year: number | null;
  device_id: string | null;
  status: 'active' | 'inactive';
  color: string | null;
  vin: string | null;
  created_at: string;
  updated_at: string;
}

// Handler para listar veículos (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parâmetros de consulta inválidos', details: queryResult.error.format() }, { status: 400 });
    }
    
    const { limit, offset, status, sort } = queryResult.data;
    
    // Construir consulta base
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtro de status se não for 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Executar consulta
    const { data: vehicles, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
    }
    
    // Retornar resultados
    return NextResponse.json({
      vehicles,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para criar veículo (POST)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const vehicleResult = vehicleSchema.safeParse(body);
    
    if (!vehicleResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: vehicleResult.error.format() }, { status: 400 });
    }
    
    const vehicleData = vehicleResult.data;
    
    // Verificar se já existe veículo com a mesma placa
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('license_plate', vehicleData.license_plate)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar veículo existente:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar veículo existente' }, { status: 500 });
    }
    
    if (existingVehicle) {
      return NextResponse.json({ error: 'Já existe um veículo com esta placa' }, { status: 409 });
    }
    
    // Inserir novo veículo
    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        ...vehicleData,
        user_id: userId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Erro ao criar veículo:', insertError);
      return NextResponse.json({ error: 'Erro ao criar veículo' }, { status: 500 });
    }
    
    // Retornar veículo criado
    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar veículo (PUT)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const { id, ...vehicleData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do veículo é obrigatório' }, { status: 400 });
    }
    
    const vehicleResult = vehicleSchema.partial().safeParse(vehicleData);
    
    if (!vehicleResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: vehicleResult.error.format() }, { status: 400 });
    }
    
    // Verificar se o veículo existe e pertence ao usuário
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar veículo:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar veículo' }, { status: 500 });
    }
    
    if (!existingVehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }
    
    // Atualizar veículo
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update(vehicleResult.data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erro ao atualizar veículo:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar veículo' }, { status: 500 });
    }
    
    // Retornar veículo atualizado
    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para excluir veículo (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair ID do veículo da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do veículo é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o veículo existe e pertence ao usuário
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar veículo:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar veículo' }, { status: 500 });
    }
    
    if (!existingVehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }
    
    // Excluir veículo
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Erro ao excluir veículo:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir veículo' }, { status: 500 });
    }
    
    // Retornar sucesso
    return NextResponse.json({ message: 'Veículo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}