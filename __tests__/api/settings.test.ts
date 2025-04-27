import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

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
import { GET, PUT } from '@/app/api/settings/route';

describe('Settings API Route', () => {
  let req: NextRequest;
  let context: { env: any; params: any };
  const userId = 'test-user-id';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and context
    req = new NextRequest('http://localhost:3000/api/settings');
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

  describe('GET /api/settings', () => {
    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await GET(req, context);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    test('returns settings when authenticated', async () => {
      const mockSettings = {
        user_id: userId,
        notifications_enabled: true,
        speed_alert_enabled: true,
        speed_alert_value: 100,
        // ... other settings
      };
      mockDb.first.mockResolvedValue(mockSettings);

      const response = await GET(req, context);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockSettings);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM user_settings WHERE user_id = ?'));
      expect(mockDb.bind).toHaveBeenCalledWith(userId);
    });

    test('returns default settings if user settings not found', async () => {
      mockDb.first.mockResolvedValue(null); // No settings found
      const response = await GET(req, context);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.user_id).toBe(userId); // Should include user_id
      expect(body.notifications_enabled).toBe(true); // Default value
      expect(body.speed_alert_enabled).toBe(false); // Default value
    });

    test('handles database errors', async () => {
      mockDb.first.mockRejectedValue(new Error('DB error'));
      const response = await GET(req, context);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Erro ao buscar configurações' });
    });
  });

  describe('PUT /api/settings', () => {
    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await PUT(req, context);
      expect(response.status).toBe(401);
    });

    test('validates input data', async () => {
      const reqWithBody = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ speed_alert_value: 'invalid' }), // Invalid number
      });
      const response = await PUT(reqWithBody, context);
      expect(response.status).toBe(400);
      expect(await response.json()).toHaveProperty('error');
    });

    test('updates settings when data is valid', async () => {
      mockDb.run.mockResolvedValue({ success: true });
      const updatedSettings = {
        notifications_enabled: false,
        speed_alert_enabled: true,
        speed_alert_value: 120,
        dark_mode: true,
      };
      const reqWithBody = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updatedSettings),
      });

      const response = await PUT(reqWithBody, context);
      expect(response.status).toBe(200);
      const body = await response.json();
      // Check if the returned body reflects the update (assuming the route returns the updated object)
      expect(body.notifications_enabled).toBe(false);
      expect(body.speed_alert_value).toBe(120);
      expect(body.dark_mode).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO user_settings'));
      expect(mockDb.bind).toHaveBeenCalledWith(
        userId,
        false, // notifications_enabled
        true,  // speed_alert_enabled
        120,   // speed_alert_value
        expect.any(Boolean), // ignition_alert_enabled (default or provided)
        expect.any(Boolean), // movement_alert_enabled
        expect.any(Boolean), // panic_alert_enabled
        expect.any(Boolean), // battery_alert_enabled
        expect.any(Boolean), // geofence_alert_enabled
        expect.any(String),  // map_type
        true,  // dark_mode
        expect.any(String),  // measurement_unit
        expect.any(String)   // language
      );
    });

    test('handles database errors during update', async () => {
      mockDb.run.mockRejectedValue(new Error('DB update error'));
      const reqWithBody = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ dark_mode: true }),
      });
      const response = await PUT(reqWithBody, context);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Erro ao salvar configurações' });
    });
  });
});

