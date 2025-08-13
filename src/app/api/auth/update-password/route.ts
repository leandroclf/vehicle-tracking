import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-middleware';
// Usando auth-service mock temporariamente até resolver problema do PostgreSQL
import { AuthService } from '@/lib/auth/auth-service-mock';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    // Verificar senha atual
    try {
      await AuthService.signIn(user.email, currentPassword);
    } catch (error) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      );
    }

    // Atualizar senha
    await AuthService.updatePassword(user.email, newPassword);

    return NextResponse.json({
      message: 'Senha atualizada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}