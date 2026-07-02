import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
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

// Handler para listar notificações (GET)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const user = await AuthService.verifyToken(token);
    const userId = user.id;
    
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
    
    // Mock notifications data
    const mockNotifications = [
      {
        id: '1',
        user_id: userId,
        title: 'Veículo fora da geocerca',
        message: 'O veículo ABC-1234 saiu da área permitida',
        type: 'warning',
        read: false,
        created_at: new Date().toISOString(),
        link: '/dashboard/alerts'
      },
      {
        id: '2',
        user_id: userId,
        title: 'Manutenção programada',
        message: 'Veículo XYZ-5678 precisa de manutenção em 3 dias',
        type: 'info',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        link: '/dashboard/maintenance'
      }
    ];
    
    // Apply filters
    let filteredNotifications = mockNotifications;
    if (read === 'read') {
      filteredNotifications = mockNotifications.filter(n => n.read);
    } else if (read === 'unread') {
      filteredNotifications = mockNotifications.filter(n => !n.read);
    }
    
    // Apply pagination
    const notifications = filteredNotifications.slice(offset, offset + limit);
    const count = filteredNotifications.length;
    
    // Format the results
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      created_at: notification.created_at,
      link: notification.link
    }));
    
    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao processar requisição de notificações:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor' 
    }, { status: error.message === 'Token inválido' ? 401 : 500 });
  }
}

// Handler para marcar notificações como lidas (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const user = await AuthService.verifyToken(token);
    const userId = user.id;
    
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
    
    // Mock update - just return success
    const count = ids.length;
    
    return NextResponse.json({ 
      success: true,
      message: `${count || 0} notificação(ões) marcada(s) como lida(s)`,
      count: count || 0
    });
    
  } catch (error: any) {
    console.error('Erro ao processar marcação de notificações:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor' 
    }, { status: error.message === 'Token inválido' ? 401 : 500 });
  }
}