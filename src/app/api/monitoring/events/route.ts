import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  vehicle_id: z.string().optional(),
  type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  sort: z.enum(['asc', 'desc']).optional().default('desc')
});

// Interface para eventos
interface Event {
  id: string;
  vehicle_id: string;
  type: string;
  timestamp: string;
  details: any;
  position?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  };
  vehicle?: {
    name: string;
    license_plate: string;
  };
}

// Handler para listar eventos de monitoramento (GET)
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
    
    const { vehicle_id, type, from, to, limit, offset, sort } = queryResult.data;
    
    // Construir consulta base
    let query = supabase
      .from('monitoring_events')
      .select(`
        *,
        vehicles:vehicle_id (name, license_plate)
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtros adicionais se fornecidos
    if (vehicle_id) {
      query = query.eq('vehicle_id', vehicle_id);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (from) {
      query = query.gte('timestamp', from);
    }
    
    if (to) {
      query = query.lte('timestamp', to);
    }
    
    // Executar consulta
    const { data: events, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar eventos de monitoramento' 
      }, { status: 500 });
    }
    
    // Formatar resultados
    const formattedEvents = (events as Event[] | null)?.map(event => {
      const vehicle = event.vehicle;
      return {
        id: event.id,
        vehicle_id: event.vehicle_id,
        vehicleName: vehicle?.name || 'Veículo desconhecido',
        licensePlate: vehicle?.license_plate,
        type: event.type,
        timestamp: event.timestamp,
        details: typeof event.details === 'string' ? JSON.parse(event.details) : event.details,
        position: event.position
      };
    }) || [];
    
    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de eventos:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 