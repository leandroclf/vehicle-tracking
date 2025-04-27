import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-middleware';

// Esquema para marcar alertas como lidos
const markReadSchema = z.object({
  alertIds: z.array(z.number().int().positive()).min(1, "Pelo menos um ID de alerta é necessário"),
});

// Handler para listar alertas (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    const userId = authResult.user.id;

    const db = (request as any).env?.DB as D1Database;
    if (!db) {
      return NextResponse.json({ error: 'Erro de configuração do banco de dados' }, { status: 500 });
    }

    // Buscar alertas do usuário, ordenados por data decrescente
    // Incluir nome do veículo se disponível
    const { results } = await db
      .prepare(`
        SELECT 
          a.*, 
          v.name as vehicleName
        FROM alerts a
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.user_id = ?
        ORDER BY a.timestamp DESC
      `)
      .bind(userId)
      .all();

    // Converter 'read' de inteiro para booleano
    const alerts = results?.map(alert => ({
      ...alert,
      read: Boolean(alert.read)
    })) || [];

    return NextResponse.json(alerts, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para marcar alertas como lidos (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    const userId = authResult.user.id;

    const db = (request as any).env?.DB as D1Database;
    if (!db) {
      return NextResponse.json({ error: 'Erro de configuração do banco de dados' }, { status: 500 });
    }

    // Obter e validar os IDs dos alertas a serem marcados como lidos
    const body = await request.json();
    const result = markReadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 });
    }
    const { alertIds } = result.data;

    // Criar placeholders para a query IN
    const placeholders = alertIds.map(() => '?').join(',');

    // Atualizar o status 'read' dos alertas especificados para o usuário
    const info = await db
      .prepare(`UPDATE alerts SET read = 1 WHERE id IN (${placeholders}) AND user_id = ?`)
      .bind(...alertIds, userId)
      .run();

    return NextResponse.json({ message: `${info.changes || 0} alerta(s) marcado(s) como lido(s)` }, { status: 200 });

  } catch (error) {
    console.error('Erro ao marcar alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Handler para marcar TODOS os alertas como lidos (PUT - usando PUT para diferenciar do PATCH)
export async function PUT(request: NextRequest) {
    try {
      // Verificar autenticação do usuário
      const authResult = await verifyAuth(request);
      if (!authResult.user) {
        return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
      }
      const userId = authResult.user.id;
  
      const db = (request as any).env?.DB as D1Database;
      if (!db) {
        return NextResponse.json({ error: 'Erro de configuração do banco de dados' }, { status: 500 });
      }
  
      // Atualizar o status 'read' de TODOS os alertas do usuário
      const info = await db
        .prepare(`UPDATE alerts SET read = 1 WHERE user_id = ? AND read = 0`)
        .bind(userId)
        .run();
  
      return NextResponse.json({ message: `Todos os ${info.changes || 0} alerta(s) não lido(s) foram marcados como lidos` }, { status: 200 });
  
    } catch (error) {
      console.error('Erro ao marcar todos os alertas como lidos:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }

