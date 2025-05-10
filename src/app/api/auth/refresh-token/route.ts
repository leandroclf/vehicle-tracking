import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createJWT } from '@/lib/auth';
import { findUserById } from '@/lib/db/queries/users';

export async function POST(request: NextRequest) {
  try {
    // Extrair refresh token do cookie
    const refreshToken = request.cookies.get('YUKZ_REFRESH_TOKEN')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not provided' },
        { status: 401 }
      );
    }

    // Verificar refresh token
    const payload = await verifyToken(refreshToken, 'refresh');
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verificar tipo do token
    if (payload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid refresh token payload' },
        { status: 401 }
      );
    }

    // Buscar usuário
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Gerar novo token de acesso
    const newAccessToken = createJWT(
      { id: user.id, role: user.role },
      'access'
    );

    // Criar resposta com novo token
    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      token: newAccessToken
    });

    // Definir novo cookie de acesso
    response.cookies.set('YUKZ_ACCESS_TOKEN', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bloquear outros métodos
export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

function methodNotAllowed() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 