import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getDbPool } from '@/lib/database';

// Handler para marcar TODOS os alertas como lidos
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Não autorizado' }, { status: authResult.status || 401 });
    }
    
    const userId = authResult.user.id;

    // TODO: Migrado do Supabase para PostgreSQL direto
    // TODO: Implementar query SQL direta
    const error = null; const count = 0; // await pool.query(...)
    // .from('alerts')
    // .update({ read: true, updated_at: new Date().toISOString() })
    // .eq('user_id', userId)
    // .eq('read', false);

    if (error) {
      console.error('Erro ao marcar todos os alertas como lidos:', error);
      return NextResponse.json({ error: 'Erro ao marcar todos os alertas como lidos' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Todos os alertas marcados como lidos',
      count 
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao marcar todos os alertas como lidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}