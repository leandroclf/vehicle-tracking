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

// Esquema para validar dados de motorista
const driverSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  license_number: z.string().min(3, 'Número da CNH deve ter pelo menos 3 caracteres'),
  license_type: z.string().optional(),
  license_expiry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional()
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

// Handler para listar motoristas (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!queryResult.success) {
      return NextResponse.json({ 
        error: 'Parâmetros de consulta inválidos', 
        details: queryResult.error.format() 
      }, { status: 400 });
    }
    
    const { limit, offset, status, sort } = queryResult.data;
    
    // Construir consulta base
    let query = supabase
      .from('drivers')
      .select(`
        *,
        driver_vehicles:driver_vehicle_assignments(
          vehicle:vehicle_id(id, name, license_plate)
        )
      `)
      .eq('user_id', userId)
      .order('name', { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtro de status se não for 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Executar consulta
    const { data: drivers, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar motoristas:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar motoristas' 
      }, { status: 500 });
    }
    
    // Formatar os resultados
    const formattedDrivers = (drivers as Driver[] | null)?.map(driver => {
      const assignedVehicles = driver.driver_vehicles?.map((assignment: VehicleAssignment) => assignment.vehicle) || [];
      
      return {
        id: driver.id,
        name: driver.name,
        license_number: driver.license_number,
        license_type: driver.license_type,
        license_expiry: driver.license_expiry,
        phone: driver.phone,
        email: driver.email,
        status: driver.status,
        notes: driver.notes,
        created_at: driver.created_at,
        updated_at: driver.updated_at,
        assigned_vehicles: assignedVehicles
      };
    }) || [];
    
    return NextResponse.json({
      drivers: formattedDrivers,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de motoristas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para criar motorista (POST)
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
    const driverResult = driverSchema.safeParse(body);
    
    if (!driverResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: driverResult.error.format() 
      }, { status: 400 });
    }
    
    const driverData = driverResult.data;
    
    // Verificar se já existe motorista com a mesma CNH
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id')
      .eq('license_number', driverData.license_number)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar motorista existente:', checkError);
      return NextResponse.json({ 
        error: 'Erro ao verificar motorista existente' 
      }, { status: 500 });
    }
    
    if (existingDriver) {
      return NextResponse.json({ 
        error: 'Já existe um motorista com esta CNH' 
      }, { status: 409 });
    }
    
    // Inserir novo motorista
    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert({
        ...driverData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Erro ao criar motorista:', insertError);
      return NextResponse.json({ 
        error: 'Erro ao criar motorista' 
      }, { status: 500 });
    }
    
    // Retornar motorista criado
    return NextResponse.json(newDriver, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao processar criação de motorista:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para atualizar motorista (PUT)
export async function PUT(request: NextRequest) {
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
    const body = await request.json() as { id: string; [key: string]: unknown };
    const { id, ...driverData } = body;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'ID do motorista é obrigatório' 
      }, { status: 400 });
    }
    
    const driverResult = driverSchema.partial().safeParse(driverData);
    
    if (!driverResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: driverResult.error.format() 
      }, { status: 400 });
    }
    
    // Verificar se o motorista existe e pertence ao usuário
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar motorista:', checkError);
      return NextResponse.json({ 
        error: 'Erro ao verificar motorista' 
      }, { status: 500 });
    }
    
    if (!existingDriver) {
      return NextResponse.json({ 
        error: 'Motorista não encontrado' 
      }, { status: 404 });
    }
    
    // Atualizar motorista
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({
        ...driverResult.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erro ao atualizar motorista:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar motorista' 
      }, { status: 500 });
    }
    
    // Retornar motorista atualizado
    return NextResponse.json(updatedDriver);
    
  } catch (error) {
    console.error('Erro ao processar atualização de motorista:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para excluir motorista (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair ID do motorista da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'ID do motorista é obrigatório' 
      }, { status: 400 });
    }
    
    // Verificar se o motorista existe e pertence ao usuário
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar motorista:', checkError);
      return NextResponse.json({ 
        error: 'Erro ao verificar motorista' 
      }, { status: 500 });
    }
    
    if (!existingDriver) {
      return NextResponse.json({ 
        error: 'Motorista não encontrado' 
      }, { status: 404 });
    }
    
    // Deletar atribuições de veículos do motorista primeiro
    const { error: assignmentError } = await supabase
      .from('driver_vehicle_assignments')
      .delete()
      .eq('driver_id', id);
    
    if (assignmentError) {
      console.error('Erro ao remover atribuições de veículos:', assignmentError);
      return NextResponse.json({ 
        error: 'Erro ao remover atribuições de veículos do motorista' 
      }, { status: 500 });
    }
    
    // Excluir motorista
    const { error: deleteError } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Erro ao excluir motorista:', deleteError);
      return NextResponse.json({ 
        error: 'Erro ao excluir motorista' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Motorista excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao processar exclusão de motorista:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 