import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

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

  const decoded = verifyToken(token);

  if (!decoded) {
    return { user: null, error: 'Token inválido ou expirado', status: 401 };
  }

  // Token is valid, return user payload
  return {
    user: {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    },
  };
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

