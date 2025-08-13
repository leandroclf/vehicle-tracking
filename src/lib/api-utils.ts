import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from './auth/auth-middleware';
import { db } from './database';
import { ZodSchema } from 'zod';
import { SQL, eq, and, gt, lt, gte, lte, ne, like, inArray } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

// Tipo para handlers de API
export type ApiHandler = (
  req: NextRequest, 
  params: { user: { id: string; email: string; name: string } }
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
      
      // Executar o handler com os parâmetros
      return await handler(req, { 
        user: authResult.user
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

// Verificar se uma tabela existe (usando PostgreSQL)
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      )`
    );
    return result.rows[0]?.exists === true;
  } catch (error) {
    return false;
  }
}

// Construir consulta paginada com Drizzle ORM
export function buildPaginatedQuery<T extends PgTable>(
  table: T,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: any;
    ascending?: boolean;
    filter?: Record<string, any>;
    select?: any;
  }
) {
  const {
    limit = 50,
    offset = 0,
    orderBy,
    ascending = false,
    filter = {},
    select
  } = options;

  // Construir condições WHERE
  const whereConditions: SQL[] = [];
  
  // Adicionar filtro de usuário se a tabela tiver userId
  if ('userId' in table) {
    whereConditions.push(eq(table.userId, userId));
  }

  // Aplicar filtros adicionais
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key in table) {
      const column = table[key as keyof typeof table];
      
      if (Array.isArray(value)) {
        whereConditions.push(inArray(column, value));
      } else if (typeof value === 'object') {
        // Suporte para operadores como gt, lt, etc.
        Object.entries(value).forEach(([op, val]) => {
          if (op === 'gt') whereConditions.push(gt(column, val));
          else if (op === 'lt') whereConditions.push(lt(column, val));
          else if (op === 'gte') whereConditions.push(gte(column, val));
          else if (op === 'lte') whereConditions.push(lte(column, val));
          else if (op === 'neq') whereConditions.push(ne(column, val));
          else if (op === 'like') whereConditions.push(like(column, `%${val}%`));
        });
      } else {
        whereConditions.push(eq(column, value));
      }
    }
  });

  // Construir query base
  let query = select ? db.select(select).from(table) : db.select().from(table);
  
  // Aplicar condições WHERE
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }
  
  // Aplicar ordenação
  if (orderBy) {
    query = ascending ? query.orderBy(orderBy) : query.orderBy(orderBy);
  }
  
  // Aplicar paginação
  query = query.limit(limit).offset(offset);

  return query;
}

// Função auxiliar para criar resposta paginada
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
) {
  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      hasNext: offset + limit < total,
      hasPrev: offset > 0
    }
  };
}