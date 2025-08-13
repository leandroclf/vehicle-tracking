import { NextRequest } from 'next/server';
import { getDbPool } from '@/lib/database';
import type { User } from '@/types/auth';

/**
 * Verifica se o usuário está autenticado através do token JWT
 * @param request Request do Next.js
 * @returns Dados do usuário autenticado ou null
 */
export async function verifyAuth(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // TODO: Migrado do Supabase para PostgreSQL direto
    // TODO: Implementar autenticação JWT
    const pool = getDbPool();
    
    // TODO: Implementar verificação de token JWT
    // Por enquanto, retorna null até implementar JWT
    return null;
    
    // TODO: Implementar query SQL direta para buscar usuário
    // const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    // const profileResult = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);

    return {
      id: user.id,
      email: user.email || '',
      name: profile?.name || user.user_metadata?.name || '',
      phone: profile?.phone || user.user_metadata?.phone || '',
      password: '', // Nunca retornar senha
      role: profile?.role || 'user',
    };
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem permissão de administrador
 * @param request Request do Next.js
 * @returns Boolean indicando se é admin
 */
export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const user = await verifyAuth(request);
  return user?.role === 'admin' || user?.role === 'administrator';
}

/**
 * Middleware para verificar autenticação em rotas da API
 * @param request Request do Next.js
 * @returns Response de erro ou null se autenticado
 */
export async function requireAuth(request: NextRequest) {
  const user = await verifyAuth(request);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Token de autenticação inválido ou expirado' }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  return null; // Autenticado
}

/**
 * Middleware para verificar autenticação de admin em rotas da API
 * @param request Request do Next.js
 * @returns Response de erro ou null se autenticado como admin
 */
export async function requireAdminAuth(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request);
  
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Acesso negado. Permissões de administrador necessárias.' }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  return null; // Autenticado como admin
}