import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
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

// Esquema para remover atribuição
const removeAssignmentSchema = z.object({
  assignment_id: z.string().min(1, 'ID da atribuição é obrigatório')
});

// Interfaces para tipagem
interface Driver {
  id: string;
  name: string;
  license_number: string;
  user_id?: string;
}

interface Vehicle {
  id: string;
  name: string;
  license_plate: string;
  user_id?: string;
}

interface Assignment {
  id: string;
  driver_id: string;
  vehicle_id: string;
  start_date?: string;
  end_date?: string;
  is_primary: boolean;
  created_at: string;
  drivers?: Driver;
  vehicles?: Vehicle;
}

// Type para resposta do Supabase para usar em type cast
type SupabaseAssignment = {
  id: string;
  driver_id: string;
  vehicle_id: string;
  start_date?: string;
  end_date?: string;
  is_primary: boolean;
  created_at: string;
  drivers?: {
    id: string;
    name: string;
    license_number: string;
  };
  vehicles?: {
    id: string;
    name: string;
    license_plate: string;
  };
};

// Type para a verificação de atribuição
type AssignmentCheck = {
  id: string;
  driver_id: string;
  vehicle_id: string;
  drivers?: {
    user_id: string;
  };
  vehicles?: {
    user_id: string;
  };
};

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
    
    const userId = authResult.user.id;
    
    // Extrair parâmetros de consulta
    const url = new URL(request.url);
    const driverId = url.searchParams.get('driver_id');
    const vehicleId = url.searchParams.get('vehicle_id');
    
    if (!driverId && !vehicleId) {
      return errorResponse('É necessário fornecer driver_id ou vehicle_id');
    }
    
    // Construir consulta base
    let query = supabase
      .from('driver_vehicle_assignments')
      .select(`
        id,
        driver_id,
        vehicle_id,
        start_date,
        end_date,
        is_primary,
        created_at,
        drivers:driver_id (id, name, license_number),
        vehicles:vehicle_id (id, name, license_plate)
      `);
    
    // Aplicar filtros
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }
    
    // Verificar se os veículos e motoristas pertencem ao usuário
    if (driverId) {
      const { data: driverCheck, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', driverId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (driverError || !driverCheck) {
        return errorResponse('Motorista não encontrado ou não pertence ao usuário', undefined, 404);
      }
    }
    
    if (vehicleId) {
      const { data: vehicleCheck, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (vehicleError || !vehicleCheck) {
        return errorResponse('Veículo não encontrado ou não pertence ao usuário', undefined, 404);
      }
    }
    
    // Executar consulta
    const { data: assignments, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar atribuições:', error);
      return errorResponse('Erro ao buscar atribuições de veículos', undefined, 500);
    }
    
    // Formatar resposta com conversão segura de tipo
    const formattedAssignments = assignments?.map(assignment => {
      // Converte para tipo intermediário para garantir segurança
      const typedAssignment = assignment as unknown as SupabaseAssignment;
      
      return {
        id: typedAssignment.id,
        driver_id: typedAssignment.driver_id,
        vehicle_id: typedAssignment.vehicle_id,
        start_date: typedAssignment.start_date,
        end_date: typedAssignment.end_date,
        is_primary: typedAssignment.is_primary,
        created_at: typedAssignment.created_at,
        driver: typedAssignment.drivers ? {
          id: typedAssignment.drivers.id,
          name: typedAssignment.drivers.name,
          license_number: typedAssignment.drivers.license_number
        } : null,
        vehicle: typedAssignment.vehicles ? {
          id: typedAssignment.vehicles.id,
          name: typedAssignment.vehicles.name,
          license_plate: typedAssignment.vehicles.license_plate
        } : null
      };
    }) || [];
    
    return successResponse({
      assignments: formattedAssignments
    });
    
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
    
    const userId = authResult.user.id;
    
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
      
      const { driver_id, vehicle_ids } = bulkResult.data;
      
      // Verificar se o motorista pertence ao usuário
      const { data: driverCheck, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', driver_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (driverError || !driverCheck) {
        return errorResponse('Motorista não encontrado ou não pertence ao usuário', undefined, 404);
      }
      
      // Verificar se todos os veículos pertencem ao usuário
      const { data: vehiclesCheck, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id')
        .in('id', vehicle_ids)
        .eq('user_id', userId);
      
      if (vehiclesError) {
        console.error('Erro ao verificar veículos:', vehiclesError);
        return errorResponse('Erro ao verificar veículos', undefined, 500);
      }
      
      const foundVehicleIds = vehiclesCheck?.map(v => v.id) || [];
      if (foundVehicleIds.length !== vehicle_ids.length) {
        return errorResponse(
          'Um ou mais veículos não foram encontrados ou não pertencem ao usuário', 
          {
            requested: vehicle_ids.length,
            found: foundVehicleIds.length
          },
          404
        );
      }
      
      // Primeiro, remover todas as atribuições existentes deste motorista
      const { error: deleteError } = await supabase
        .from('driver_vehicle_assignments')
        .delete()
        .eq('driver_id', driver_id);
      
      if (deleteError) {
        console.error('Erro ao remover atribuições existentes:', deleteError);
        return errorResponse('Erro ao gerenciar atribuições de veículos', undefined, 500);
      }
      
      // Criar novas atribuições para cada veículo
      const assignmentsToInsert = vehicle_ids.map(vehicle_id => ({
        driver_id,
        vehicle_id,
        created_at: new Date().toISOString(),
        is_primary: false // Por padrão, nenhum é primário
      }));
      
      const { data: newAssignments, error: insertError } = await supabase
        .from('driver_vehicle_assignments')
        .insert(assignmentsToInsert)
        .select();
      
      if (insertError) {
        console.error('Erro ao criar atribuições em massa:', insertError);
        return errorResponse('Erro ao criar atribuições de veículos', undefined, 500);
      }
      
      return successResponse(
        { assignments: newAssignments },
        'Veículos atribuídos com sucesso ao motorista',
        201
      );
      
    } else {
      // Atribuição individual
      const assignmentResult = assignmentSchema.safeParse(body);
      
      if (!assignmentResult.success) {
        return errorResponse(
          'Dados inválidos', 
          assignmentResult.error.format()
        );
      }
      
      const assignmentData = assignmentResult.data;
      
      // Verificar se o motorista pertence ao usuário
      const { data: driverCheck, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', assignmentData.driver_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (driverError || !driverCheck) {
        return errorResponse('Motorista não encontrado ou não pertence ao usuário', undefined, 404);
      }
      
      // Verificar se o veículo pertence ao usuário
      const { data: vehicleCheck, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', assignmentData.vehicle_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (vehicleError || !vehicleCheck) {
        return errorResponse('Veículo não encontrado ou não pertence ao usuário', undefined, 404);
      }
      
      // Verificar se já existe uma atribuição para este motorista e veículo
      const { data: existingAssignment, error: checkError } = await supabase
        .from('driver_vehicle_assignments')
        .select('id')
        .eq('driver_id', assignmentData.driver_id)
        .eq('vehicle_id', assignmentData.vehicle_id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Erro ao verificar atribuição existente:', checkError);
        return errorResponse('Erro ao verificar atribuição existente', undefined, 500);
      }
      
      if (existingAssignment) {
        return errorResponse(
          'Este veículo já está atribuído a este motorista',
          { assignment_id: existingAssignment.id },
          409
        );
      }
      
      // Se for definido como primário, atualizar outras atribuições para não serem primárias
      if (assignmentData.is_primary) {
        const { error: updateError } = await supabase
          .from('driver_vehicle_assignments')
          .update({ is_primary: false })
          .eq('driver_id', assignmentData.driver_id);
        
        if (updateError) {
          console.error('Erro ao atualizar atribuições existentes:', updateError);
          return errorResponse('Erro ao gerenciar atribuições primárias', undefined, 500);
        }
      }
      
      // Criar nova atribuição
      const { data: newAssignment, error: insertError } = await supabase
        .from('driver_vehicle_assignments')
        .insert({
          ...assignmentData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao criar atribuição:', insertError);
        return errorResponse('Erro ao criar atribuição de veículo', undefined, 500);
      }
      
      return successResponse(
        newAssignment, 
        'Veículo atribuído com sucesso ao motorista',
        201
      );
    }
    
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
    
    const userId = authResult.user.id;
    
    // Extrair ID da atribuição dos parâmetros
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');
    
    if (!assignmentId) {
      return errorResponse('ID da atribuição é obrigatório');
    }
    
    // Verificar se a atribuição existe e pertence ao usuário
    const { data: assignment, error: checkError } = await supabase
      .from('driver_vehicle_assignments')
      .select(`
        id,
        driver_id,
        vehicle_id,
        drivers:driver_id (
          user_id
        ),
        vehicles:vehicle_id (
          user_id
        )
      `)
      .eq('id', assignmentId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar atribuição:', checkError);
      return errorResponse('Erro ao verificar atribuição', undefined, 500);
    }
    
    if (!assignment) {
      return errorResponse('Atribuição não encontrada', undefined, 404);
    }
    
    // Confirmar que a atribuição pertence ao usuário
    const typedAssignment = assignment as unknown as AssignmentCheck;
    
    if (
      (typedAssignment.drivers?.user_id !== userId) || 
      (typedAssignment.vehicles?.user_id !== userId)
    ) {
      return errorResponse('Atribuição não pertence ao usuário', undefined, 403);
    }
    
    // Excluir atribuição
    const { error: deleteError } = await supabase
      .from('driver_vehicle_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (deleteError) {
      console.error('Erro ao excluir atribuição:', deleteError);
      return errorResponse('Erro ao excluir atribuição', undefined, 500);
    }
    
    return successResponse(
      null,
      'Atribuição excluída com sucesso'
    );
    
  } catch (error) {
    console.error('Erro ao processar exclusão de atribuição:', error);
    return errorResponse('Erro interno do servidor', undefined, 500);
  }
} 