import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service-mock';

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

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token inválido' ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const { name, phone, avatar_url } = body;

    // Atualizar perfil
    const updatedUser = await AuthService.updateProfile(user.id, {
      name,
      phone,
      avatar_url,
    });

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      ...updatedUser,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Token inválido' ? 401 : 500 }
    );
  }
}