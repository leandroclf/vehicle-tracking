import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  vehicle_id: z.string().optional(),
  status: z.enum(['read', 'unread']).optional(),
  type: z.string().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc')
});

// Definir interface para o alerta vindo do Supabase
interface DbAlert {
  id: string;
  user_id: string;
  vehicle_id: string;
  type: string;
  message: string;
  details: string | null;
  status: 'read' | 'unread';
  severity: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  vehicles?: {
    name: string;
    license_plate: string;
  } | null;
}

// Handler para listar alertas (GET)
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
    
    const { limit, offset, vehicle_id, status, type, sort } = queryResult.data;
    
    // Construir a consulta base
    let query = supabase
      .from('alerts')
      .select(`
        *,
        vehicles:vehicle_id (name, license_plate)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: sort === 'asc' })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // Aplicar filtros adicionais se fornecidos
    if (vehicle_id) {
      query = query.eq('vehicle_id', vehicle_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    // Executar a consulta
    const { data: alerts, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar alertas:', error);
      return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
    }
    
    // Formatar os resultados
    const formattedAlerts = (alerts as DbAlert[] | null)?.map(alert => {
      const vehicle = alert.vehicles;
      return {
        id: alert.id,
        vehicle_id: alert.vehicle_id,
        vehicleName: vehicle?.name || 'Veículo desconhecido',
        licensePlate: vehicle?.license_plate,
        type: alert.type,
        message: alert.message,
        details: alert.details ? JSON.parse(alert.details) : null,
        status: alert.status,
        severity: alert.severity,
        created_at: alert.created_at,
        updated_at: alert.updated_at
      };
    }) || [];
    
    return NextResponse.json({
      alerts: formattedAlerts,
      count,
      limit,
      offset
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Esquema para marcar alertas específicos como lidos
const markReadSchema = z.object({
  alert_ids: z.array(z.string()).min(1, "Pelo menos um ID de alerta é necessário"),
});

// Handler para marcar alertas específicos como lidos (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Obter e validar os IDs dos alertas a serem marcados como lidos
    const body = await request.json();
    const result = markReadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 });
    }
    
    const { alert_ids } = result.data;
    
    // Atualizar o status dos alertas para 'read'
    const { error, count } = await supabase
      .from('alerts')
      .update({ 
        status: 'read',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('id', alert_ids);
    
    if (error) {
      console.error('Erro ao marcar alertas como lidos:', error);
      return NextResponse.json({ error: 'Erro ao marcar alertas como lidos' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: `${count || 0} alerta(s) marcado(s) como lido(s)` 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erro ao marcar alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 