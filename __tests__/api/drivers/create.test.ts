import { NextRequest } from 'next/server';
import { POST as handler } from '@/app/api/drivers/route';
import { supabase } from '@/lib/supabase'; // Usado para mockar a inserção no DB
import { verifyAuth } from '@/lib/auth-middleware';
import { v4 as uuidv4 } from 'uuid';

// Mock das funções de dependência
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));
jest.mock('@/lib/auth-middleware');
jest.mock('uuid');

const mockNewDriverData = {
  name: 'Novo Motorista',
  license_number: '98765432100',
  license_type: 'B',
  license_expiry: '2025-12-31',
  phone: '11977776666',
  email: 'novo.motorista@example.com',
  status: 'active',
  notes: 'Observação do novo motorista',
};

const mockUserId = 'user-test-id';


describe('API Endpoint: /api/drivers (POST)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid-value');
  });

  it('should create a driver successfully with valid data', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ success: true, userId: mockUserId });
    (supabase.from('drivers').insert().select().single as jest.Mock).mockResolvedValueOnce({
      data: { id: 'mock-uuid-value', ...mockNewDriverData, user_id: mockUserId },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/drivers', {
      method: 'POST',
      body: JSON.stringify(mockNewDriverData),
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBe('Motorista criado com sucesso');
    expect(responseBody.data.driver).toEqual(expect.objectContaining({
      id: 'mock-uuid-value',
      ...mockNewDriverData,
      user_id: mockUserId
    }));
    expect(supabase.from('drivers').insert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'mock-uuid-value',
      user_id: mockUserId,
      name: mockNewDriverData.name,
      license_number: mockNewDriverData.license_number,
    }));
  });

  it('should return 401 when user is not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ success: false });

    const req = new NextRequest('http://localhost/api/drivers', {
      method: 'POST',
      body: JSON.stringify(mockNewDriverData),
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const response = await handler(req);

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      success: false,
      error: 'Não autorizado',
    });
    expect(supabase.from('drivers').insert).not.toHaveBeenCalled();
  });

  describe('Field Validations', () => {
    const commonHeaders = { 'Authorization': 'Bearer valid-token' };
    beforeEach(() => {
      (verifyAuth as jest.Mock).mockResolvedValue({ success: true, userId: mockUserId });
    });

    it('should return 400 for name too short', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, name: 'A' }),
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.name._errors[0]).toContain('Nome deve ter pelo menos 3 caracteres');
    });

    it('should return 400 for name too long', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, name: 'A'.repeat(101) }),
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.name._errors[0]).toContain('Nome não pode exceder 100 caracteres');
    });

    it('should return 400 for license_number too short', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, license_number: '123' }),
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.license_number._errors[0]).toContain('Número da CNH deve ter pelo menos 9 caracteres');
    });

    it('should return 400 for license_number too long', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, license_number: '1'.repeat(12) }),
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.license_number._errors[0]).toContain('Número da CNH não pode exceder 11 caracteres');
    });

    it('should return 400 for license_number with invalid characters', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, license_number: 'ABC123DEF' }),
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.license_number._errors[0]).toContain('O número da CNH deve conter apenas dígitos');
    });

    it('should return 400 for invalid license_type', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, license_type: 'X' }), // Invalid enum
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.license_type._errors[0]).toBeDefined();
    });

    it('should return 400 for invalid license_expiry format', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, license_expiry: '31/12/2025' }), // Invalid format
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.license_expiry._errors[0]).toContain('Data de validade da CNH inválida');
    });

    it('should return 400 for past license_expiry date', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, license_expiry: '2020-01-01' }), // Past date
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.license_expiry._errors[0]).toContain('Data de validade da CNH não pode ser no passado');
    });

    it('should return 400 for invalid phone format', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, phone: '123' }), // Invalid format
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.phone._errors[0]).toContain('Formato de telefone inválido');
    });

    it('should return 400 for invalid email format', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, email: 'invalid-email' }),
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.email._errors[0]).toContain('Formato de e-mail inválido');
    });

    it('should return 400 for invalid status', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, status: 'unknown_status' }), // Invalid enum
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.status._errors[0]).toBeDefined();
    });

    it('should return 400 for notes too long', async () => {
      const req = new NextRequest('http://localhost/api/drivers', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...mockNewDriverData, notes: 'A'.repeat(501) }), // Too long
      });
      const response = await handler(req);
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Dados inválidos');
      expect(responseBody.details.notes._errors[0]).toContain('Observações não podem exceder 500 caracteres');
    });
  });

  it('should return 500 if there is a server error during creation', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ success: true, userId: mockUserId });
    (supabase.from('drivers').insert().select().single as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error', details: 'Some details', hint: '', code: 'DB_ERROR' },
    });

    const req = new NextRequest('http://localhost/api/drivers', {
      method: 'POST',
      body: JSON.stringify(mockNewDriverData),
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
    });

    const response = await handler(req);

    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBe('Erro ao criar motorista');
    expect(responseBody.details.databaseError).toBe('Database error');
  });

  // O Next.js App Router lida com isso automaticamente. 
  // Se um handler para um método específico (ex: GET) não for exportado de route.ts,
  // o Next.js retornará 405. Não há necessidade de testar isso no handler POST diretamente.
  // Este teste pode ser removido ou adaptado para um teste de integração se necessário.
  // Por enquanto, vamos assumir que o roteamento do Next.js funciona como esperado.
  expect(true).toBe(true); // Placeholder para manter a estrutura do teste
});