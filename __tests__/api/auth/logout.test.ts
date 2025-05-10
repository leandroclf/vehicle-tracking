import { NextRequest } from 'next/server';
import { POST as handler } from '@/app/api/auth/logout/route';

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

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout successfully and clear the cookie', async () => {
    const req = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
    });
    req.cookies.set('YUKZ_ACCESS_TOKEN', 'valid.token.here');

    const response = await handler(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ message: 'Logout successful' });

    // Verificar se os cookies foram limpos
    const accessTokenCookie = response.cookies.get('YUKZ_ACCESS_TOKEN');
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.value).toBe('');
    expect(accessTokenCookie?.httpOnly).toBe(true);
    expect(accessTokenCookie?.path).toBe('/');
    expect(accessTokenCookie?.expires?.getTime()).toBe(new Date(0).getTime());

    const refreshTokenCookie = response.cookies.get('YUKZ_REFRESH_TOKEN');
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie?.value).toBe('');
    expect(refreshTokenCookie?.httpOnly).toBe(true);
    expect(refreshTokenCookie?.path).toBe('/');
    expect(refreshTokenCookie?.expires?.getTime()).toBe(new Date(0).getTime());
  });

  it('should return 200 even if no token cookie is present', async () => {
    const req = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
    });

    const response = await handler(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ message: 'Logout successful' });
    
    const accessTokenCookie = response.cookies.get('YUKZ_ACCESS_TOKEN');
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.value).toBe('');
  });

  it('should return 405 if method is not POST', async () => {
    // Importa os handlers de método do arquivo de rota
    const routeModule = await import('@/app/api/auth/logout/route');
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
        throw new Error(`Handler for method ${item.method} is not defined or exported in @/app/api/auth/logout/route.ts`);
      }
    }
  });
}); // Fim do teste