import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getDbPool } from '@/lib/database';
import { z } from 'zod';

// Esquema para validar parâmetros de consulta
const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  read: z.enum(['read', 'unread', 'all']).optional().default('all'),
  sort: z.enum(['asc', 'desc']).optional().default('desc')
});

// Esquema para marcar notificações como lidas
const markReadSchema = z.object({
  ids: z.array(z.string()).min(1, "Pelo menos um ID de notificação é necessário")
});

// Interface para notificações
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string;
  data?: any;
}

// Handler para listar notificações (GET)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
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
    
    const { limit, offset, read, sort } = queryResult.data;
    
    // Construir consulta SQL
    const pool = getDbPool();
    let whereClause = 'WHERE user_id = $1';
    let params = [userId];
    
    // Aplicar filtro de status de leitura se não for 'all'
    if (read !== 'all') {
      whereClause += ' AND read = $2';
      params.push(read === 'read');
    }
    
    const orderClause = `ORDER BY created_at ${sort === 'asc' ? 'ASC' : 'DESC'}`;
    const limitClause = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const query = `
      SELECT * FROM notifications 
      ${whereClause} 
      ${orderClause} 
      ${limitClause}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM notifications 
      ${whereClause}
    `;
    
    // Executar consultas
    const [notificationsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)) // Remove limit e offset para count
    ]);
    
    const notifications = notificationsResult.rows;
    const count = parseInt(countResult.rows[0]?.total || '0');
    
    if (!notifications) {
      console.error('Erro ao buscar notificações');
      return NextResponse.json({ 
        error: 'Erro ao buscar notificações' 
      }, { status: 500 });
    }
    
    // Formatar os resultados
    const formattedNotifications = (notifications as Notification[] | null)?.map(notification => {
      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        created_at: notification.created_at,
        link: notification.link,
        data: notification.data ? (
          typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data
        ) : undefined
      };
    }) || [];
    
    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de notificações:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Handler para marcar notificações como lidas (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Não autorizado' 
      }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;
    
    // Extrair e validar corpo da requisição
    const body = await request.json();
    const result = markReadSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { ids } = result.data;
    
    // Verificar se as notificações pertencem ao usuário
    const pool = getDbPool();
    const checkQuery = `
      SELECT id FROM notifications 
      WHERE user_id = $1 AND id = ANY($2)
    `;
    
    const checkResult = await pool.query(checkQuery, [userId, ids]);
    
    if (!checkResult) {
      console.error('Erro ao verificar notificações');
      return NextResponse.json({ 
        error: 'Erro ao verificar notificações' 
      }, { status: 500 });
    }
    
    const validIds = checkResult.rows.map(row => row.id);
    
    if (validIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma notificação encontrada para atualizar',
        count: 0
      });
    }
    
    // Atualizar o status das notificações para 'lidas'
    const updateQuery = `
      UPDATE notifications 
      SET read = true 
      WHERE user_id = $1 AND id = ANY($2)
    `;
    
    const updateResult = await pool.query(updateQuery, [userId, validIds]);
    
    if (!updateResult) {
      console.error('Erro ao marcar notificações como lidas');
      return NextResponse.json({ 
        error: 'Erro ao marcar notificações como lidas' 
      }, { status: 500 });
    }
    
    const count = updateResult.rowCount || 0;
    
    return NextResponse.json({ 
      success: true,
      message: `${count || 0} notificação(ões) marcada(s) como lida(s)`,
      count: count || 0
    });
    
  } catch (error) {
    console.error('Erro ao processar marcação de notificações:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}