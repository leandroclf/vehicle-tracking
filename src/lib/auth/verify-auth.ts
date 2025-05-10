import { NextRequest } from 'next/server';
import { verifyToken } from './jwt-utils';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  role?: string;
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return {
        authenticated: false,
        error: 'Token não fornecido'
      };
    }

    const decoded = await verifyToken(token);
    
    return {
      authenticated: true,
      userId: decoded.sub,
      role: decoded.role
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Erro de autenticação'
    };
  }
} 