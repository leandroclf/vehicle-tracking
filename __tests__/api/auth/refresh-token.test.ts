import { NextRequest } from 'next/server';
import { POST as handler } from '@/app/api/auth/refresh-token/route';
import { verifyToken, createJWT } from '@/lib/auth';
import { findUserById } from '@/lib/db/queries/users';
import { User } from '@/types/auth';

// Mock para NextResponse.json para evitar o erro "fetch failed" no ambiente de teste Jest.
jest.mock('next/server', () => {
  const actualNextServer = jest.requireActual('next/server');
  return {
    ...actualNextServer,
    NextResponse: {
      ...actualNextServer.NextResponse,
      json: jest.fn((body, init) => {
        // Cria uma instância simulada que se assemelha a uma Response
        const response = new Response(JSON.stringify(body), {
          status: init?.status || 200,
          headers: init?.headers,
        });
        // Adiciona o método .json() que os testes esperam
        // @ts-ignore
        response.json = async () => Promise.resolve(body);
        return response;
      }),
    },
  };
});

// Mock das funções de dependência
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyToken: jest.fn(),
  createJWT: jest.fn(),
}));
jest.mock('@/lib/db/queries/users');

const mockUser: User = {
  id: 'user-id-456',
  email: 'refresh@example.com',
  name: 'Refresh User',
  password: 'hashedpassword123',
  role: 'user',
};

const mockRefreshTokenPayload = {
  userId: mockUser.id,
  type: 'refresh',
};

describe('/api/auth/refresh-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh the token successfully with a valid refresh token', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockRefreshTokenPayload);
    (findUserById as jest.Mock).mockResolvedValue(mockUser);
    (createJWT as jest.Mock).mockReturnValue('new.mocked.access.token');

    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {
        YUKZ_REFRESH_TOKEN: 'valid.refresh.token.here',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      message: 'Token refreshed successfully',
      token: 'new.mocked.access.token',
    });

    expect(verifyToken).toHaveBeenCalledWith('valid.refresh.token.here', 'refresh');
    expect(findUserById).toHaveBeenCalledWith(mockUser.id);
    expect(createJWT).toHaveBeenCalledWith({ id: mockUser.id, role: mockUser.role }, 'access');

    // Verificar cookie
    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('YUKZ_ACCESS_TOKEN=new.mocked.access.token');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('Path=/');
    // Adicionar verificação para secure e sameSite se necessário, dependendo da configuração do ambiente
  });

  it('should return 401 if refresh token is missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {},
    });

    const response = await handler(req);

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Refresh token not provided' });
    expect(verifyToken).not.toHaveBeenCalled();
    expect(findUserById).not.toHaveBeenCalled();
    expect(createJWT).not.toHaveBeenCalled();
  });

  it('should return 401 if refresh token is invalid or expired', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {
        YUKZ_REFRESH_TOKEN: 'invalid.or.expired.refresh.token',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Invalid or expired refresh token' });
    expect(verifyToken).toHaveBeenCalledWith('invalid.or.expired.refresh.token', 'refresh');
  });

  it('should return 401 if refresh token payload is malformed (e.g., wrong type)', async () => {
    (verifyToken as jest.Mock).mockResolvedValue({ userId: mockUser.id, type: 'access' }); // Simula payload com tipo incorreto

    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {
        YUKZ_REFRESH_TOKEN: 'valid.token.but.wrong.type',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Invalid refresh token payload' });
  });

  it('should return 404 if user from refresh token is not found', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockRefreshTokenPayload);
    (findUserById as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {
        YUKZ_REFRESH_TOKEN: 'valid.refresh.token.for.nonexistent.user',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(404);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'User not found' });
  });

  it('should return 405 if method is not POST', async () => {
    // Importa os handlers de método do arquivo de rota
    const routeModule = await import('@/app/api/auth/refresh-token/route');
    const httpMethods = [
      { method: 'GET', handlerFn: routeModule.GET },
      { method: 'PUT', handlerFn: routeModule.PUT },
      { method: 'DELETE', handlerFn: routeModule.DELETE },
      { method: 'PATCH', handlerFn: routeModule.PATCH },
    ];

    for (const item of httpMethods) {
      if (item.handlerFn) {
        // Os handlers não esperam argumentos de requisição
        const response = await item.handlerFn(); 
        expect(response.status).toBe(405);
        const body = await response.json();
        expect(body).toEqual({ error: 'Method not allowed' });
      } else {
        throw new Error(`Handler for method ${item.method} is not defined or exported in @/app/api/auth/refresh-token/route.ts`);
      }
    }
  });

  it('should return 500 if an unexpected error occurs during token verification', async () => {
    (verifyToken as jest.Mock).mockRejectedValue(new Error('Verification system error'));

    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {
        YUKZ_REFRESH_TOKEN: 'valid.refresh.token.here',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Internal server error' });
  });

  it('should return 500 if an unexpected error occurs during user lookup', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockRefreshTokenPayload);
    (findUserById as jest.Mock).mockRejectedValue(new Error('Database connection error'));

    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {
        YUKZ_REFRESH_TOKEN: 'valid.refresh.token.here',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Internal server error' });
  });

  it('should return 500 if an unexpected error occurs during new token creation', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(mockRefreshTokenPayload);
    (findUserById as jest.Mock).mockResolvedValue(mockUser);
    (createJWT as jest.Mock).mockImplementation(() => { throw new Error('JWT creation failed'); });

    const req = new NextRequest('http://localhost/api/auth/refresh-token', {
      method: 'POST',
      cookies: {
        YUKZ_REFRESH_TOKEN: 'valid.refresh.token.here',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Internal server error' });
  });
});