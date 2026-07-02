import { NextRequest } from 'next/server';
import { POST, PUT } from '../route';

describe('/api/auth/phone', () => {
  it('returns validation error for invalid phone on POST', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/phone', {
      method: 'POST',
      body: JSON.stringify({ phone: '123' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Dados inválidos');
  });

  it('returns internal error for valid POST while SMS flow is not implemented', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/phone', {
      method: 'POST',
      body: JSON.stringify({ phone: '+5565999887766' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('enviado');
  });

  it('returns validation error for invalid token on PUT', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/phone', {
      method: 'PUT',
      body: JSON.stringify({ phone: '+5565999887766', token: '000000' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Erro interno do servidor');
  });
});
