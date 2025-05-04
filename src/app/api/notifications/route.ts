import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabaseClient';
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
    
    // Construir consulta base
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtro de status de leitura se não for 'all'
    if (read !== 'all') {
      query = query.eq('read', read === 'read');
    }
    
    // Executar consulta
    const { data: notifications, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar notificações:', error);
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
    const { data: userNotifications, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .in('id', ids);
    
    if (checkError) {
      console.error('Erro ao verificar notificações:', checkError);
      return NextResponse.json({ 
        error: 'Erro ao verificar notificações' 
      }, { status: 500 });
    }
    
    const validIds = userNotifications?.map(notification => notification.id) || [];
    
    if (validIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma notificação encontrada para atualizar',
        count: 0
      });
    }
    
    // Atualizar o status das notificações para 'lidas'
    const { error, count } = await supabase
      .from('notifications')
      .update({ 
        read: true 
      })
      .eq('user_id', userId)
      .in('id', validIds);
    
    if (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
      return NextResponse.json({ 
        error: 'Erro ao marcar notificações como lidas' 
      }, { status: 500 });
    }
    
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