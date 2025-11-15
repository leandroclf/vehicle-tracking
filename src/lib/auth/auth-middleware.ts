import { NextRequest, NextResponse } from 'next/server';
// Usando auth-service mock temporariamente até resolver problema do PostgreSQL
import { AuthService, AuthUser } from './auth-service-mock';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

type AuthHandler = (req: AuthenticatedRequest) => Promise<NextResponse>;

async function authenticateRequest(
  req: NextRequest,
  { required }: { required: boolean }
): Promise<AuthenticatedRequest | NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      if (required) {
        return NextResponse.json(
          { error: 'Token de autenticação necessário' },
          { status: 401 }
        );
      }
      return req as AuthenticatedRequest;
    }

    try {
      const user = await AuthService.verifyToken(token);
      (req as AuthenticatedRequest).user = user;
      return req as AuthenticatedRequest;
    } catch (error) {
      if (required) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 401 }
        );
      }
      return req as AuthenticatedRequest;
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function withAuth(
  handler: AuthHandler,
  options: { required?: boolean } = { required: true }
) {
  const required = options.required ?? true;
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateRequest(req, { required });
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    return handler(authResult);
  };
}

export function requireAuth(handler: AuthHandler): (req: NextRequest) => Promise<NextResponse>;
export function requireAuth(req: NextRequest): Promise<AuthenticatedRequest | NextResponse>;
export function requireAuth(
  handlerOrRequest: AuthHandler | NextRequest
): ((req: NextRequest) => Promise<NextResponse>) | Promise<AuthenticatedRequest | NextResponse> {
  if (typeof handlerOrRequest === 'function') {
    return withAuth(handlerOrRequest, { required: true });
  }
  return authenticateRequest(handlerOrRequest, { required: true });
}

export function optionalAuth(handler: AuthHandler): (req: NextRequest) => Promise<NextResponse>;
export function optionalAuth(req: NextRequest): Promise<AuthenticatedRequest | NextResponse>;
export function optionalAuth(
  handlerOrRequest: AuthHandler | NextRequest
): ((req: NextRequest) => Promise<NextResponse>) | Promise<AuthenticatedRequest | NextResponse> {
  if (typeof handlerOrRequest === 'function') {
    return withAuth(handlerOrRequest, { required: false });
  }
  return authenticateRequest(handlerOrRequest, { required: false });
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
  handler: AuthHandler,
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