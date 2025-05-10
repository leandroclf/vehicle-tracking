import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { makeRequest } from '@/lib/api-test-utils';
import * as auth from '@/lib/auth';
import * as userQueries from '@/lib/db/queries/users';

// Types do sistema
type TokenType = 'access' | 'refresh';
type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
};

type JWTPayload = {
  id?: string;
  role?: string;
  userId?: string;
};

type ComparePasswords = (password: string, hash: string) => Promise<boolean>;
type CreateJWT = (payload: JWTPayload, type: TokenType) => string;
type FindUserByEmail = (email: string) => Promise<User | null>;

// Mock das dependências
// Definindo tipos de retorno explicitamente para os mocks
const mockComparePasswords = jest.fn() as jest.MockedFunction<ComparePasswords>;
const mockCreateJWT = jest.fn() as jest.MockedFunction<CreateJWT>;
const mockFindUserByEmail = jest.fn() as jest.MockedFunction<FindUserByEmail>;

jest.mock('@/lib/auth', () => ({
  comparePasswords: (password: string, hash: string) => mockComparePasswords(password, hash),
  createJWT: (payload: JWTPayload, type: TokenType) => mockCreateJWT(payload, type)
}));

jest.mock('@/lib/db/queries/users', () => ({
  findUserByEmail: (email: string) => mockFindUserByEmail(email)
}));

describe('Auth Login API Endpoint', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    role: 'user'
  };

  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockComparePasswords.mockResolvedValue(true);
    mockCreateJWT.mockImplementation((payload, type) => {
        return type === 'access' ? mockAccessToken : mockRefreshToken;
      });
    mockFindUserByEmail.mockResolvedValue(mockUser);
  });

  describe('POST /api/auth/login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'correct_password'
    };

    test('deve fazer login com sucesso quando credenciais válidas', async () => {
      const response = await makeRequest('/auth/login', 'POST', validCredentials);

      const { password, ...userWithoutPassword } = mockUser;

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        message: 'Login successful',
        token: mockAccessToken,
        user: userWithoutPassword
      });

      // Verificar se os cookies foram definidos
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('YUKZ_ACCESS_TOKEN');
      expect(cookies).toContain('YUKZ_REFRESH_TOKEN');
    });

    test('deve retornar erro 401 quando credenciais inválidas', async () => {
      mockComparePasswords.mockResolvedValue(false);

      const response = await makeRequest('/auth/login', 'POST', validCredentials);

      expect(response.status).toBe(401);
      expect(response.data).toEqual({
        error: 'Invalid credentials'
      });
    });

    test('deve retornar erro 401 quando usuário não encontrado', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      const response = await makeRequest('/auth/login', 'POST', validCredentials);

      expect(response.status).toBe(401);
      expect(response.data).toEqual({
        error: 'Invalid credentials'
      });
    });

    test('deve retornar erro 400 quando email não fornecido', async () => {
      const invalidCredentials = {
        password: 'some_password'
      };

      const response = await makeRequest('/auth/login', 'POST', invalidCredentials);

      expect(response.status).toBe(400);
      expect(response.data).toEqual({
        error: 'Email and password are required'
      });
    });

    test('deve retornar erro 400 quando senha não fornecida', async () => {
      const invalidCredentials = {
        email: 'test@example.com'
      };

      const response = await makeRequest('/auth/login', 'POST', invalidCredentials);

      expect(response.status).toBe(400);
      expect(response.data).toEqual({
        error: 'Email and password are required'
      });
    });

    test('deve gerar tokens com os dados corretos do usuário', async () => {
      await makeRequest('/auth/login', 'POST', validCredentials);

      expect(mockCreateJWT).toHaveBeenCalledWith(
        { id: mockUser.id, role: mockUser.role },
        'access'
      );

      expect(mockCreateJWT).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'refresh'
      );
    });
  });

  describe('Outros métodos HTTP', () => {
    test('deve retornar erro 405 para GET', async () => {
      const response = await makeRequest('/auth/login', 'GET');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });

    test('deve retornar erro 405 para PUT', async () => {
      const response = await makeRequest('/auth/login', 'PUT');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });

    test('deve retornar erro 405 para DELETE', async () => {
      const response = await makeRequest('/auth/login', 'DELETE');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });

    test('deve retornar erro 405 para PATCH', async () => {
      const response = await makeRequest('/auth/login', 'PATCH');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });
  });
});
