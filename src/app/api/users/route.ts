import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service-mock';
import { UsersService } from '@/lib/services/users-service-mock';

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    // Extrair token de autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação necessário' }, { status: 401 });
    }
    
    // Verificar token e obter usuário
    const user = await AuthService.verifyToken(token);

    // Verificar se é administrador
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }

    // Paginação e busca
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    // Buscar usuários usando serviço mock
    const result = await UsersService.getUsers({
      limit,
      offset,
      search,
      role: roleFilter
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}