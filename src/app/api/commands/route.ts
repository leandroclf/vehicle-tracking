import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { commands, vehicles } from '@/lib/schema';
import { verifyAuth } from '@/lib/auth-middleware';
import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schema de validação para criação de comando
const createCommandSchema = z.object({
  vehicle_id: z.coerce.number().int().positive('ID do veículo inválido'),
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

// Parâmetros persistidos no jsonb `parameters` da tabela `commands`
interface CommandParameters {
  confirmation_required: boolean;
  confirmation_token: string | null;
  confirmation_expires_at: string | null;
  metadata: Record<string, unknown>;
}

/**
 * POST /api/commands - Criar novo comando remoto
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
    const validatedData = createCommandSchema.parse(body);

    // Verificar se o usuário possui o veículo
    const [vehicle] = await db
      .select({ id: vehicles.id, name: vehicles.name })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, validatedData.vehicle_id),
          eq(vehicles.userId, user.id)
        )
      )
      .limit(1);

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado ou sem permissão', code: 'VEHICLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Gerar token de confirmação se necessário
    let confirmationToken: string | null = null;
    let confirmationExpiresAt: Date | null = null;

    if (validatedData.confirmation_required) {
      confirmationToken = generateConfirmationToken();
      confirmationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    }

    const parameters: CommandParameters = {
      confirmation_required: validatedData.confirmation_required,
      confirmation_token: confirmationToken,
      confirmation_expires_at: confirmationExpiresAt?.toISOString() ?? null,
      metadata: validatedData.metadata,
    };

    // Criar comando no banco
    const [command] = await db
      .insert(commands)
      .values({
        vehicleId: validatedData.vehicle_id,
        userId: user.id,
        type: validatedData.type,
        status: validatedData.confirmation_required ? 'pending_confirmation' : 'confirmed',
        parameters,
        sentAt: validatedData.confirmation_required ? null : new Date(),
      })
      .returning();

    // Se não requer confirmação, enviar diretamente para o dispositivo
    if (!validatedData.confirmation_required) {
      await sendCommandToDevice(command.id, command.type, command.vehicleId);
    }

    // Log de auditoria
    console.log(`Comando ${command.type} criado para veículo ${vehicle.name} pelo usuário ${user.email}`);

    return NextResponse.json({
      success: true,
      data: {
        command_id: String(command.id),
        type: command.type,
        status: command.status,
        confirmation_required: validatedData.confirmation_required,
        confirmation_token: confirmationToken,
        expires_at: confirmationExpiresAt,
        vehicle: {
          id: String(vehicle.id),
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
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Não autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);

    // Parâmetros de consulta
    const vehicleIdParam = searchParams.get('vehicle_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;

    const conditions = [eq(commands.userId, user.id)];

    if (vehicleIdParam) {
      const vehicleId = parseInt(vehicleIdParam, 10);
      if (Number.isNaN(vehicleId)) {
        return NextResponse.json(
          { error: 'vehicle_id inválido', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      conditions.push(eq(commands.vehicleId, vehicleId));
    }

    if (status) {
      conditions.push(eq(commands.status, status));
    }

    const [rows, [totalRow]] = await Promise.all([
      db
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
        .where(and(...conditions))
        .orderBy(desc(commands.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(commands)
        .where(and(...conditions)),
    ]);

    const data = rows.map(({ command, vehicle }) => {
      const params = (command.parameters ?? {}) as Partial<CommandParameters>;
      return {
        id: String(command.id),
        vehicle_id: String(command.vehicleId),
        user_id: command.userId,
        type: command.type,
        status: command.status,
        confirmation_required: params.confirmation_required ?? false,
        confirmation_expires_at: params.confirmation_expires_at ?? null,
        executed_at: command.executedAt,
        response_data: command.response,
        error_message: command.errorMessage,
        created_at: command.createdAt,
        updated_at: command.updatedAt,
        vehicles: {
          id: String(vehicle.id),
          name: vehicle.name,
          plate: vehicle.plate,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        limit,
        offset,
        total: totalRow?.count ?? data.length
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
 * Função auxiliar para enviar comando ao dispositivo.
 * A integração real com o servidor GPS acontece fora do baseline;
 * aqui o comando é marcado como enviado para rastreabilidade.
 */
async function sendCommandToDevice(commandId: number, type: string, vehicleId: number) {
  try {
    console.log(`Enviando comando ${type} para dispositivo do veículo ${vehicleId}`);
    await db
      .update(commands)
      .set({ status: 'sent_to_device', sentAt: new Date(), updatedAt: new Date() })
      .where(eq(commands.id, commandId));
  } catch (error) {
    console.error('Erro ao enviar comando para dispositivo:', error);
  }
}
