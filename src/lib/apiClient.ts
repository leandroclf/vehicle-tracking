import { useAuth } from "./auth";

// Tipos para respostas da API
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
  message: string;
  timestamp: string;
}

// Cache em memória para armazenar respostas da API
const apiCache = new Map<string, {
  data: any;
  timestamp: number;
  expiry: number;
}>();

// Tempo padrão de expiração do cache (5 minutos)
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Utility function to make authenticated API requests.
 * Automatically adds the JWT token to the Authorization header.
 *
 * @param url - The API endpoint URL.
 * @param options - Optional fetch options (method, body, etc.).
 * @param token - The JWT token from AuthContext.
 * @returns The fetch Response object.
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  token: string | null
): Promise<Response> => {
  const headers = new Headers(options.headers || {});

  // Add Authorization header if token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure Content-Type is set for POST/PUT/PATCH requests with body
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // Make the fetch request
  const response = await fetch(url, fetchOptions);

  return response;
};

/**
 * Cliente API padronizado para comunicação com o backend
 * Inclui suporte a cache e formato de resposta padronizado
 */
export const apiClient = {
  /**
   * Realiza uma requisição GET
   * @param endpoint Endpoint da API
   * @param params Parâmetros da requisição
   * @param token Token de autenticação
   * @param useCache Se deve usar cache
   * @param cacheExpiry Tempo de expiração do cache em ms
   */
  async get<T>(
    endpoint: string,
    params: Record<string, any> = {},
    token: string | null,
    useCache = true,
    cacheExpiry = DEFAULT_CACHE_EXPIRY
  ): Promise<ApiResponse<T>> {
    try {
      // Construir a chave de cache
      const queryString = new URLSearchParams(params).toString();
      const cacheKey = `${endpoint}?${queryString}`;
      
      // Verificar cache se habilitado
      if (useCache) {
        const cachedData = apiCache.get(cacheKey);
        const now = Date.now();
        
        if (cachedData && now - cachedData.timestamp < cachedData.expiry) {
          return {
            data: cachedData.data,
            error: null,
            status: 200,
            message: 'Dados recuperados do cache',
            timestamp: new Date().toISOString()
          };
        }
      }
      
      // Construir URL com parâmetros
      const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      // Realizar requisição
      const response = await fetchWithAuth(url, { method: 'GET' }, token);
      
      // Processar resposta
      const responseData: any = await response.json();
      
      // Armazenar no cache se a resposta for bem-sucedida
      if (response.ok && useCache) {
        apiCache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now(),
          expiry: cacheExpiry
        });
      }
      
      return {
        data: response.ok ? (responseData as any as T) : null,
        error: response.ok ? null : new Error(responseData.error || 'Erro desconhecido'),
        status: response.status,
        message: response.ok ? 'Sucesso' : responseData.error || 'Erro na requisição',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        status: 500,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * Realiza uma requisição POST
   * @param endpoint Endpoint da API
   * @param data Dados a serem enviados
   * @param token Token de autenticação
   * @param invalidateCache Se deve invalidar o cache para este endpoint
   */
  async post<T>(
    endpoint: string,
    data: Record<string, any> = {},
    token: string | null,
    invalidateCache = true
  ): Promise<ApiResponse<T>> {
    try {
      // Realizar requisição
      const response = await fetchWithAuth(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(data)
        },
        token
      );
      
      // Processar resposta
      const responseData: any = await response.json();
      
      // Invalidar cache relacionado se necessário
      if (invalidateCache) {
        this.clearCache(endpoint);
      }
      
      return {
        data: response.ok ? (responseData as any as T) : null,
        error: response.ok ? null : new Error(responseData.error || 'Erro desconhecido'),
        status: response.status,
        message: response.ok ? 'Sucesso' : responseData.error || 'Erro na requisição',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        status: 500,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * Realiza uma requisição PUT
   * @param endpoint Endpoint da API
   * @param data Dados a serem enviados
   * @param token Token de autenticação
   * @param invalidateCache Se deve invalidar o cache para este endpoint
   */
  async put<T>(
    endpoint: string,
    data: Record<string, any> = {},
    token: string | null,
    invalidateCache = true
  ): Promise<ApiResponse<T>> {
    try {
      // Realizar requisição
      const response = await fetchWithAuth(
        endpoint,
        {
          method: 'PUT',
          body: JSON.stringify(data)
        },
        token
      );
      
      // Processar resposta
      const responseData: any = await response.json();
      
      // Invalidar cache relacionado se necessário
      if (invalidateCache) {
        this.clearCache(endpoint);
      }
      
      return {
        data: response.ok ? (responseData as any as T) : null,
        error: response.ok ? null : new Error(responseData.error || 'Erro desconhecido'),
        status: response.status,
        message: response.ok ? 'Sucesso' : responseData.error || 'Erro na requisição',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        status: 500,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * Realiza uma requisição DELETE
   * @param endpoint Endpoint da API
   * @param token Token de autenticação
   * @param invalidateCache Se deve invalidar o cache para este endpoint
   */
  async delete<T>(
    endpoint: string,
    token: string | null,
    invalidateCache = true
  ): Promise<ApiResponse<T>> {
    try {
      // Realizar requisição
      const response = await fetchWithAuth(
        endpoint,
        { method: 'DELETE' },
        token
      );
      
      // Processar resposta
      const responseData: any = await response.json();
      
      // Invalidar cache relacionado se necessário
      if (invalidateCache) {
        this.clearCache(endpoint);
      }
      
      return {
        data: response.ok ? (responseData as any as T) : null,
        error: response.ok ? null : new Error(responseData.error || 'Erro desconhecido'),
        status: response.status,
        message: response.ok ? 'Sucesso' : responseData.error || 'Erro na requisição',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        status: 500,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * Limpa o cache para um endpoint específico
   * @param endpoint Endpoint para limpar o cache
   */
  clearCache(endpoint: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of apiCache.keys()) {
      if (key.startsWith(endpoint)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => apiCache.delete(key));
  },
  
  /**
   * Limpa todo o cache
   */
  clearAllCache(): void {
    apiCache.clear();
  },
  
  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: apiCache.size,
      keys: Array.from(apiCache.keys())
    };
  }
};

// Exportação padrão
export default apiClient;

