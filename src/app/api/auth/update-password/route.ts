import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { verifyAuth } from '@/lib/auth/verify-auth';
import { supabase } from '@/lib/supabase';

interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function updatePasswordHandler(req: NextRequest): Promise<NextResponse> {
  try {
    // Verifica autenticação
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: 401 }
      );
    }

    // Valida o corpo da requisição
    const body = await req.json() as UpdatePasswordRequest;

    if (!body.currentPassword || !body.newPassword) {
      throw new ValidationError('Senha atual e nova senha são obrigatórias');
    }

    if (body.currentPassword.length < 8 || body.newPassword.length < 8) {
      throw new ValidationError('As senhas devem ter no mínimo 8 caracteres');
    }

    // Atualiza a senha no Supabase
    const { error } = await supabase.auth.updateUser({
      password: body.newPassword
    });

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Senha atualizada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro no handler de atualização de senha:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

export const POST = createRouteHandler(['POST'], updatePasswordHandler); 