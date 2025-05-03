import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  vehicleId: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  history: z.string().optional().transform(val => val ? parseInt(val, 10) : 0)
});

/**
 * Handler para obter posições dos veículos
 * GET /api/vehicles/positions - Retorna a última posição de todos os veículos do usuário
 * GET /api/vehicles/positions?vehicleId=123 - Retorna a última posição de um veículo específico
 * GET /api/vehicles/positions?vehicleId=123&history=10 - Retorna as últimas 10 posições de um veículo específico
 */
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
      return NextResponse.json({ 
        error: 'Parâmetros de consulta inválidos', 
        details: queryResult.error.format() 
      }, { status: 400 });
    }
    
    const { vehicleId, limit, history } = queryResult.data;
    
    // Se um ID de veículo específico for fornecido
    if (vehicleId) {
      // Verificar se o veículo pertence ao usuário
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (vehicleError) {
        console.error('Erro ao verificar propriedade do veículo:', vehicleError);
        return NextResponse.json({ error: 'Erro ao verificar veículo' }, { status: 500 });
      }
      
      if (!vehicle) {
        return NextResponse.json({ error: 'Veículo não encontrado ou não pertence ao usuário' }, { status: 404 });
      }
      
      // Se history > 0, retornar o histórico de posições
      if (history > 0) {
        const { data: positions, error: positionsError } = await supabase
          .from('positions')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('timestamp', { ascending: false })
          .limit(history);
          
        if (positionsError) {
          console.error('Erro ao buscar histórico de posições:', positionsError);
          return NextResponse.json({ error: 'Erro ao buscar histórico de posições' }, { status: 500 });
        }
        
        return NextResponse.json({ positions });
      }
      
      // Caso contrário, retornar apenas a última posição
      const { data: position, error: positionError } = await supabase
        .from('positions')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (positionError) {
        console.error('Erro ao buscar posição do veículo:', positionError);
        return NextResponse.json({ error: 'Erro ao buscar posição do veículo' }, { status: 500 });
      }
      
      if (!position) {
        return NextResponse.json({ error: 'Nenhuma posição encontrada para este veículo' }, { status: 404 });
      }
      
      return NextResponse.json({ position });
    }
    
    // Caso nenhum ID específico seja fornecido, retornar a última posição de todos os veículos do usuário
    
    // Primeiro, obter a lista de veículos do usuário
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('user_id', userId);
      
    if (vehiclesError) {
      console.error('Erro ao buscar veículos do usuário:', vehiclesError);
      return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
    }
    
    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ positions: [] });
    }
    
    // Para cada veículo, buscar a última posição
    const vehicleIds = vehicles.map(v => v.id);
    
    // Buscar a última posição registrada para cada veículo
    const { data: latestPositions, error: positionsError } = await supabase
      .from('positions')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('timestamp', { ascending: false });
      
    if (positionsError) {
      console.error('Erro ao buscar posições dos veículos:', positionsError);
      return NextResponse.json({ error: 'Erro ao buscar posições dos veículos' }, { status: 500 });
    }
    
    // Filtrar para ter apenas a posição mais recente de cada veículo
    const positionMap = new Map();
    latestPositions?.forEach(position => {
      if (!positionMap.has(position.vehicle_id) || 
          new Date(position.timestamp) > new Date(positionMap.get(position.vehicle_id).timestamp)) {
        positionMap.set(position.vehicle_id, position);
      }
    });
    
    const positions = Array.from(positionMap.values());
    
    return NextResponse.json({ positions });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 