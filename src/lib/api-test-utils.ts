import { generateToken } from './jwt';
import path from 'path';
import { NextRequest } from 'next/server';

// URL base para os testes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Usuário de teste
const TEST_USER = {
  id: 'test-user-id',
  name: 'Usuário de Teste',
  email: 'test@example.com'
};

/**
 * Gera um token JWT válido para testes
 */
export function getValidToken(): string {
  return generateToken(TEST_USER);
}

/**
 * Gera um token JWT inválido para testes
 */
export function getInvalidToken(): string {
  return 'invalid-token-for-testing';
}

/**
 * Faz uma requisição à API com ou sem token de autenticação
 */
export async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  useValidToken: boolean = true,
  useInvalidToken: boolean = false,
  asObject: boolean = true
) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (useValidToken) {
    headers['Authorization'] = `Bearer ${getValidToken()}`;
  } else if (useInvalidToken) {
    headers['Authorization'] = `Bearer ${getInvalidToken()}`;
  }

  const reqInit: RequestInit = {
    method,
    headers,
  };

  if (body) {
    reqInit.body = asObject ? JSON.stringify(body) : body;
  }

  const request = new NextRequest(url, reqInit);

  const routePath = path.join(
    process.cwd(),
    'src/app/api',
    endpoint.split('?')[0].replace(/^\//, ''),
    'route'
  );

  const handlerModule = await import(routePath);
  const handler = handlerModule[method];

  if (typeof handler !== 'function') {
    return {
      status: 405,
      data: { error: 'Method not allowed' },
      headers: new Headers(),
      ok: false,
    };
  }

  const response = await handler(request);
  const responseData = await response.json().catch(() => ({}));

  return {
    status: response.status,
    data: responseData,
    headers: response.headers,
    ok: response.ok,
  };
}

/**
 * Testa se um endpoint está protegido adequadamente
 */
export async function testEndpointProtection(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
) {
  console.log(`Testando proteção do endpoint: ${method} ${endpoint}`);

  // Teste 1: Sem token (deve falhar)
  const noTokenResponse = await makeRequest(endpoint, method, body, false);
  const isProtectedNoToken = noTokenResponse.status === 401;

  // Teste 2: Token inválido (deve falhar)
  const invalidTokenResponse = await makeRequest(endpoint, method, body, false, true);
  const isProtectedInvalidToken = invalidTokenResponse.status === 401;

  // Teste 3: Token válido (deve passar)
  const validTokenResponse = await makeRequest(endpoint, method, body, true);
  const isAccessibleWithToken = validTokenResponse.status !== 401;

  return {
    endpoint,
    method,
    isProtectedNoToken,
    isProtectedInvalidToken,
    isAccessibleWithToken,
    allTestsPassed: isProtectedNoToken && isProtectedInvalidToken && isAccessibleWithToken,
    responses: {
      noToken: noTokenResponse,
      invalidToken: invalidTokenResponse,
      validToken: validTokenResponse
    }
  };
} 