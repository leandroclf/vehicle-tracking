import http from 'http';
import request from 'supertest';
import { GET as notificationsHandler } from '@/app/api/notifications/route';
import { verifyAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/auth-middleware');
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() }
}));

describe('API Endpoint: /api/notifications', () => {
  it('GET /api/notifications should return a list of notifications', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      user: { id: 'user1', email: 'test@example.com', name: 'Test User' }
    });

    const mockNotifications = [
      {
        id: 'n1',
        title: 'Test',
        message: 'Hello',
        type: 'info',
        read: false,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: (resolve: any) =>
        Promise.resolve({
          data: mockNotifications,
          error: null,
          count: mockNotifications.length
        }).then(resolve)
    };

    (supabase.from as jest.Mock).mockReturnValue(builder);

    const server = http.createServer(async (req, res) => {
      if (req.url?.startsWith('/api/notifications') && req.method === 'GET') {
        const nextReq = new Request(`http://localhost${req.url}`, {
          method: 'GET',
          headers: req.headers as any
        });
        const nextRes = await notificationsHandler(nextReq);
        res.statusCode = nextRes.status;
        nextRes.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await nextRes.text());
      } else {
        res.statusCode = 404;
        res.end();
      }
    });

    const response = await request(server)
      .get('/api/notifications')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.notifications)).toBe(true);
    expect(response.body.pagination).toEqual({
      total: 1,
      limit: 50,
      offset: 0
    });
  });
});