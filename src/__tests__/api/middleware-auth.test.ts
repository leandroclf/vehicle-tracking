import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, withAuth } from '../../lib/auth-middleware';
import { generateToken } from '../../lib/jwt';

// Mock do NextRequest
function createMockRequest(token?: string): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return {
    headers,
    nextUrl: { pathname: '/api/test' },
  } as unknown as NextRequest;
}

// Mock do NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn().mockImplementation((data, options) => ({
        status: options?.status || 200,
        data
      }))
    }
  };
});

describe('Testes do Middleware de Autenticação', () => {
  // Testes para a função verifyAuth
  describe('verifyAuth', () => {
    test('Deve rejeitar requisição sem cabeçalho de autorização', async () => {
      const request = createMockRequest();
      const result = await verifyAuth(request);
      
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.status).toBe(401);
    });
    
    test('Deve rejeitar requisição com token mal formatado', async () => {
      const headers = new Headers();
      headers.set('Authorization', 'Invalid-Format');
      
      const request = { headers } as unknown as NextRequest;
      const result = await verifyAuth(request);
      
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.status).toBe(401);
    });
    
    test('Deve rejeitar requisição com token inválido', async () => {
      const request = createMockRequest('invalid-token');
      const result = await verifyAuth(request);
      
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.status).toBe(401);
    });
    
    test('Deve aceitar requisição com token válido', async () => {
      const userData = { id: 'test-id', email: 'test@example.com', name: 'Test User' };
      const token = generateToken(userData);
      
      const request = createMockRequest(token);
      const result = await verifyAuth(request);
      
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(userData.id);
      expect(result.user?.email).toBe(userData.email);
      expect(result.user?.name).toBe(userData.name);
      expect(result.error).toBeUndefined();
      expect(result.status).toBeUndefined();
    });
  });
  
  // Testes para a função withAuth
  describe('withAuth', () => {
    test('Deve rejeitar requisição não autenticada', async () => {
      const request = createMockRequest();
      const handlerMock = jest.fn();
      
      const protectedHandler = withAuth(handlerMock);
      const response = await protectedHandler(request, {});
      
      expect(handlerMock).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });
    
    test('Deve passar requisição autenticada para o handler', async () => {
      const userData = { id: 'test-id', email: 'test@example.com', name: 'Test User' };
      const token = generateToken(userData);
      const request = createMockRequest(token);
      
      const handlerMock = jest.fn().mockReturnValue(
        NextResponse.json({ success: true })
      );
      
      const protectedHandler = withAuth(handlerMock);
      await protectedHandler(request, {});
      
      expect(handlerMock).toHaveBeenCalledTimes(1);
      expect(handlerMock).toHaveBeenCalledWith(
        request,
        {},
        expect.objectContaining({
          id: userData.id,
          email: userData.email,
          name: userData.name
        })
      );
    });
  });
}); 