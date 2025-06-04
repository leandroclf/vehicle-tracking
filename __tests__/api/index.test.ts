import http from 'http';
import request from 'supertest';
import { GET as apiHandler } from '@/app/api/route';
import { verifyAuth } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');
jest.mock('@/lib/auth-middleware');

describe('API: /api (index)', () => {
  it('GET /api - should return alerts for an authenticated user', async () => {
    const mockAlerts = [
      { id: 1, timestamp: '2024-01-01T00:00:00Z', vehicles: { name: 'Truck' }, read: false }
    ];

    (verifyAuth as jest.Mock).mockResolvedValue({
      user: { id: 'user1', email: 'test@example.com', name: 'Test User' }
    });

    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockAlerts, error: null })
    };

    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(builder)
    });

    const server = http.createServer(async (req, res) => {
      if (req.url === '/api' && req.method === 'GET') {
        const nextReq = new Request('http://localhost/api', {
          method: 'GET',
          headers: req.headers as any
        });
        const nextRes = await apiHandler(nextReq);
        res.statusCode = nextRes.status;
        nextRes.headers.forEach((v, k) => res.setHeader(k, v));
        const body = await nextRes.text();
        res.end(body);
      } else {
        res.statusCode = 404;
        res.end();
      }
    });

    const response = await request(server)
      .get('/api')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toMatchObject({ id: 1, vehicleName: 'Truck' });
  });
});
