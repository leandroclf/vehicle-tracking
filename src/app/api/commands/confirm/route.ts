import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { commands, vehicles } from '@/lib/schema';
import { verifyAuth } from '@/lib/auth-middleware';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validação para confirmação
const confirmCommandSchema = z.object({
  command_id: z.coerce.number().int().positive('ID do comando inválido'),
  confirmation_token: z.string().min(1, 'Token de confirmação é obrigatório')
});

interface CommandParameters {
  confirmation_required?: boolean;
  confirmation_token?: string | null;
  confirmation_expires_at?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * POST /api/commands/confirm - Confirmar comando remoto
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Validar dados de entrada
    const body = await request.json();
    const validatedData = confirmCommandSchema.parse(body);

    // Buscar comando com o veículo associado, escopado ao usuário autenticado
    const [row] = await db
      .select({
        command: commands,
        vehicle: {
          id: vehicles.id,
          name: vehicles.name,
          plate: vehicles.plate,
        },
      })
      .from(commands)
      .innerJoin(vehicles, eq(commands.vehicleId, vehicles.id))
      .where(
        and(
          eq(commands.id, validatedData.command_id),
          eq(commands.userId, user.id)
        )
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: 'Comando não encontrado', code: 'COMMAND_NOT_FOUND' },
        { status: 404 }
      );
    }

    const { command, vehicle } = row;
    const parameters = (command.parameters ?? {}) as CommandParameters;

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
    if (
      parameters.confirmation_expires_at &&
      new Date(parameters.confirmation_expires_at) < new Date()
    ) {
      await db
        .update(commands)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(commands.id, command.id));

      return NextResponse.json(
        { error: 'Comando expirado', code: 'COMMAND_EXPIRED' },
        { status: 400 }
      );
    }

    // Verificar token de confirmação
    if (parameters.confirmation_token !== validatedData.confirmation_token) {
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

    // Confirmar e marcar como enviado ao dispositivo, registrando auditoria em parameters
    const confirmedAt = new Date();
    await db
      .update(commands)
      .set({
        status: 'sent_to_device',
        sentAt: confirmedAt,
        updatedAt: confirmedAt,
        parameters: {
          ...parameters,
          confirmation: {
            confirmed_by: user.id,
            confirmed_at: confirmedAt.toISOString(),
            ip_address: clientIP,
            user_agent: userAgent,
          },
        },
      })
      .where(eq(commands.id, command.id));

    // Log de auditoria
    console.log(`Comando ${command.type} confirmado para veículo ${vehicle.name} pelo usuário ${user.email} (IP: ${clientIP})`);

    return NextResponse.json({
      success: true,
      message: 'Comando confirmado e enviado para o dispositivo',
      data: {
        command_id: String(command.id),
        type: command.type,
        status: 'sent_to_device',
        vehicle: {
          id: String(vehicle.id),
          name: vehicle.name,
          plate: vehicle.plate
        },
        confirmed_at: confirmedAt.toISOString()
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
