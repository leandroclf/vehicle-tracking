import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta na requisição GET
const querySchema = z.object({
  ids: z.string().optional().transform(val => val ? val.split(',') : undefined)
});

// Esquema para validar o corpo da requisição PUT
const updateSchema = z.object({
  vehicle_id: z.string().uuid(),
  status: z.enum(['active', 'inactive', 'maintenance', 'offline']),
  last_update: z.string().datetime().optional(),
  battery_level: z.number().min(0).max(100).optional(),
  signal_strength: z.number().min(0).max(100).optional(),
  engine_status: z.enum(['on', 'off']).optional(),
  custom_status: z.string().max(50).optional()
});

// Esquema para validar o corpo da requisição POST (múltiplos veículos)
const batchUpdateSchema = z.object({
  updates: z.array(updateSchema).min(1)
});

// Definição de interface para o tipo de retorno
interface VehicleStatusWithVehicle {
  id: string;
  vehicle_id: string;
  status: string;
  last_update: string;
  battery_level?: number;
  signal_strength?: number;
  engine_status?: string;
  custom_status?: string;
  vehicles?: {
    name?: string;
    license_plate?: string;
  };
}

// Handler para obter status dos veículos
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
    
    const { ids } = queryResult.data;
    
    // Construir consulta base
    let query = supabase
      .from('vehicle_status')
      .select(`
        id,
        vehicle_id,
        status,
        last_update,
        battery_level,
        signal_strength,
        engine_status,
        custom_status,
        vehicles:vehicle_id (
          name,
          license_plate
        )
      `)
      .eq('user_id', userId);
    
    // Aplicar filtro de IDs se fornecido
    if (ids && ids.length > 0) {
      query = query.in('vehicle_id', ids);
    }
    
    // Executar consulta
    const { data: statusData, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar status dos veículos:', error);
      return NextResponse.json({ error: 'Erro ao buscar status dos veículos' }, { status: 500 });
    }
    
    // Formatar resposta
    const formattedStatus = (statusData as VehicleStatusWithVehicle[] | null)?.map(item => ({
      id: item.id,
      vehicle_id: item.vehicle_id,
      vehicle_name: item.vehicles?.name || 'Veículo desconhecido',
      license_plate: item.vehicles?.license_plate,
      status: item.status,
      last_update: item.last_update,
      battery_level: item.battery_level,
      signal_strength: item.signal_strength,
      engine_status: item.engine_status,
      custom_status: item.custom_status
    })) || [];
    
    return NextResponse.json({ statuses: formattedStatus });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar status de um veículo específico
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Obter e validar corpo da requisição
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validationResult.error.format() }, { status: 400 });
    }
    
    const statusData = validationResult.data;
    
    // Verificar se o veículo pertence ao usuário
    const { data: vehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', statusData.vehicle_id)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Erro ao verificar veículo:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar veículo' }, { status: 500 });
    }
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado ou sem permissão' }, { status: 404 });
    }
    
    // Verificar se já existe um registro de status para este veículo
    const { data: existingStatus, error: statusCheckError } = await supabase
      .from('vehicle_status')
      .select('id')
      .eq('vehicle_id', statusData.vehicle_id)
      .maybeSingle();
      
    if (statusCheckError) {
      console.error('Erro ao verificar status existente:', statusCheckError);
      return NextResponse.json({ error: 'Erro ao verificar status existente' }, { status: 500 });
    }
    
    let result;
    
    // Se já existir status, atualizar; caso contrário, inserir
    if (existingStatus) {
      // Adicionar timestamp de atualização se não fornecido
      if (!statusData.last_update) {
        statusData.last_update = new Date().toISOString();
      }
      
      // Atualizar status existente
      result = await supabase
        .from('vehicle_status')
        .update(statusData)
        .eq('vehicle_id', statusData.vehicle_id)
        .select()
        .single();
    } else {
      // Inserir novo status
      result = await supabase
        .from('vehicle_status')
        .insert({
          ...statusData,
          user_id: userId,
          last_update: statusData.last_update || new Date().toISOString()
        })
        .select()
        .single();
    }
    
    // Verificar erro na operação
    if (result.error) {
      console.error('Erro ao atualizar status do veículo:', result.error);
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
    }
    
    // Retornar status atualizado
    return NextResponse.json({ 
      status: result.data,
      message: 'Status do veículo atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualização em lote de múltiplos veículos
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Obter e validar corpo da requisição
    const body = await request.json();
    const validationResult = batchUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { updates } = validationResult.data;
    
    // Extrair IDs dos veículos para verificação
    const vehicleIds = updates.map(update => update.vehicle_id);
    
    // Verificar se todos os veículos pertencem ao usuário
    const { data: vehicles, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .in('id', vehicleIds)
      .eq('user_id', userId);
      
    if (checkError) {
      console.error('Erro ao verificar veículos:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar veículos' }, { status: 500 });
    }
    
    // Criar conjunto de IDs de veículos validados
    const validVehicleIds = new Set(vehicles?.map(v => v.id) || []);
    
    // Filtrar atualizações apenas para veículos validados
    const validUpdates = updates.filter(update => validVehicleIds.has(update.vehicle_id));
    
    if (validUpdates.length === 0) {
      return NextResponse.json({ error: 'Nenhum veículo válido para atualização' }, { status: 400 });
    }
    
    // Para cada atualização válida, realizar upsert
    const timestamp = new Date().toISOString();
    const upsertData = validUpdates.map(update => ({
      ...update,
      user_id: userId,
      last_update: update.last_update || timestamp
    }));
    
    // Realizar upsert em lote
    const { data: results, error: upsertError } = await supabase
      .from('vehicle_status')
      .upsert(upsertData, {
        onConflict: 'vehicle_id',
        ignoreDuplicates: false
      })
      .select('vehicle_id, status, last_update');
      
    if (upsertError) {
      console.error('Erro na atualização em lote:', upsertError);
      return NextResponse.json({ error: 'Erro na atualização em lote' }, { status: 500 });
    }
    
    // Retornar resultados
    return NextResponse.json({ 
      updated: results?.length || 0,
      statuses: results || [],
      message: `${results?.length || 0} veículo(s) atualizado(s) com sucesso`
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição em lote:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 