import { NextResponse } from 'next/server';
import * as authUtils from '@/lib/auth/verify-auth';
import * as jwtUtils from '@/lib/auth/jwt-utils';

jest.mock('@/lib/auth/verify-auth');
jest.mock('@/lib/auth/jwt-utils');

export const mockVerifyAuth = authUtils.verifyAuth as jest.Mock;
export const mockVerifyToken = jwtUtils.verifyToken as jest.Mock;
export const mockCreateJWT = jwtUtils.createJWT as jest.Mock;

export const VALID_TOKEN = 'test-token';
export const TEST_USER = {
  id: 'test-user-id',
  role: 'admin',
  email: 'test@example.com'
};

export const setupAuthMocks = (customConfig = {}) => {
  const config = {
    authenticated: true,
    ...customConfig
  };

  mockVerifyToken.mockImplementation(async (token: string) => {
    if (token === VALID_TOKEN) {
      return {
        sub: TEST_USER.id,
        role: TEST_USER.role,
        email: TEST_USER.email,
        exp: Math.floor(Date.now() / 1000) + 3600
      };
    }
    throw new Error('Token inválido');
  });

  mockVerifyAuth.mockImplementation(async (req) => {
    if (!config.authenticated) {
      return {
        authenticated: false,
        error: config.error || 'Não autorizado'
      };
    }

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return {
        authenticated: false,
        error: 'Token não fornecido'
      };
    }

    if (token === VALID_TOKEN) {
      return {
        authenticated: true,
        userId: TEST_USER.id,
        role: TEST_USER.role,
        email: TEST_USER.email
      };
    }

    return {
      authenticated: false,
      error: 'Token inválido'
    };
  });
  
  mockCreateJWT.mockImplementation(async () => VALID_TOKEN);
};

export const mockUnauthorized = (error = 'Token inválido') => {
  mockVerifyToken.mockRejectedValue(new Error(error));
  mockVerifyAuth.mockImplementation(async () => ({
    authenticated: false,
    error
  }));
}; 