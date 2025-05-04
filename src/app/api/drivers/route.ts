import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

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

// Função para estruturar respostas de erro de forma consistente
function errorResponse(message: string, details?: any, status: number = 400) {
  return NextResponse.json({ 
    success: false,
    error: message,
    details: details || undefined
  }, { status });
}

// Função para estruturar respostas de sucesso de forma consistente
function successResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json({ 
    success: true,
    message,
    data
  }, { status });
}

// Handler para listar motoristas (GET)
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
    
    const userId = authResult.user.id;
    
    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!queryResult.success) {
      return errorResponse(
        'Parâmetros de consulta inválidos', 
        queryResult.error.format()
      );
    }
    
    const { limit, offset, status, sort, search, license_type } = queryResult.data;
    
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
    
    // Aplicar filtro de pesquisa se fornecido
    if (search) {
      query = query.or(`name.ilike.%${search}%,license_number.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Aplicar filtro de tipo de CNH se fornecido
    if (license_type) {
      query = query.eq('license_type', license_type);
    }
    
    // Executar consulta
    const { data: drivers, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar motoristas:', error);
      return errorResponse('Erro ao buscar motoristas', undefined, 500);
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
    
    return successResponse({
      drivers: formattedDrivers,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de motoristas:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
}

// Handler para criar motorista (POST)
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
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const driverResult = driverSchema.safeParse(body);
    
    if (!driverResult.success) {
      return errorResponse(
        'Dados inválidos', 
        driverResult.error.format()
      );
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
      return errorResponse('Erro ao verificar motorista existente', undefined, 500);
    }
    
    if (existingDriver) {
      return errorResponse('Já existe um motorista com esta CNH', undefined, 409);
    }
    
    // Verificar se o email já está em uso (se fornecido)
    if (driverData.email) {
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('drivers')
        .select('id')
        .eq('email', driverData.email)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (emailCheckError) {
        console.error('Erro ao verificar email existente:', emailCheckError);
        return errorResponse('Erro ao verificar email existente', undefined, 500);
      }
      
      if (existingEmail) {
        return errorResponse('Este email já está associado a outro motorista', undefined, 409);
      }
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
      return errorResponse('Erro ao criar motorista', undefined, 500);
    }
    
    // Retornar motorista criado
    return successResponse(
      newDriver, 
      'Motorista criado com sucesso', 
      201
    );
    
  } catch (error) {
    console.error('Erro ao processar criação de motorista:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
}

// Handler para atualizar motorista (PUT)
export async function PUT(request: NextRequest) {
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
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json() as { id: string; [key: string]: unknown };
    const { id, ...driverData } = body;
    
    if (!id) {
      return errorResponse('ID do motorista é obrigatório');
    }
    
    const driverResult = driverSchema.partial().safeParse(driverData);
    
    if (!driverResult.success) {
      return errorResponse(
        'Dados inválidos', 
        driverResult.error.format()
      );
    }
    
    const updatedData = driverResult.data;
    
    // Verificar se o motorista existe e pertence ao usuário
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id, license_number, email')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar motorista:', checkError);
      return errorResponse('Erro ao verificar motorista', undefined, 500);
    }
    
    if (!existingDriver) {
      return errorResponse('Motorista não encontrado', undefined, 404);
    }
    
    // Verificar se a CNH atualizada já existe em outro motorista (se fornecida)
    if (updatedData.license_number && updatedData.license_number !== existingDriver.license_number) {
      const { data: duplicateLicense, error: licenseCheckError } = await supabase
        .from('drivers')
        .select('id')
        .eq('license_number', updatedData.license_number)
        .eq('user_id', userId)
        .neq('id', id)
        .maybeSingle();
      
      if (licenseCheckError) {
        console.error('Erro ao verificar CNH existente:', licenseCheckError);
        return errorResponse('Erro ao verificar CNH existente', undefined, 500);
      }
      
      if (duplicateLicense) {
        return errorResponse('Esta CNH já está associada a outro motorista', undefined, 409);
      }
    }
    
    // Verificar se o email atualizado já existe em outro motorista (se fornecido)
    if (updatedData.email && updatedData.email !== existingDriver.email) {
      const { data: duplicateEmail, error: emailCheckError } = await supabase
        .from('drivers')
        .select('id')
        .eq('email', updatedData.email)
        .eq('user_id', userId)
        .neq('id', id)
        .maybeSingle();
      
      if (emailCheckError) {
        console.error('Erro ao verificar email existente:', emailCheckError);
        return errorResponse('Erro ao verificar email existente', undefined, 500);
      }
      
      if (duplicateEmail) {
        return errorResponse('Este email já está associado a outro motorista', undefined, 409);
      }
    }
    
    // Atualizar motorista
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erro ao atualizar motorista:', updateError);
      return errorResponse('Erro ao atualizar motorista', undefined, 500);
    }
    
    // Retornar motorista atualizado
    return successResponse(
      updatedDriver, 
      'Motorista atualizado com sucesso'
    );
    
  } catch (error) {
    console.error('Erro ao processar atualização de motorista:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
}

// Handler para excluir motorista (DELETE)
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
    
    const userId = authResult.user.id;
    
    // Extrair ID do motorista
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID do motorista é obrigatório');
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
      return errorResponse('Erro ao verificar motorista', undefined, 500);
    }
    
    if (!existingDriver) {
      return errorResponse('Motorista não encontrado', undefined, 404);
    }
    
    // Deletar todas as associações de veículos primeiro
    const { error: deleteAssignmentsError } = await supabase
      .from('driver_vehicle_assignments')
      .delete()
      .eq('driver_id', id);
    
    if (deleteAssignmentsError) {
      console.error('Erro ao excluir associações de veículos:', deleteAssignmentsError);
      return errorResponse('Erro ao excluir associações de veículos', undefined, 500);
    }
    
    // Excluir motorista
    const { error: deleteError } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Erro ao excluir motorista:', deleteError);
      return errorResponse('Erro ao excluir motorista', undefined, 500);
    }
    
    // Retornar resposta de sucesso
    return successResponse(
      null, 
      'Motorista excluído com sucesso'
    );
    
  } catch (error) {
    console.error('Erro ao processar exclusão de motorista:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
} 