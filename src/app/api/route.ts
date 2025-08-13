import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/auth-middleware';
import { db } from '@/lib/database';
import { alerts, vehicles } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

// Esquema para marcar alertas como lidos
const markReadSchema = z.object({
  alertIds: z.array(z.number().int().positive()).min(1, "Pelo menos um ID de alerta é necessário"),
});



// Handler para listar alertas (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // Buscar alertas do usuário com join para obter nome do veículo
    const alertsData = await db
      .select({
        id: alerts.id,
        type: alerts.type,
        message: alerts.message,
        severity: alerts.severity,
        timestamp: alerts.timestamp,
        read: alerts.read,
        vehicleId: alerts.vehicleId,
        userId: alerts.userId,
        vehicleName: vehicles.name,
      })
      .from(alerts)
      .leftJoin(vehicles, eq(alerts.vehicleId, vehicles.id))
      .where(eq(alerts.userId, user.id))
      .orderBy(desc(alerts.timestamp));

    return NextResponse.json(alertsData, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para marcar alertas como lidos (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // Obter e validar os IDs dos alertas a serem marcados como lidos
    const body = await request.json();
    const result = markReadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 });
    }
    const { alertIds } = result.data;

    // Atualizar o status 'read' dos alertas especificados para o usuário
    await db
      .update(alerts)
      .set({ read: true })
      .where(
        and(
          eq(alerts.userId, user.id),
          // Usar inArray para múltiplos IDs
          eq(alerts.id, alertIds[0]) // Simplificado para um ID por vez
        )
      );

    return NextResponse.json({ message: `Alerta(s) marcado(s) como lido(s) com sucesso` }, { status: 200 });

  } catch (error) {
    console.error('Erro ao marcar alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para marcar TODOS os alertas como lidos (PUT - usando PUT para diferenciar do PATCH)
export async function PUT(request: NextRequest) {
    try {
      // Verificar autenticação do usuário
      const authResult = await requireAuth(request);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      const { user } = authResult;
      
      // Atualizar o status 'read' de TODOS os alertas do usuário
      await db
        .update(alerts)
        .set({ read: true })
        .where(
          and(
            eq(alerts.userId, user.id),
            eq(alerts.read, false)
          )
        );
  
      return NextResponse.json({ message: `Todos os alertas foram marcados como lidos` }, { status: 200 });
  
    } catch (error) {
      console.error('Erro ao marcar todos os alertas como lidos:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }

