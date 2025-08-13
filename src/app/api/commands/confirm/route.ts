import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

// Schema de validação para confirmação
const confirmCommandSchema = z.object({
  command_id: z.string().uuid('ID do comando deve ser um UUID válido'),
  confirmation_token: z.string().min(1, 'Token de confirmação é obrigatório')
});

/**
 * POST /api/commands/confirm - Confirmar comando remoto
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
    const validatedData = confirmCommandSchema.parse(body);

    // Buscar comando
    // TODO: Implementar query SQL direta
    const command = null;
    const commandError = null;
    // await pool.query(...)
    // .from('vehicle_commands')
    // .select(`
    //   *,
    //   vehicles:vehicle_id (id, name, plate)
    // `)
    // .eq('id', validatedData.command_id)
    // .eq('user_id', user.id)
    // .single();

    if (commandError || !command) {
      return NextResponse.json(
        { error: 'Comando não encontrado', code: 'COMMAND_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verificar se comando ainda está pendente
    if (command.status !== 'pending_confirmation') {
      return NextResponse.json(
        { 
          error: 'Comando não está pendente de confirmação', 
          code: 'INVALID_STATUS',
          current_status: command.status
        },
        { status: 400 }
      );
    }

    // Verificar se não expirou
    if (command.confirmation_expires_at && new Date(command.confirmation_expires_at) < new Date()) {
      // Marcar como expirado
      // TODO: Implementar query SQL direta
      // await pool.query
      //   .from('vehicle_commands')
      //   .update({ status: 'expired' })
      //   .eq('id', command.id);

      return NextResponse.json(
        { error: 'Comando expirado', code: 'COMMAND_EXPIRED' },
        { status: 400 }
      );
    }

    // Verificar token de confirmação
    if (command.confirmation_token !== validatedData.confirmation_token) {
      return NextResponse.json(
        { error: 'Token de confirmação inválido', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    // Obter informações da requisição para auditoria
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Registrar confirmação
    // TODO: Implementar query SQL direta
    const confirmationError = null;
    // const { error: confirmationError } = await pool.query
    //   .from('command_confirmations')
    //   .insert({
    //     command_id: command.id,
    //     confirmation_token: validatedData.confirmation_token,
    //     confirmed_by: user.id,
    //     ip_address: clientIP,
    //     user_agent: userAgent
    //   });

    if (confirmationError) {
      console.error('Erro ao registrar confirmação:', confirmationError);
      return NextResponse.json(
        { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Atualizar status do comando
    // TODO: Implementar query SQL direta
    const updateError = null;
    // const { error: updateError } = await pool.query
    //   .from('vehicle_commands')
    //   .update({ status: 'confirmed' })
    //   .eq('id', command.id);

    if (updateError) {
      console.error('Erro ao atualizar comando:', updateError);
      return NextResponse.json(
        { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Enviar comando para o dispositivo
    await sendCommandToDevice(command);

    // Log de auditoria
    console.log(`Comando ${command.type} confirmado para veículo ${command.vehicles.name} pelo usuário ${user.email} (IP: ${clientIP})`);

    return NextResponse.json({
      success: true,
      message: 'Comando confirmado e enviado para o dispositivo',
      data: {
        command_id: command.id,
        type: command.type,
        status: 'confirmed',
        vehicle: {
          id: command.vehicles.id,
          name: command.vehicles.name,
          plate: command.vehicles.plate
        },
        confirmed_at: new Date().toISOString()
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

    console.error('Erro na confirmação de comando:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Função auxiliar para enviar comando ao dispositivo
 */
async function sendCommandToDevice(command: any) {
  try {
    const pool = getDbPool();
    
    // Atualizar status para "sent_to_device"
    // TODO: Implementar query SQL direta
    // await pool.query
    //   .from('vehicle_commands')
    //   .update({ status: 'sent_to_device' })
    //   .eq('id', command.id);

    console.log(`Enviando comando ${command.type} para dispositivo do veículo ${command.vehicle_id}`);
    
    // Aqui seria a integração real com o servidor GPS
    // Por enquanto, simular o envio e resposta
    
    // Simular tempo de processamento
    setTimeout(async () => {
      try {
        // Simular resposta do dispositivo
        const deviceResponse = {
          status: 'success',
          command: command.type,
          timestamp: new Date().toISOString(),
          device_id: `device_${command.vehicle_id}`
        };

        // Registrar resposta do dispositivo
        // TODO: Implementar query SQL direta
        // await pool.query
        //   .from('command_responses')
        //   .insert({
        //     command_id: command.id,
        //     device_response: deviceResponse,
        //     execution_time: Math.floor(Math.random() * 3000) + 1000, // 1-4 segundos
        //     success: true
        //   });

        // Atualizar comando como executado
        // TODO: Implementar query SQL direta
        // await pool.query
        //   .from('vehicle_commands')
        //   .update({ 
        //     status: 'executed',
        //     executed_at: new Date().toISOString(),
        //     response_data: deviceResponse
        //   })
        //   .eq('id', command.id);

        console.log(`Comando ${command.type} executado com sucesso no veículo ${command.vehicle_id}`);

      } catch (error) {
        console.error('Erro ao processar resposta do dispositivo:', error);
        
        // Marcar comando como falhou
        // TODO: Implementar query SQL direta
        // await pool.query
        //   .from('vehicle_commands')
        //   .update({ status: 'failed' })
        //   .eq('id', command.id);

        // TODO: Implementar query SQL direta
        // await pool.query
        //   .from('command_responses')
        //   .insert({
        //     command_id: command.id,
        //     device_response: { error: 'Device communication failed' },
        //     execution_time: 0,
        //     success: false,
        //     error_message: 'Falha na comunicação com o dispositivo'
        //   });
      }
    }, 2000); // Simular 2 segundos de processamento

  } catch (error) {
    console.error('Erro ao enviar comando para dispositivo:', error);
    
    // Marcar comando como falhou
    const pool = getDbPool();
    // TODO: Implementar query SQL direta
    // await pool.query
    //   .from('vehicle_commands')
    //   .update({ status: 'failed' })
    //   .eq('id', command.id);
  }
}