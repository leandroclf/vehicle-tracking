import { NextRequest } from 'next/server';
// NextResponse será mockado abaixo, não é necessário importar explicitamente aqui.
import { GET as handler } from '@/app/api/auth/me/route';
import { verifyToken } from '@/lib/auth';
import { findUserById } from '@/lib/db/queries/users';
import { User } from '@/types/auth';

// Mock para NextResponse.json para tentar evitar o erro "fetch failed" no ambiente de teste Jest.
// Este mock intercepta chamadas a NextResponse.json e retorna um objeto simples
// com as propriedades 'status' e um método 'json()' que os testes esperam.
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

// Mock das funções de dependência de negócio
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyToken: jest.fn(),
}));
jest.mock('@/lib/db/queries/users');

const mockUser: User = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword123', // Esta senha não deve ser retornada pela API
  role: 'user',
};

describe('/api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // O mock de NextResponse.json é um jest.fn() dentro de jest.mock, então jest.clearAllMocks() deve limpá-lo.
  });

  it('should return user data for an authenticated user', async () => {
    (verifyToken as jest.Mock).mockResolvedValue({ id: mockUser.id, role: mockUser.role });
    (findUserById as jest.Mock).mockResolvedValue(mockUser);

    const req = new NextRequest('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: 'YUKZ_ACCESS_TOKEN=valid.token.here',
      },
    });

    const response = await handler(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    const { password: _, ...expectedUser } = mockUser;
    expect(body).toEqual(expectedUser);
    expect(verifyToken).toHaveBeenCalledWith('valid.token.here');
    expect(findUserById).toHaveBeenCalledWith(mockUser.id);
  });

  it('should return 401 if user is not authenticated (no token)', async () => {
    const req = new NextRequest('http://localhost/api/auth/me', {
      method: 'GET',
    });

    const response = await handler(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(findUserById).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid or expired', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: 'YUKZ_ACCESS_TOKEN=invalid.or.expired.token',
      },
    });

    const response = await handler(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(verifyToken).toHaveBeenCalledWith('invalid.or.expired.token');
    expect(findUserById).not.toHaveBeenCalled();
  });

  it('should return 404 if authenticated user is not found in DB', async () => {
    (verifyToken as jest.Mock).mockResolvedValue({ id: 'nonexistent-user-id', role: 'user' });
    (findUserById as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: 'YUKZ_ACCESS_TOKEN=valid.token.for.nonexistent.user',
      },
    });

    const response = await handler(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'User not found' });
    expect(verifyToken).toHaveBeenCalledWith('valid.token.for.nonexistent.user');
    expect(findUserById).toHaveBeenCalledWith('nonexistent-user-id');
  });

  it('should return 405 for non-GET methods', async () => {
    // Importa os handlers de método do arquivo de rota
    const routeModule = await import('@/app/api/auth/me/route');
    const httpMethods = [
      { method: 'POST', handlerFn: routeModule.POST },
      { method: 'PUT', handlerFn: routeModule.PUT },
      { method: 'DELETE', handlerFn: routeModule.DELETE },
      { method: 'PATCH', handlerFn: routeModule.PATCH },
    ];

    for (const item of httpMethods) {
      if (item.handlerFn) {
        // Os handlers POST, PUT, DELETE, PATCH em me/route.ts não esperam argumentos de requisição
        const response = await item.handlerFn(); 
        expect(response.status).toBe(405);
        const body = await response.json();
        expect(body).toEqual({ error: 'Method not allowed' });
      } else {
        // Este erro indica que o handler esperado não foi exportado pelo módulo de rota
        throw new Error(`Handler for method ${item.method} is not defined or exported in @/app/api/auth/me/route.ts`);
      }
    }
  });

  it('should return 500 if token verification throws an error', async () => {
    (verifyToken as jest.Mock).mockRejectedValue(new Error('Token verification system error'));

    const req = new NextRequest('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: 'YUKZ_ACCESS_TOKEN=token.that.causes.error',
      },
    });

    const response = await handler(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
    expect(verifyToken).toHaveBeenCalledWith('token.that.causes.error');
    expect(findUserById).not.toHaveBeenCalled();
  });

  it('should return 500 if user lookup throws an error', async () => {
    (verifyToken as jest.Mock).mockResolvedValue({ id: mockUser.id, role: mockUser.role });
    (findUserById as jest.Mock).mockRejectedValue(new Error('Database connection error'));

    const req = new NextRequest('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: 'YUKZ_ACCESS_TOKEN=valid.token.here',
      },
    });

    const response = await handler(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
    expect(verifyToken).toHaveBeenCalledWith('valid.token.here');
    expect(findUserById).toHaveBeenCalledWith(mockUser.id);
  });
});