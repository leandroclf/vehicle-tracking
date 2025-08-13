import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { db } from '@/lib/database';
import { commands, vehicles } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
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
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;
    
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
    const vehicle = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.userId, user.id)
        )
      )
      .limit(1);
      
    if (vehicle.length === 0) {
      return NextResponse.json(
        { error: 'Veículo não encontrado ou sem permissão para acessá-lo' },
        { status: 404 }
      );
    }
    
    // Inserir o comando no banco de dados
    const newCommand = await db
      .insert(commands)
      .values({
        vehicleId,
        type,
        status: 'pending',
        sentAt: new Date(),
      })
      .returning();
      
    if (newCommand.length === 0) {
      console.error('Erro ao inserir comando');
      return NextResponse.json(
        { error: 'Erro ao processar comando' },
        { status: 500 }
      );
    }
    
    const command = newCommand[0];
    
    // Aqui você implementaria a lógica para enviar o comando ao dispositivo
    // Por exemplo, através de uma API de terceiros, MQTT, etc.
    
    // Para simplificar, vamos simular que o comando foi enviado com sucesso
    // Em uma implementação real, você teria uma confirmação do dispositivo
    
    // Atualizar o status do comando para "sent"
    await db
      .update(commands)
      .set({ status: 'sent' })
      .where(eq(commands.id, command.id));
    
    return NextResponse.json({ 
      message: 'Comando enviado com sucesso',
      command: {
        id: command.id,
        type: command.type,
        status: 'sent',
        vehicleId: command.vehicleId,
        sentAt: command.sentAt,
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
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;
    
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
    const vehicle = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, validVehicleId),
          eq(vehicles.userId, user.id)
        )
      )
      .limit(1);
      
    if (vehicle.length === 0) {
      return NextResponse.json(
        { error: 'Veículo não encontrado ou sem permissão para acessá-lo' },
        { status: 404 }
      );
    }
    
    // Buscar histórico de comandos do veículo
    const commandsData = await db
      .select()
      .from(commands)
      .where(eq(commands.vehicleId, validVehicleId))
      .orderBy(desc(commands.createdAt))
      .limit(validLimit)
      .offset(validOffset);
    
    // Contar total de comandos
    const totalCommands = await db
      .select({ count: commands.id })
      .from(commands)
      .where(eq(commands.vehicleId, validVehicleId));
    
    return NextResponse.json({
      commands: commandsData,
      pagination: {
        total: totalCommands.length,
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