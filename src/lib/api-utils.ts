import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from './auth/auth-middleware';
import type { AuthUser } from './auth/auth-service';
import { ZodType, ZodTypeDef } from 'zod';

// Tipo para handlers de API
export type ApiHandler = (
  req: NextRequest,
  params: { user: AuthUser }
) => Promise<NextResponse>;

// Tipo para resposta de erro
export interface ApiError {
  error: string;
  details?: unknown;
  status: number;
}

// Wrapper para handlers de API com autenticação e tratamento de erros
export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest) => {
    try {
      // Verificar autenticação do usuário
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!authResult.user) {
        return NextResponse.json(
          { error: 'Token de autenticação necessário' },
          { status: 401 }
        );
      }

      // Executar o handler com os parâmetros
      return await handler(req, { user: authResult.user });
    } catch (error) {
      console.error('Erro na API:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

// Validar corpo da requisição usando Zod
export async function validateBody<T>(req: NextRequest, schema: ZodType<T, ZodTypeDef, unknown>): Promise<{ data?: T; error?: ApiError }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        error: {
          error: 'Dados inválidos',
          details: result.error.format(),
          status: 400
        }
      };
    }

    return { data: result.data };
  } catch (error) {
    return {
      error: {
        error: 'Erro ao processar o corpo da requisição',
        status: 400
      }
    };
  }
}

// Validar parâmetros de consulta usando Zod
export function validateQuery<T>(req: NextRequest, schema: ZodType<T, ZodTypeDef, unknown>): { data?: T; error?: ApiError } {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const result = schema.safeParse(queryParams);

    if (!result.success) {
      return {
        error: {
          error: 'Parâmetros de consulta inválidos',
          details: result.error.format(),
          status: 400
        }
      };
    }

    return { data: result.data };
  } catch (error) {
    return {
      error: {
        error: 'Erro ao processar os parâmetros de consulta',
        status: 400
      }
    };
  }
}

// Responder com erro de API
export function respondWithError(error: ApiError): NextResponse {
  return NextResponse.json(
    { error: error.error, details: error.details },
    { status: error.status }
  );
}
