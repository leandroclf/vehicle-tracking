import http from 'http';
import request from 'supertest';
import { GET as overviewHandler } from '@/app/api/dashboard/statistics/route';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/auth-middleware');
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() }
}));

describe('API Endpoint: /api/dashboard/overview', () => {
  it('GET /api/dashboard/overview should return statistics overview', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      user: { id: 'user1', email: 'test@example.com', name: 'Test User' }
    });

    const vehiclesBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{}], error: null, count: 5 })
    };

    const activeBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockResolvedValue({ data: [{}], error: null, count: 3 })
    };

    const alertsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockResolvedValue({ data: [], error: null, count: 2 })
    };

    const tripsBuilder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gt: jest.fn().mockResolvedValue({
        data: [{ distance: 100, fuel_used: 20 }],
        error: null
      })
    };

    const mockFrom = (supabase.from as jest.Mock);
    mockFrom
      .mockImplementationOnce(() => vehiclesBuilder)
      .mockImplementationOnce(() => activeBuilder)
      .mockImplementationOnce(() => alertsBuilder)
      .mockImplementationOnce(() => tripsBuilder);

    const server = http.createServer(async (req, res) => {
      if (req.url?.startsWith('/api/dashboard/overview') && req.method === 'GET') {
        const nextReq = new Request(`http://localhost${req.url}`, {
          method: 'GET',
          headers: req.headers as any
        });
        const nextRes = await overviewHandler(nextReq);
        res.statusCode = nextRes.status;
        nextRes.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await nextRes.text());
      } else {
        res.statusCode = 404;
        res.end();
      }
    });

    const response = await request(server)
      .get('/api/dashboard/overview')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      vehicle_count: 5,
      active_vehicles: 3,
      total_distance: 100,
      alerts_count: 2,
      fuel_consumption: 20,
      period: 'today'
    });
  });
});