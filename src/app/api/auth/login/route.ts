import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const { user, token } = await AuthService.signIn(email, password);

    return NextResponse.json({
      user,
      token,
      message: 'Login realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no login:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: message || 'Erro interno do servidor' },
      { status: message === 'Credenciais inválidas' ? 401 : 500 }
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
