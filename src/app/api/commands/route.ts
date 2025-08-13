import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schema de validação para criação de comando
const createCommandSchema = z.object({
  vehicle_id: z.string().uuid('ID do veículo deve ser um UUID válido'),
  type: z.enum([
    'block_vehicle',
    'unblock_vehicle', 
    'activate_siren',
    'deactivate_siren',
    'flash_lights',
    'request_location',
    'emergency_stop'
  ]),
  confirmation_required: z.boolean().optional().default(true),
  metadata: z.record(z.any()).optional().default({})
});

// Schema para confirmação de comando
const confirmCommandSchema = z.object({
  command_id: z.string().uuid('ID do comando deve ser um UUID válido'),
  confirmation_token: z.string().min(1, 'Token de confirmação é obrigatório')
});

/**
 * POST /api/commands - Criar novo comando remoto
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const pool = getDbPool();

    // Validar dados de entrada
    const body = await request.json();
    const validatedData = createCommandSchema.parse(body);

    // Verificar se o usuário possui o veículo
    // TODO: Implementar query SQL direta
    const vehicle = null;
    const vehicleError = null;
    // await pool.query(...)
    //   .from('vehicles')
    //   .select('id, name, user_id')
    //   .eq('id', validatedData.vehicle_id)
    //   .eq('user_id', user.id)
    //   .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado ou sem permissão', code: 'VEHICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Gerar token de confirmação se necessário
    let confirmationToken = null;
    let confirmationExpiresAt = null;

    if (validatedData.confirmation_required) {
      confirmationToken = generateConfirmationToken();
      confirmationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    }

    // Criar comando no banco
    // TODO: Implementar query SQL direta
    const command = null;
    const commandError = null;
    // await pool.query(...)
    //   .from('vehicle_commands')
    //   .insert({
    //     vehicle_id: validatedData.vehicle_id,
    //     user_id: user.id,
    //     type: validatedData.type,
    //     confirmation_required: validatedData.confirmation_required,
    //     confirmation_token: confirmationToken,
    //     confirmation_expires_at: confirmationExpiresAt,
    //     metadata: validatedData.metadata,
    //     status: validatedData.confirmation_required ? 'pending_confirmation' : 'confirmed'
    //   })
    //   .select()
    //   .single();

    if (commandError) {
      console.error('Erro ao criar comando:', commandError);
      return NextResponse.json(
        { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Se não requer confirmação, enviar diretamente para o dispositivo
    if (!validatedData.confirmation_required) {
      await sendCommandToDevice(command);
    }

    // Log de auditoria
    console.log(`Comando ${command.type} criado para veículo ${vehicle.name} pelo usuário ${user.email}`);

    return NextResponse.json({
      success: true,
      data: {
        command_id: command.id,
        type: command.type,
        status: command.status,
        confirmation_required: command.confirmation_required,
        confirmation_token: confirmationToken,
        expires_at: confirmationExpiresAt,
        vehicle: {
          id: vehicle.id,
          name: vehicle.name
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Erro na API de comandos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/commands - Listar comandos do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const pool = getDbPool();
    const { searchParams } = new URL(request.url);

    // Parâmetros de consulta
    const vehicleId = searchParams.get('vehicle_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query
    // TODO: Implementar query SQL direta
    let query = null; // pool.query
    //   .from('vehicle_commands')
    //   .select(`
    //     *,
    //     vehicles:vehicle_id (id, name, plate),
    //     command_confirmations (confirmed_at, ip_address),
    //     command_responses (success, error_message, received_at)
    //   `)
    //   .eq('user_id', user.id)
    //   .order('created_at', { ascending: false })
    //   .range(offset, offset + limit - 1);

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // TODO: Implementar query SQL direta
    const commands = null;
    const error = null;
    // const { data: commands, error } = await query;

    if (error) {
      console.error('Erro ao buscar comandos:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: commands,
      pagination: {
        limit,
        offset,
        total: commands?.length || 0
      }
    });

  } catch (error) {
    console.error('Erro na API de comandos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Função auxiliar para gerar token de confirmação
 */
function generateConfirmationToken(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Função auxiliar para enviar comando ao dispositivo
 */
async function sendCommandToDevice(command: any) {
  try {
    // Aqui seria a integração com o servidor GPS
    // Por enquanto, simular o envio
    console.log(`Enviando comando ${command.type} para dispositivo do veículo ${command.vehicle_id}`);
    
    // Atualizar status para "sent_to_device"
    const pool = getDbPool();
    // TODO: Implementar query SQL direta
    // await pool.query
    //   .from('vehicle_commands')
    //   .update({ status: 'sent_to_device' })
    //   .eq('id', command.id);

    // Simular resposta do dispositivo após 2 segundos
    setTimeout(async () => {
      // TODO: Implementar query SQL direta
      // await pool.query
      //   .from('command_responses')
      //   .insert({
      //     command_id: command.id,
      //     device_response: { status: 'ok', timestamp: new Date().toISOString() },
      //     execution_time: 1500,
      //     success: true
      //   });

      // TODO: Implementar query SQL direta
      // await pool.query
      //   .from('vehicle_commands')
      //   .update({ 
      //     status: 'executed',
      //     executed_at: new Date().toISOString()
      //   })
      //   .eq('id', command.id);
    }, 2000);

  } catch (error) {
    console.error('Erro ao enviar comando para dispositivo:', error);
  }
}