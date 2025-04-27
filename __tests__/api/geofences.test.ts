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

// Import the route handlers after mocks are set up
import { GET as GET_ALL, POST } from '@/app/api/geofences/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/geofences/[id]/route';

describe('Geofences API Routes', () => {
  let req: NextRequest;
  let context: { env: any; params: any };
  const userId = 'test-user-id';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and context
    req = new NextRequest('http://localhost:3000/api/geofences');
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

  // --- Tests for /api/geofences --- 

  describe('GET /api/geofences', () => {
    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await GET_ALL(req, context);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    test('returns geofences when authenticated', async () => {
      const mockGeofences = [
        { id: 1, name: 'Home', user_id: userId, type: 'circle', coordinates: '{}', radius_meters: 100 },
        { id: 2, name: 'Work', user_id: userId, type: 'polygon', coordinates: '[]', radius_meters: null },
      ];
      mockDb.all.mockResolvedValue({ results: mockGeofences });

      const response = await GET_ALL(req, context);
      
      expect(response.status).toBe(200);
      // Expect coordinates to be parsed
      expect(await response.json()).toEqual([
        { id: 1, name: 'Home', user_id: userId, type: 'circle', coordinates: {}, radius_meters: 100 },
        { id: 2, name: 'Work', user_id: userId, type: 'polygon', coordinates: [], radius_meters: null },
      ]);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM geofences'));
      expect(mockDb.bind).toHaveBeenCalledWith('user_id', userId);
    });
  });

  describe('POST /api/geofences', () => {
    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await POST(req, context);
      expect(response.status).toBe(401);
    });

    test('validates required fields', async () => {
      const reqWithBody = new NextRequest('http://localhost:3000/api/geofences', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Circle' }), // Missing type, coordinates
      });
      const response = await POST(reqWithBody, context);
      expect(response.status).toBe(400);
      expect(await response.json()).toHaveProperty('error');
    });

    test('creates a new circle geofence', async () => {
      mockDb.run.mockResolvedValue({ success: true, meta: { last_row_id: 123 } });
      const reqWithBody = new NextRequest('http://localhost:3000/api/geofences', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'Test Circle', 
          type: 'circle', 
          coordinates: { lat: 10, lng: 20 }, 
          radius_meters: 500,
          alert_on_enter: true,
          alert_on_exit: false,
        }),
      });

      const response = await POST(reqWithBody, context);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBe(123);
      expect(body.name).toBe('Test Circle');
      expect(body.type).toBe('circle');
      expect(body.coordinates).toEqual({ lat: 10, lng: 20 });
      expect(body.radius_meters).toBe(500);
      expect(body.alert_on_enter).toBe(true);
      expect(body.alert_on_exit).toBe(false);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO geofences'));
    });
    
    test('creates a new polygon geofence', async () => {
      mockDb.run.mockResolvedValue({ success: true, meta: { last_row_id: 456 } });
      const polygonCoords = [{ lat: 0, lng: 0 }, { lat: 1, lng: 0 }, { lat: 0, lng: 1 }];
      const reqWithBody = new NextRequest('http://localhost:3000/api/geofences', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'Test Polygon', 
          type: 'polygon', 
          coordinates: polygonCoords,
          alert_on_enter: false,
          alert_on_exit: true,
        }),
      });

      const response = await POST(reqWithBody, context);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBe(456);
      expect(body.name).toBe('Test Polygon');
      expect(body.type).toBe('polygon');
      expect(body.coordinates).toEqual(polygonCoords);
      expect(body.radius_meters).toBeNull();
      expect(body.alert_on_enter).toBe(false);
      expect(body.alert_on_exit).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO geofences'));
    });
  });

  // --- Tests for /api/geofences/[id] --- 

  describe('GET /api/geofences/[id]', () => {
    beforeEach(() => {
      context.params = { id: '1' }; // Set geofence ID for these tests
    });

    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await GET_BY_ID(req, context);
      expect(response.status).toBe(401);
    });

    test('returns 404 if geofence not found or belongs to another user', async () => {
      mockDb.first.mockResolvedValue(null);
      const response = await GET_BY_ID(req, context);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Geocerca não encontrada' });
    });

    test('returns geofence details when found', async () => {
      const mockGeofence = { id: 1, name: 'Home', user_id: userId, type: 'circle', coordinates: '{}', radius_meters: 100 };
      mockDb.first.mockResolvedValue(mockGeofence);
      const response = await GET_BY_ID(req, context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ...mockGeofence, coordinates: {} }); // Parsed coordinates
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM geofences WHERE id = ?'));
      expect(mockDb.bind).toHaveBeenCalledWith(1, userId);
    });
  });

  describe('PUT /api/geofences/[id]', () => {
    beforeEach(() => {
      context.params = { id: '1' }; // Set geofence ID
    });

    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await PUT(req, context);
      expect(response.status).toBe(401);
    });

    test('validates input data', async () => {
      const reqWithBody = new NextRequest('http://localhost:3000/api/geofences/1', {
        method: 'PUT',
        body: JSON.stringify({ name: '' }), // Invalid name
      });
      const response = await PUT(reqWithBody, context);
      expect(response.status).toBe(400);
    });

    test('updates geofence when data is valid', async () => {
      mockDb.run.mockResolvedValue({ success: true });
      const updatedData = { 
        name: 'Updated Home', 
        type: 'circle', 
        coordinates: { lat: 11, lng: 21 }, 
        radius_meters: 150,
        alert_on_enter: false,
        alert_on_exit: true,
      };
      const reqWithBody = new NextRequest('http://localhost:3000/api/geofences/1', {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });

      const response = await PUT(reqWithBody, context);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(1);
      expect(body.name).toBe('Updated Home');
      expect(body.coordinates).toEqual({ lat: 11, lng: 21 });
      expect(body.radius_meters).toBe(150);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE geofences SET'));
    });
  });

  describe('DELETE /api/geofences/[id]', () => {
    beforeEach(() => {
      context.params = { id: '1' }; // Set geofence ID
    });

    test('returns 401 when not authenticated', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ isValid: false, error: 'Unauthorized' });
      const response = await DELETE(req, context);
      expect(response.status).toBe(401);
    });

    test('deletes geofence successfully', async () => {
      mockDb.run.mockResolvedValue({ success: true });
      const response = await DELETE(req, context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: 'Geocerca excluída com sucesso' });
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM geofences WHERE id = ?'));
      expect(mockDb.bind).toHaveBeenCalledWith(1, userId);
    });

    test('handles database errors during deletion', async () => {
      mockDb.run.mockRejectedValue(new Error('DB delete error'));
      const response = await DELETE(req, context);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Erro ao excluir geocerca' });
    });
  });
});

