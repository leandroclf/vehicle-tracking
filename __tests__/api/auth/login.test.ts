import { NextRequest, NextResponse } from 'next/server';
import { POST as handler } from '@/app/api/auth/login/route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProfile = {
  id: 'user-id-123',
  name: 'Test User',
  phone: '123456789',
};

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve autenticar com sucesso usando Supabase', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
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

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await handler(req);
    expect(response.status).toBe(200);
    const responseBody = await response.json() as any;
    expect(responseBody.user).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      name: mockProfile.name,
      profile: mockProfile
    });
    expect(responseBody.token).toBe('mocked.token');
  });

  it('deve retornar 401 para credenciais inválidas', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Invalid login' }
    });
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const response = await handler(req);
    expect(response.status).toBe(401);
    const responseBody = await response.json() as any;
    expect(responseBody.error).toMatch(/invalid/i);
  });

  it('deve retornar 400 se email ou senha estiverem ausentes', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const response = await handler(req);
    expect(response.status).toBe(400);
    const responseBody = await response.json() as any;
    expect(responseBody.error).toMatch(/required/i);
  });

  it('deve retornar 500 em erro inesperado', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(new Error('Supabase error'));
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const response = await handler(req);
    expect(response.status).toBe(500);
    const responseBody = await response.json() as any;
    expect(responseBody.error).toMatch(/internal/i);
  });
});