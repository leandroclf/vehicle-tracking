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
import { GET, POST } from '@/app/api/vehicles/route';

describe('Vehicles API Routes', () => {
  let req: NextRequest;
  let context: { env: any; params: any };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and context
    req = new NextRequest('http://localhost:3000/api/vehicles');
    context = {
      env: mockEnv,
      params: {},
    };
    
    // Default mock for verifyAuth
    (verifyAuth as jest.Mock).mockResolvedValue({ 
      userId: 'test-user-id',
      isValid: true 
    });
  });

  describe('GET /api/vehicles', () => {
    test('returns 401 when not authenticated', async () => {
      // Mock auth failure
      (verifyAuth as jest.Mock).mockResolvedValue({ 
        isValid: false,
        error: 'Unauthorized' 
      });

      const response = await GET(req, context);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    test('returns vehicles when authenticated', async () => {
      // Mock database response
      const mockVehicles = [
        { id: 1, name: 'Car 1', user_id: 'test-user-id', plate: 'ABC1234', type: 'car', status: 'online' },
        { id: 2, name: 'Car 2', user_id: 'test-user-id', plate: 'XYZ5678', type: 'car', status: 'offline' },
      ];
      mockDb.all.mockResolvedValue({ results: mockVehicles });

      const response = await GET(req, context);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockVehicles);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM vehicles'));
      expect(mockDb.bind).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    test('handles database errors', async () => {
      // Mock database error
      mockDb.all.mockRejectedValue(new Error('Database error'));

      const response = await GET(req, context);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Erro ao buscar veículos' });
    });
  });

  describe('POST /api/vehicles', () => {
    test('returns 401 when not authenticated', async () => {
      // Mock auth failure
      (verifyAuth as jest.Mock).mockResolvedValue({ 
        isValid: false,
        error: 'Unauthorized' 
      });

      const response = await POST(req, context);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    test('validates required fields', async () => {
      // Create request with missing fields
      const reqWithBody = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Car' }), // Missing plate and type
      });

      const response = await POST(reqWithBody, context);
      
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toContain('Validation error');
    });

    test('creates a new vehicle when data is valid', async () => {
      // Mock checking for duplicate plate
      mockDb.first.mockResolvedValue(null); // No duplicate found
      
      // Mock successful insert
      mockDb.run.mockResolvedValue({ success: true, meta: { last_row_id: 123 } });
      
      // Create request with valid data
      const reqWithBody = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'Test Car', 
          plate: 'TEST123', 
          type: 'car' 
        }),
      });

      const response = await POST(reqWithBody, context);
      
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody.id).toBe(123);
      expect(responseBody.name).toBe('Test Car');
      expect(responseBody.plate).toBe('TEST123');
      expect(responseBody.type).toBe('car');
      expect(responseBody.user_id).toBe('test-user-id');
    });

    test('rejects duplicate plate numbers', async () => {
      // Mock finding a duplicate plate
      mockDb.first.mockResolvedValue({ id: 456 }); // Duplicate found
      
      // Create request with duplicate plate
      const reqWithBody = new NextRequest('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'Test Car', 
          plate: 'DUPLICATE', 
          type: 'car' 
        }),
      });

      const response = await POST(reqWithBody, context);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ 
        error: 'Já existe um veículo com esta placa' 
      });
    });
  });
});
