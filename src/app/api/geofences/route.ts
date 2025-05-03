import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  vehicle_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sort: z.enum(['asc', 'desc']).optional().default('asc')
});

// Esquema para validar dados de criação/atualização de geocerca
const geofenceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  type: z.enum(['circle', 'polygon', 'rectangle']),
  coordinates: z.string().min(1, 'Coordenadas são obrigatórias'),
  radius: z.number().positive().optional(),
  color: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  vehicle_ids: z.array(z.string()).optional()
});

// Interface para a geocerca vinda do Supabase
interface DbGeofence {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: 'circle' | 'polygon' | 'rectangle';
  coordinates: string;
  radius: number | null;
  color: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  vehicles?: {
    id: string;
    name: string;
    license_plate: string;
  }[];
}

// Handler para listar geocercas (GET)
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
    
    const { limit, offset, vehicle_id, status, sort } = queryResult.data;
    
    // Construir consulta base
    let query = supabase
      .from('geofences')
      .select(`
        *,
        vehicles:geofence_vehicles(vehicle_id)
      `)
      .eq('user_id', userId)
      .order('name', { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtro de status se não for 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Filtrar por veículo se especificado
    if (vehicle_id) {
      query = query.eq('vehicles.vehicle_id', vehicle_id);
    }
    
    // Executar consulta
    const { data: geofences, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar geocercas:', error);
      return NextResponse.json({ error: 'Erro ao buscar geocercas' }, { status: 500 });
    }
    
    // Retornar resultados
    return NextResponse.json({
      geofences,
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

// Handler para criar geocerca (POST)
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
    const geofenceResult = geofenceSchema.safeParse(body);
    
    if (!geofenceResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: geofenceResult.error.format() }, { status: 400 });
    }
    
    const { vehicle_ids, ...geofenceData } = geofenceResult.data;
    
    // Iniciar transação
    const { data: newGeofence, error: insertError } = await supabase
      .from('geofences')
      .insert({
        ...geofenceData,
        user_id: userId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Erro ao criar geocerca:', insertError);
      return NextResponse.json({ error: 'Erro ao criar geocerca' }, { status: 500 });
    }
    
    // Associar veículos se fornecidos
    if (vehicle_ids && vehicle_ids.length > 0) {
      const geofenceVehicles = vehicle_ids.map(vehicle_id => ({
        geofence_id: newGeofence.id,
        vehicle_id,
        user_id: userId
      }));
      
      const { error: linkError } = await supabase
        .from('geofence_vehicles')
        .insert(geofenceVehicles);
      
      if (linkError) {
        console.error('Erro ao associar veículos à geocerca:', linkError);
        // Não falhar a operação principal, apenas logar o erro
      }
    }
    
    // Retornar geocerca criada
    return NextResponse.json(newGeofence, { status: 201 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para atualizar geocerca (PUT)
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
    const { id, vehicle_ids, ...geofenceData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID da geocerca é obrigatório' }, { status: 400 });
    }
    
    const geofenceResult = geofenceSchema.partial().safeParse(geofenceData);
    
    if (!geofenceResult.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: geofenceResult.error.format() }, { status: 400 });
    }
    
    // Verificar se a geocerca existe e pertence ao usuário
    const { data: existingGeofence, error: checkError } = await supabase
      .from('geofences')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar geocerca:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar geocerca' }, { status: 500 });
    }
    
    if (!existingGeofence) {
      return NextResponse.json({ error: 'Geocerca não encontrada' }, { status: 404 });
    }
    
    // Atualizar geocerca
    const { data: updatedGeofence, error: updateError } = await supabase
      .from('geofences')
      .update(geofenceResult.data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erro ao atualizar geocerca:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar geocerca' }, { status: 500 });
    }
    
    // Atualizar associações de veículos se fornecidos
    if (vehicle_ids !== undefined) {
      // Primeiro remover todas as associações existentes
      const { error: deleteError } = await supabase
        .from('geofence_vehicles')
        .delete()
        .eq('geofence_id', id);
      
      if (deleteError) {
        console.error('Erro ao remover associações de veículos:', deleteError);
        // Não falhar a operação principal, apenas logar o erro
      }
      
      // Adicionar novas associações
      if (vehicle_ids && vehicle_ids.length > 0) {
        const geofenceVehicles = vehicle_ids.map(vehicle_id => ({
          geofence_id: id,
          vehicle_id,
          user_id: userId
        }));
        
        const { error: linkError } = await supabase
          .from('geofence_vehicles')
          .insert(geofenceVehicles);
        
        if (linkError) {
          console.error('Erro ao associar veículos à geocerca:', linkError);
          // Não falhar a operação principal, apenas logar o erro
        }
      }
    }
    
    // Retornar geocerca atualizada
    return NextResponse.json(updatedGeofence);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para excluir geocerca (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair ID da geocerca da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID da geocerca é obrigatório' }, { status: 400 });
    }
    
    // Verificar se a geocerca existe e pertence ao usuário
    const { data: existingGeofence, error: checkError } = await supabase
      .from('geofences')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar geocerca:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar geocerca' }, { status: 500 });
    }
    
    if (!existingGeofence) {
      return NextResponse.json({ error: 'Geocerca não encontrada' }, { status: 404 });
    }
    
    // Excluir associações de veículos primeiro
    const { error: deleteAssocError } = await supabase
      .from('geofence_vehicles')
      .delete()
      .eq('geofence_id', id);
    
    if (deleteAssocError) {
      console.error('Erro ao excluir associações de veículos:', deleteAssocError);
      // Não falhar a operação principal, apenas logar o erro
    }
    
    // Excluir geocerca
    const { error: deleteError } = await supabase
      .from('geofences')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Erro ao excluir geocerca:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir geocerca' }, { status: 500 });
    }
    
    // Retornar sucesso
    return NextResponse.json({ message: 'Geocerca excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}