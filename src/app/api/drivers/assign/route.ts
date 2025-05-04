import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Esquema para validar atribuição de veículo a motorista
const assignmentSchema = z.object({
  driver_id: z.string().min(1, 'ID do motorista é obrigatório'),
  vehicle_id: z.string().min(1, 'ID do veículo é obrigatório'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_primary: z.boolean().optional().default(false)
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

// Handler para listar atribuições de veículos (GET)
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
    
    // Extrair parâmetros de consulta
    const url = new URL(request.url);
    const driverId = url.searchParams.get('driver_id');
    const vehicleId = url.searchParams.get('vehicle_id');
    
    if (!driverId && !vehicleId) {
      return NextResponse.json({ 
        error: 'É necessário fornecer driver_id ou vehicle_id' 
      }, { status: 400 });
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
        return NextResponse.json({ 
          error: 'Motorista não encontrado ou não pertence ao usuário' 
        }, { status: 404 });
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
        return NextResponse.json({ 
          error: 'Veículo não encontrado ou não pertence ao usuário' 
        }, { status: 404 });
      }
    }
    
    // Executar consulta
    const { data: assignments, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar atribuições:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar atribuições de veículos' 
      }, { status: 500 });
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
    
    return NextResponse.json({
      assignments: formattedAssignments
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de atribuições:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para criar atribuição de veículo (POST)
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
    const assignmentResult = assignmentSchema.safeParse(body);
    
    if (!assignmentResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: assignmentResult.error.format() 
      }, { status: 400 });
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
      return NextResponse.json({ 
        error: 'Motorista não encontrado ou não pertence ao usuário' 
      }, { status: 404 });
    }
    
    // Verificar se o veículo pertence ao usuário
    const { data: vehicleCheck, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', assignmentData.vehicle_id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (vehicleError || !vehicleCheck) {
      return NextResponse.json({ 
        error: 'Veículo não encontrado ou não pertence ao usuário' 
      }, { status: 404 });
    }
    
    // Verificar se já existe uma atribuição primária para o veículo, se a nova for primária
    if (assignmentData.is_primary) {
      const { data: existingPrimary, error: primaryError } = await supabase
        .from('driver_vehicle_assignments')
        .update({ is_primary: false })
        .eq('vehicle_id', assignmentData.vehicle_id)
        .eq('is_primary', true);
      
      if (primaryError) {
        console.error('Erro ao atualizar atribuições primárias existentes:', primaryError);
        return NextResponse.json({ 
          error: 'Erro ao atualizar atribuições primárias existentes' 
        }, { status: 500 });
      }
    }
    
    // Inserir nova atribuição
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
      return NextResponse.json({ 
        error: 'Erro ao criar atribuição de veículo' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Atribuição criada com sucesso',
      assignment: newAssignment
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao processar criação de atribuição:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para remover atribuição (DELETE)
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
    
    // Extrair ID da atribuição da URL
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json({ 
        error: 'ID da atribuição é obrigatório' 
      }, { status: 400 });
    }
    
    // Verificar se a atribuição existe e pertence a um veículo/motorista do usuário
    const { data, error: checkError } = await supabase
      .from('driver_vehicle_assignments')
      .select(`
        id,
        driver_id,
        vehicle_id,
        drivers:driver_id (user_id),
        vehicles:vehicle_id (user_id)
      `)
      .eq('id', assignmentId)
      .single();
    
    if (checkError) {
      console.error('Erro ao verificar atribuição:', checkError);
      return NextResponse.json({ 
        error: 'Erro ao verificar atribuição' 
      }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ 
        error: 'Atribuição não encontrada' 
      }, { status: 404 });
    }
    
    // Converter para o tipo correto com cast seguro
    const assignment = data as unknown as AssignmentCheck;
    
    // Verificar se o motorista ou o veículo pertence ao usuário
    const driverUserId = assignment.drivers?.user_id;
    const vehicleUserId = assignment.vehicles?.user_id;
    
    if (
      (driverUserId && driverUserId !== userId) &&
      (vehicleUserId && vehicleUserId !== userId)
    ) {
      return NextResponse.json({ 
        error: 'Não autorizado a remover esta atribuição' 
      }, { status: 403 });
    }
    
    // Remover atribuição
    const { error: deleteError } = await supabase
      .from('driver_vehicle_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (deleteError) {
      console.error('Erro ao remover atribuição:', deleteError);
      return NextResponse.json({ 
        error: 'Erro ao remover atribuição' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Atribuição removida com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao processar remoção de atribuição:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 