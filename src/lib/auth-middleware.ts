import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

interface AuthResult {
  user: { id: string; email: string; name: string } | null;
  error?: string;
  status?: number;
}

/**
 * Verifies the JWT token from the Authorization header.
 * @param request - The NextRequest object.
 * @returns An object containing the user payload if authenticated, or an error message.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Token de autorização ausente ou mal formatado', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return { user: null, error: 'Token não fornecido', status: 401 };
  }

  // TODO: Migrado do Supabase para PostgreSQL direto
  // TODO: Implementar verificação JWT e query SQL direta
  try {
    // Verificar e decodificar o JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded || !decoded.userId) {
      return { user: null, error: 'Token inválido', status: 401 };
    }
    
    // Buscar dados do usuário no banco
    const pool = getDbPool();
    const userQuery = `
      SELECT id, email, name
      FROM users
      WHERE id = $1 AND active = true
    `;
    const userResult = await pool.query(userQuery, [decoded.userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      return { user: null, error: 'Usuário não encontrado ou inativo', status: 401 };
    }
    
    // Token válido, retorna dados do usuário
    return {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name || '',
      },
    };
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return { user: null, error: 'Token inválido ou expirado', status: 401 };
  }
}

/**
 * Middleware function to protect API routes.
 * Can be used directly in route handlers or adapted for Next.js middleware.
 * @param handler - The route handler function to wrap.
 * @returns A new handler function with authentication check.
 */
export function withAuth(handler: (request: NextRequest, context: any, user: { id: string; email: string; name: string }) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const authResult = await verifyAuth(request);

    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Call the original handler with the user object
    return handler(request, context, authResult.user);
  };
}

