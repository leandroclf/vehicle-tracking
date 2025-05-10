import { describe, expect, jest, test } from '@jest/globals';
import { makeRequest } from '@/lib/api-test-utils';

describe('Auth Logout API Endpoint', () => {
  describe('POST /api/auth/logout', () => {
    test('deve fazer logout com sucesso', async () => {
      const response = await makeRequest('/auth/logout', 'POST');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        message: 'Logout successful'
      });

      // Verificar se os cookies foram limpos
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toBeTruthy();

      // Verificar cookie de acesso
      expect(cookies).toMatch(/YUKZ_ACCESS_TOKEN=;.*expires=Thu, 01 Jan 1970/);
      expect(cookies).toMatch(/httpOnly/);
      expect(cookies).toMatch(/path=\//);

      // Verificar cookie de refresh
      expect(cookies).toMatch(/YUKZ_REFRESH_TOKEN=;.*expires=Thu, 01 Jan 1970/);
    });

    test('deve retornar erro 500 em caso de falha interna', async () => {
      // Simular um erro durante o processamento
      jest.spyOn(console, 'error').mockImplementation(() => {}); // Suprimir log de erro
      jest.spyOn(Response.prototype, 'json').mockImplementation(() => {
        throw new Error('Simulated error');
      });

      const response = await makeRequest('/auth/logout', 'POST');

      expect(response.status).toBe(500);
      expect(response.data).toEqual({
        error: 'Internal server error'
      });

      // Restaurar console.error
      (console.error as jest.Mock).mockRestore();
    });
  });

  describe('Outros métodos HTTP', () => {
    test('deve retornar erro 405 para GET', async () => {
      const response = await makeRequest('/auth/logout', 'GET');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });

    test('deve retornar erro 405 para PUT', async () => {
      const response = await makeRequest('/auth/logout', 'PUT');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });

    test('deve retornar erro 405 para DELETE', async () => {
      const response = await makeRequest('/auth/logout', 'DELETE');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });

    test('deve retornar erro 405 para PATCH', async () => {
      const response = await makeRequest('/auth/logout', 'PATCH');
      expect(response.status).toBe(405);
      expect(response.data).toEqual({
        error: 'Method not allowed'
      });
    });
  });
});
