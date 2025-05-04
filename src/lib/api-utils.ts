import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verifyAuth } from './auth-middleware';
import { ZodSchema } from 'zod';

// Tipo para handlers de API
export type ApiHandler = (
  req: NextRequest, 
  params: { user: { id: string; email: string; name: string }, supabase: SupabaseClient }
) => Promise<NextResponse>;

// Tipo para resposta de erro
export interface ApiError {
  error: string;
  details?: unknown;
  status: number;
}

// Cria cliente Supabase com configurações adequadas
export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Credenciais do Supabase não encontradas');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Wrapper para handlers de API com autenticação e tratamento de erros
export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest) => {
    try {
      // Verificar autenticação do usuário
      const authResult = await verifyAuth(req);
      if (!authResult.user) {
        return NextResponse.json(
          { error: authResult.error || 'Não autorizado' }, 
          { status: authResult.status || 401 }
        );
      }

      // Criar cliente Supabase
      const supabase = getSupabaseClient();
      
      // Executar o handler com os parâmetros
      return await handler(req, { 
        user: authResult.user,
        supabase
      });
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
export async function validateBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<{ data?: T; error?: ApiError }> {
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
export function validateQuery<T>(req: NextRequest, schema: ZodSchema<T>): { data?: T; error?: ApiError } {
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

// Verificar se uma tabela existe
export async function tableExists(supabase: SupabaseClient, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

// Construir consulta paginada
export function buildPaginatedQuery(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
    filter?: Record<string, any>;
    select?: string;
  }
) {
  const {
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    ascending = false,
    filter = {},
    select = '*'
  } = options;

  let query = supabase
    .from(table)
    .select(select)
    .eq('user_id', userId)
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  // Aplicar filtros adicionais
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object') {
        // Suporte para operadores como gt, lt, etc.
        Object.entries(value).forEach(([op, val]) => {
          if (op === 'gt') query = query.gt(key, val);
          else if (op === 'lt') query = query.lt(key, val);
          else if (op === 'gte') query = query.gte(key, val);
          else if (op === 'lte') query = query.lte(key, val);
          else if (op === 'neq') query = query.neq(key, val);
          else if (op === 'like') query = query.like(key, `%${val}%`);
        });
      } else {
        query = query.eq(key, value);
      }
    }
  });

  return query;
} 