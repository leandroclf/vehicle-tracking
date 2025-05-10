import { apiClient, fetchWithAuth } from '@/lib/apiClient';

describe('apiClient', () => {
  const endpoint = '/api/test';
  const token = 'fake-token';
  const mockResponse = { foo: 'bar' };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    }) as any;
    apiClient.clearCache();
  });

  afterEach(() => {
    jest.resetAllMocks();
    apiClient.clearCache();
  });

  it('envia o token no header Authorization', async () => {
    await apiClient.get(endpoint, {}, token, false);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const fetchOptions = fetchCall[1];
    // Extrair o header Authorization do objeto Headers
    let authHeader = '';
    if (fetchOptions.headers instanceof Headers) {
      authHeader = fetchOptions.headers.get('Authorization');
    } else if (typeof fetchOptions.headers === 'object') {
      authHeader = fetchOptions.headers['Authorization'] || fetchOptions.headers['authorization'];
    }
    expect(authHeader).toBe(`Bearer ${token}`);
  });

  it('retorna dados corretamente em requisição GET', async () => {
    const res = await apiClient.get(endpoint, {}, token, false);
    expect(res.data).toEqual(mockResponse);
    expect(res.error).toBeNull();
    expect(res.status).toBe(200);
  });

  it('armazena e recupera do cache', async () => {
    await apiClient.get(endpoint, {}, token, true, 10000);
    const res2 = await apiClient.get(endpoint, {}, token, true, 10000);
    expect(res2.message).toMatch(/cache/i);
    expect(res2.data).toEqual(mockResponse);
  });

  it('limpa o cache corretamente', async () => {
    await apiClient.get(endpoint, {}, token, true, 10000);
    apiClient.clearCache(endpoint);
    const res = await apiClient.get(endpoint, {}, token, true, 10000);
    expect(res.message).not.toMatch(/cache/i);
  });

  it('trata erro de resposta HTTP', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request' })
    });
    const res = await apiClient.get(endpoint, {}, token, false);
    expect(res.data).toBeNull();
    expect(res.error).toBeInstanceOf(Error);
    expect(res.status).toBe(400);
    expect(res.message).toMatch(/bad request/i);
  });

  it('trata erro de exceção', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const res = await apiClient.get(endpoint, {}, token, false);
    expect(res.data).toBeNull();
    expect(res.error).toBeInstanceOf(Error);
    expect(res.status).toBe(500);
    expect(res.message).toMatch(/network error/i);
  });
}); 