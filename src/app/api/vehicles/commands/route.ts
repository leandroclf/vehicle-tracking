import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Esquema para validação do comando
const commandSchema = z.object({
  vehicleId: z.string().uuid(),
  type: z.enum(['block_engine', 'unblock_engine', 'siren', 'lights']),
});

// Esquema para validação de parâmetros de histórico
const historyQuerySchema = z.object({
  vehicleId: z.string().uuid(),
  limit: z.string().transform(Number).optional().default('10'),
  offset: z.string().transform(Number).optional().default('0'),
});

// Função para enviar um comando
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      );
    }
    
    // Obter e validar dados do corpo da requisição
    const body = await request.json();
    const validationResult = commandSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { vehicleId, type } = validationResult.data;
    
    // Verificar se o veículo pertence ao usuário
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('user_id', session.user.id)
      .single();
      
    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado ou sem permissão para acessá-lo' },
        { status: 404 }
      );
    }
    
    // Inserir o comando no banco de dados
    const { data: command, error: insertError } = await supabase
      .from('commands')
      .insert({
        vehicle_id: vehicleId,
        type,
        status: 'pending',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Erro ao inserir comando:', insertError);
      return NextResponse.json(
        { error: 'Erro ao processar comando' },
        { status: 500 }
      );
    }
    
    // Aqui você implementaria a lógica para enviar o comando ao dispositivo
    // Por exemplo, através de uma API de terceiros, MQTT, etc.
    
    // Para simplificar, vamos simular que o comando foi enviado com sucesso
    // Em uma implementação real, você teria uma confirmação do dispositivo
    
    // Atualizar o status do comando para "sent"
    const { error: updateError } = await supabase
      .from('commands')
      .update({
        status: 'sent',
      })
      .eq('id', command.id);
      
    if (updateError) {
      console.error('Erro ao atualizar status do comando:', updateError);
    }
    
    return NextResponse.json({ 
      message: 'Comando enviado com sucesso',
      command: {
        id: command.id,
        type: command.type,
        status: 'sent',
        vehicle_id: command.vehicle_id,
        sent_at: command.sent_at,
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de comando:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para obter histórico de comandos
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      );
    }
    
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    
    // Validar parâmetros
    const validationResult = historyQuerySchema.safeParse({
      vehicleId,
      limit,
      offset,
    });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { vehicleId: validVehicleId, limit: validLimit, offset: validOffset } = validationResult.data;
    
    // Verificar se o veículo pertence ao usuário
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', validVehicleId)
      .eq('user_id', session.user.id)
      .single();
      
    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado ou sem permissão para acessá-lo' },
        { status: 404 }
      );
    }
    
    // Buscar histórico de comandos do veículo
    const { data: commands, error: commandsError, count } = await supabase
      .from('commands')
      .select('*', { count: 'exact' })
      .eq('vehicle_id', validVehicleId)
      .order('created_at', { ascending: false })
      .range(validOffset || 0, (validOffset || 0) + (validLimit || 10) - 1);
      
    if (commandsError) {
      console.error('Erro ao buscar comandos:', commandsError);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico de comandos' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      commands,
      pagination: {
        total: count,
        limit: validLimit,
        offset: validOffset
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de histórico de comandos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 