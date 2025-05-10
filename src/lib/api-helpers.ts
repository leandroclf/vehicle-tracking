import { NextResponse } from 'next/server';

/**
 * Funções padronizadas para respostas de API
 * 
 * Estas funções garantem que todas as APIs do sistema retornem 
 * respostas em um formato consistente.
 */

// Interface para padronização de resposta de erro
export interface ErrorResponseData {
  success: false;
  error: string;
  details?: any;
  status: number;
  timestamp: string;
}

// Interface para padronização de resposta de sucesso
export interface SuccessResponseData<T = any> {
  success: true;
  message?: string;
  data: T;
  status: number;
  timestamp: string;
}

/**
 * Função para estruturar respostas de erro de forma consistente
 * 
 * @param message Mensagem de erro para exibição
 * @param details Detalhes adicionais do erro (opcional)
 * @param status Código HTTP do erro (padrão: 400)
 * @returns Resposta NextResponse padronizada para erro
 */
export function errorResponse(message: string, details?: any, status: number = 400): NextResponse {
  const responseData: ErrorResponseData = { 
    success: false,
    error: message,
    details: details || undefined,
    status,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(responseData, { status });
}

/**
 * Função para estruturar respostas de sucesso de forma consistente
 * 
 * @param data Dados a serem retornados na resposta
 * @param message Mensagem de sucesso (opcional)
 * @param status Código HTTP (padrão: 200)
 * @returns Resposta NextResponse padronizada para sucesso
 */
export function successResponse<T = any>(data: T, message?: string, status: number = 200): NextResponse {
  const responseData: SuccessResponseData<T> = { 
    success: true,
    message,
    data,
    status,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(responseData, { status });
}

/**
 * Manipulador padrão para erros globais em APIs
 * 
 * @param error Objeto do erro capturado
 * @returns Resposta NextResponse padronizada para erro interno
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return errorResponse(error.message, undefined, 500);
  }
  
  return errorResponse('Erro interno do servidor', undefined, 500);
}

/**
 * Função de validação para IDs de recursos
 * 
 * @param id ID do recurso a ser validado
 * @param resourceName Nome do recurso para mensagem de erro
 * @returns Resposta de erro ou null se válido
 */
export function validateResourceId(id: string | null, resourceName: string): NextResponse | null {
  if (!id) {
    return errorResponse(`ID do ${resourceName} é obrigatório`);
  }
  
  return null;
} 