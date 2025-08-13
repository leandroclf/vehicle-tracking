import { NextRequest, NextResponse } from 'next/server';
// Usando auth-service mock temporariamente até resolver problema do PostgreSQL
import { AuthService } from '@/lib/auth/auth-service-mock';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const { user, token } = await AuthService.signUp(email, password, name);

    // Atualizar telefone se fornecido
    if (phone) {
      await AuthService.updateProfile(user.id, { phone });
    }

    return NextResponse.json({
      message: 'Registro realizado com sucesso',
      token,
      user,
    });
  } catch (error: any) {
    console.error('Erro durante o registro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message.includes('já existe') ? 409 : 500 }
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