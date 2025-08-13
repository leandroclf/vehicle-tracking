import { NextRequest, NextResponse } from 'next/server';
import { AuthService, AuthUser } from '@/lib/auth/auth-service-mock';

interface AuthResult {
  user: { id: string; email: string; name: string } | null;
  error?: string;
  status?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
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

  try {
    // Usar AuthService mock temporariamente
    const user = await AuthService.verifyToken(token);
    
    // Token válido, retorna dados do usuário no formato esperado
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

// Re-exportar funcões do auth-middleware para compatibilidade
export async function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader || '');

      if (!token) {
        return NextResponse.json(
          { error: 'Token de autenticação necessário' },
          { status: 401 }
        );
      }

      try {
        const user = await AuthService.verifyToken(token);
        (req as AuthenticatedRequest).user = user;
        return handler(req as AuthenticatedRequest);
      } catch (error) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

export function optionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader || '');

      if (token) {
        try {
          const user = await AuthService.verifyToken(token);
          (req as AuthenticatedRequest).user = user;
        } catch (error) {
          // Não falha em auth opcional - apenas segue sem user
        }
      }
      
      return handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Erro no middleware de autenticação opcional:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

// Função utilitária para extrair usuário da requisição
export function getAuthUser(req: AuthenticatedRequest): AuthUser {
  if (!req.user) {
    throw new Error('Usuário não autenticado');
  }
  return req.user;
}

// Função para verificar se o usuário tem acesso a um recurso
export function checkResourceAccess(req: AuthenticatedRequest, resourceUserId: string): boolean {
  const user = getAuthUser(req);
  return user.id === resourceUserId;
}

// Middleware para verificar acesso a recursos específicos
export function withResourceAccess(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  getResourceUserId: (req: AuthenticatedRequest) => Promise<string | null>
) {
  return requireAuth(async (req: AuthenticatedRequest) => {
    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId) {
        return NextResponse.json(
          { error: 'Recurso não encontrado' },
          { status: 404 }
        );
      }

      if (!checkResourceAccess(req, resourceUserId)) {
        return NextResponse.json(
          { error: 'Acesso negado a este recurso' },
          { status: 403 }
        );
      }

      return handler(req);
    } catch (error) {
      console.error('Erro na verificação de acesso ao recurso:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  });
}

