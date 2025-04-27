import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';

// Mock dependencies
jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn(),
}));

// Mock D1 database
const mockDb = {
  prepare: jest.fn().mockReturnThis(),
  bind: jest.fn().mockReturnThis(),
  all: jest.fn(),
  run: jest.fn(),
  first: jest.fn(),
};

// Mock environment
const mockEnv = {
  DB: mockDb,
};

// Import the route handler after mocks are set up
import { GET, PATCH, PUT } from '@/app/api/alerts/route';

describe('Alerts API Route', () => {
  let req: NextRequest;
  let context: { env: any; params: any };
  const userId = 'test-user-id';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and context
    req = new NextRequest('http://localhost:3000/api/alerts');
    context = {
      env: mockEnv,
      params: {},
    };
    
    // Default mock for verifyAuth
    (verifyAuth as jest.Mock).mockResolvedValue({ 
      userId: userId,
      isValid: true 
    });
  });

  describe('GET /api/alerts', () => {
    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await GET(req, context);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    test('returns alerts with vehicle names when authenticated', async () => {
      const mockAlerts = [
        { id: 1, user_id: userId, vehicle_id: 10, type: 'speed', message: 'High speed', read: false, timestamp: new Date().toISOString(), vehicleName: 'Car A' },
        { id: 2, user_id: userId, vehicle_id: null, type: 'other', message: 'System alert', read: true, timestamp: new Date().toISOString(), vehicleName: null },
      ];
      mockDb.all.mockResolvedValue({ results: mockAlerts });

      const response = await GET(req, context);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockAlerts);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT a.*, v.name as vehicleName FROM alerts a LEFT JOIN vehicles v'));
      expect(mockDb.bind).toHaveBeenCalledWith(userId);
    });

    test('handles database errors', async () => {
      mockDb.all.mockRejectedValue(new Error('DB error'));
      const response = await GET(req, context);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Erro ao buscar alertas' });
    });
  });

  describe('PATCH /api/alerts', () => {
    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await PATCH(req, context);
      expect(response.status).toBe(401);
    });

    test('returns 400 if alertIds are missing or not an array', async () => {
      const reqWithBody = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'PATCH',
        body: JSON.stringify({}), // Missing alertIds
      });
      let response = await PATCH(reqWithBody, context);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'IDs dos alertas são obrigatórios e devem ser um array.' });

      const reqWithInvalidBody = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'PATCH',
        body: JSON.stringify({ alertIds: 'not-an-array' }),
      });
      response = await PATCH(reqWithInvalidBody, context);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'IDs dos alertas são obrigatórios e devem ser um array.' });
    });

    test('marks specified alerts as read', async () => {
      mockDb.run.mockResolvedValue({ success: true });
      const alertIdsToUpdate = [1, 3];
      const reqWithBody = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'PATCH',
        body: JSON.stringify({ alertIds: alertIdsToUpdate }),
      });

      const response = await PATCH(reqWithBody, context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: 'Alertas marcados como lidos' });
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE alerts SET read = true WHERE user_id = ? AND id IN'));
      // Check if bind was called correctly for the IN clause placeholders
      expect(mockDb.bind).toHaveBeenCalledWith(userId, 1, 3);
    });

    test('handles database errors during update', async () => {
      mockDb.run.mockRejectedValue(new Error('DB update error'));
      const reqWithBody = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'PATCH',
        body: JSON.stringify({ alertIds: [1] }),
      });
      const response = await PATCH(reqWithBody, context);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Erro ao marcar alertas como lidos' });
    });
  });

  describe('PUT /api/alerts', () => {
    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await PUT(req, context);
      expect(response.status).toBe(401);
    });

    test('marks all alerts as read for the user', async () => {
      mockDb.run.mockResolvedValue({ success: true });
      const response = await PUT(req, context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: 'Todos os alertas marcados como lidos' });
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE alerts SET read = true WHERE user_id = ?'));
      expect(mockDb.bind).toHaveBeenCalledWith(userId);
    });

    test('handles database errors when marking all as read', async () => {
      mockDb.run.mockRejectedValue(new Error('DB update error'));
      const response = await PUT(req, context);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Erro ao marcar todos os alertas como lidos' });
    });
  });
});

