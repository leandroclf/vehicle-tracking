import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';

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
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: message || 'Erro interno do servidor' },
      { status: message === 'Token inválido' || message === 'Token expirado' ? 401 : 500 }
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
    const body = (await request.json()) as { name?: string; phone?: string };
    const { name, phone } = body;

    // Atualizar perfil (apenas campos persistidos no schema: name e phone)
    await AuthService.updateProfile(user.id, { name, phone });

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      profile: {
        name: name ?? user.name,
        phone,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: message || 'Erro interno do servidor' },
      { status: message === 'Token inválido' || message === 'Token expirado' ? 401 : 500 }
    );
  }
}
