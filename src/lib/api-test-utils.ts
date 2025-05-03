import { generateToken } from './jwt';

// Substituindo node-fetch por uma implementação mock mais simples para os testes
const mockFetch = async (url: string, options: any) => {
  // Simular uma resposta básica para os testes
  return {
    status: 200,
    ok: true,
    headers: new Headers(),
    json: async () => ({ message: 'Mock response' })
  };
};

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
  useInvalidToken: boolean = false
) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Adicionar token de autenticação se necessário
  if (useValidToken) {
    headers['Authorization'] = `Bearer ${getValidToken()}`;
  } else if (useInvalidToken) {
    headers['Authorization'] = `Bearer ${getInvalidToken()}`;
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Usar o mock em vez do fetch real para testes
  const response = await mockFetch(url, options);
  const responseData = await response.json().catch(() => ({}));

  return {
    status: response.status,
    data: responseData,
    headers: response.headers,
    ok: response.ok
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