import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getDbPool } from '@/lib/database';
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
    // TODO: Implementar query SQL direta
    const pool = getDbPool();
    let statusQuery = `
      SELECT 
        vs.id,
        vs.vehicle_id,
        vs.status,
        vs.last_update,
        vs.battery_level,
        vs.signal_strength,
        vs.engine_status,
        vs.custom_status,
        v.name as vehicle_name,
        v.license_plate
      FROM vehicle_status vs
      JOIN vehicles v ON vs.vehicle_id = v.id
      WHERE vs.user_id = $1
    `;
    
    let queryParams = [userId];
    
    // Aplicar filtro de IDs se fornecido
    if (ids && ids.length > 0) {
      statusQuery += ` AND vs.vehicle_id = ANY($2)`;
      queryParams.push(ids);
    }
    
    // Executar consulta
    const statusResult = await pool.query(statusQuery, queryParams);
    const statusData = statusResult.rows;
    const error = null;
    
    if (error) {
      console.error('Erro ao buscar status dos veículos:', error);
      return NextResponse.json({ error: 'Erro ao buscar status dos veículos' }, { status: 500 });
    }
    
    // Formatar resposta
    const formattedStatus = statusData?.map(item => ({
      id: item.id,
      vehicle_id: item.vehicle_id,
      vehicle_name: item.vehicle_name || 'Veículo desconhecido',
      license_plate: item.license_plate,
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
    // TODO: Implementar query SQL direta
    const pool = getDbPool();
    const vehicleQuery = `
      SELECT id
      FROM vehicles
      WHERE id = $1 AND user_id = $2
    `;
    const vehicleResult = await pool.query(vehicleQuery, [statusData.vehicle_id, userId]);
    const vehicle = vehicleResult.rows[0];
    const checkError = null;
      
    if (checkError) {
      console.error('Erro ao verificar veículo:', checkError);
      return NextResponse.json({ error: 'Erro ao verificar veículo' }, { status: 500 });
    }
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado ou sem permissão' }, { status: 404 });
    }
    
    // Verificar se já existe um registro de status para este veículo
    // TODO: Implementar query SQL direta
    const statusCheckQuery = `
      SELECT id
      FROM vehicle_status
      WHERE vehicle_id = $1
    `;
    const statusCheckResult = await pool.query(statusCheckQuery, [statusData.vehicle_id]);
    const existingStatus = statusCheckResult.rows[0];
    const statusCheckError = null;
      
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
      const updateQuery = `
        UPDATE vehicle_status
        SET ${Object.keys(statusData).map((key, index) => `${key} = $${index + 2}`).join(', ')}
        WHERE vehicle_id = $1
        RETURNING *
      `;
      const updateResult = await pool.query(updateQuery, [
        statusData.vehicle_id,
        ...Object.values(statusData)
      ]);
      result = { data: updateResult.rows[0], error: null };
    } else {
      // Inserir novo status
      const insertData = {
        ...statusData,
        user_id: userId,
        last_update: statusData.last_update || new Date().toISOString()
      };
      const insertQuery = `
        INSERT INTO vehicle_status (${Object.keys(insertData).join(', ')})
        VALUES (${Object.keys(insertData).map((_, index) => `$${index + 1}`).join(', ')})
        RETURNING *
      `;
      const insertResult = await pool.query(insertQuery, Object.values(insertData));
      result = { data: insertResult.rows[0], error: null };
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
    // TODO: Implementar query SQL direta
    const pool = getDbPool();
    const vehiclesQuery = `
      SELECT id
      FROM vehicles
      WHERE id = ANY($1) AND user_id = $2
    `;
    const vehiclesResult = await pool.query(vehiclesQuery, [vehicleIds, userId]);
    const vehicles = vehiclesResult.rows;
    const checkError = null;
      
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
    // TODO: Implementar query SQL direta
    const upsertPromises = upsertData.map(async (data) => {
      const upsertQuery = `
        INSERT INTO vehicle_status (${Object.keys(data).join(', ')})
        VALUES (${Object.keys(data).map((_, index) => `$${index + 1}`).join(', ')})
        ON CONFLICT (vehicle_id)
        DO UPDATE SET
          ${Object.keys(data).filter(key => key !== 'vehicle_id' && key !== 'user_id').map(key => `${key} = EXCLUDED.${key}`).join(', ')}
        RETURNING vehicle_id, status, last_update
      `;
      return pool.query(upsertQuery, Object.values(data));
    });
    
    const upsertResults = await Promise.all(upsertPromises);
    const results = upsertResults.map(result => result.rows[0]);
    const upsertError = null;
      
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