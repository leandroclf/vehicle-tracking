import { NextRequest, NextResponse } from 'next/server';
// Usando auth-service mock temporariamente até resolver problema do PostgreSQL
import { AuthService, AuthUser } from './auth-service-mock';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: { required?: boolean } = { required: true }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader || '');

      if (!token) {
        if (options.required) {
          return NextResponse.json(
            { error: 'Token de autenticação necessário' },
            { status: 401 }
          );
        }
        return handler(req as AuthenticatedRequest);
      }

      try {
        const user = await AuthService.verifyToken(token);
        (req as AuthenticatedRequest).user = user;
        return handler(req as AuthenticatedRequest);
      } catch (error) {
        if (options.required) {
          return NextResponse.json(
            { error: 'Token inválido ou expirado' },
            { status: 401 }
          );
        }
        return handler(req as AuthenticatedRequest);
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

export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { required: true });
}

export function optionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { required: false });
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