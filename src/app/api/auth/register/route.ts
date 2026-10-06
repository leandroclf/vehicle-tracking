import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { configureProductHarness } from '@/lib/product-harness/configure';
import { createProductEvent, emitProductEvent } from '@/lib/product-harness/events';

configureProductHarness();

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
    };
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

    await emitProductEvent(createProductEvent('signup_completed', {
      user_id: user.id,
      account_id: user.id,
      outcome: 'success',
    }));

    return NextResponse.json({
      message: 'Registro realizado com sucesso',
      token,
      user,
    });
  } catch (error) {
    console.error('Erro durante o registro:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: message || 'Erro interno do servidor' },
      { status: message.includes('já existe') ? 409 : 500 }
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