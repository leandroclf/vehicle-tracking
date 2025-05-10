import { NextRequest, NextResponse } from 'next/server';
import { POST as handler } from '@/app/api/auth/register/route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

const mockUser = {
  id: 'new-user-id-456',
  email: 'newuser@example.com',
  name: 'New User',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProfile = {
  id: 'new-user-id-456',
  name: 'New User',
  phone: '999999999',
};

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve registrar novo usuário com sucesso usando Supabase', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: mockUser,
        session: { access_token: 'mocked.token' }
      },
      error: null
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile })
    });

    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handler(req);
    expect(response.status).toBe(201);
    const responseBody = await response.json() as any;
    expect(responseBody.user).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      name: mockProfile.name,
      profile: mockProfile
    });
    expect(responseBody.token).toBe('mocked.token');
  });

  it('deve retornar 409 se email já existir', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'User already registered' }
    });
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Another User',
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const response = await handler(req);
    expect(response.status).toBe(409);
    const responseBody = await response.json() as any;
    expect(responseBody.error).toMatch(/already/i);
  });

  it('deve retornar 400 se email, senha ou nome estiverem ausentes', async () => {
    const testCases = [
      { body: { password: 'p', name: 'n' }, error: /required/i },
      { body: { email: 'e', name: 'n' }, error: /required/i },
      { body: { email: 'e', password: 'p' }, error: /required/i },
    ];
    for (const tc of testCases) {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(tc.body),
        headers: { 'Content-Type': 'application/json' }
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json() as any;
      expect(responseBody.error).toMatch(tc.error);
    }
  });

  it('deve retornar 500 em erro inesperado', async () => {
    (supabase.auth.signUp as jest.Mock).mockRejectedValue(new Error('Supabase error'));
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'erroruser@example.com',
        password: 'password123',
        name: 'Error User',
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const response = await handler(req);
    expect(response.status).toBe(500);
    const responseBody = await response.json() as any;
    expect(responseBody.error).toMatch(/internal/i);
  });
});