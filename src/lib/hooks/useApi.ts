import { useState, useCallback } from 'react';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import { useAuth } from '@/lib/auth';

/**
 * Hook personalizado para integrar as APIs com o sistema de notificações
 * Inclui tratamento de erros, estado de carregamento e notificações automáticas
 */
export function useApi<T>() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  /**
   * Função para exibir notificações de erro
   */
  const showErrorNotification = useCallback((message: string) => {
    addNotification({
      type: 'alert',
      title: 'Erro',
      message
    });
  }, [addNotification]);

  /**
   * Função para exibir notificações de sucesso
   */
  const showSuccessNotification = useCallback((message: string) => {
    addNotification({
      type: 'info',
      title: 'Sucesso',
      message
    });
  }, [addNotification]);

  /**
   * Wrapper para requisição GET com tratamento de erros e notificações
   */
  const get = useCallback(async (
    endpoint: string,
    params: Record<string, any> = {},
    useCache = true,
    showNotificationOnError = true,
    cacheExpiry?: number
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<T>(endpoint, params, useCache, cacheExpiry);

      if (response.error && showNotificationOnError) {
        showErrorNotification(response.message);
        setError(response.error);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      
      if (showNotificationOnError) {
        showErrorNotification(error.message);
      }
      
      return {
        data: null,
        error,
        status: 500,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      setLoading(false);
    }
  }, [showErrorNotification]);

  /**
   * Wrapper para requisição POST com tratamento de erros e notificações
   */
  const post = useCallback(async (
    endpoint: string,
    data: Record<string, any> = {},
    showSuccessMsg = false,
    successMessage = 'Operação realizada com sucesso',
    invalidateCache = true
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<T>(endpoint, data, invalidateCache);

      if (response.error) {
        showErrorNotification(response.message);
        setError(response.error);
      } else if (showSuccessMsg) {
        showSuccessNotification(successMessage);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      showErrorNotification(error.message);
      
      return {
        data: null,
        error,
        status: 500,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      setLoading(false);
    }
  }, [showErrorNotification, showSuccessNotification]);

  /**
   * Wrapper para requisição PUT com tratamento de erros e notificações
   */
  const put = useCallback(async (
    endpoint: string,
    data: Record<string, any> = {},
    showSuccessMsg = false,
    successMessage = 'Atualização realizada com sucesso',
    invalidateCache = true
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<T>(endpoint, data, invalidateCache);

      if (response.error) {
        showErrorNotification(response.message);
        setError(response.error);
      } else if (showSuccessMsg) {
        showSuccessNotification(successMessage);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      showErrorNotification(error.message);
      
      return {
        data: null,
        error,
        status: 500,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      setLoading(false);
    }
  }, [showErrorNotification, showSuccessNotification]);

  /**
   * Wrapper para requisição DELETE com tratamento de erros e notificações
   */
  const del = useCallback(async (
    endpoint: string,
    params: Record<string, any> = {},
    showSuccessMsg = false,
    successMessage = 'Item excluído com sucesso',
    invalidateCache = true
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete<T>(endpoint, params, invalidateCache);

      if (response.error) {
        showErrorNotification(response.message);
        setError(response.error);
      } else if (showSuccessMsg) {
        showSuccessNotification(successMessage);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      showErrorNotification(error.message);
      
      return {
        data: null,
        error,
        status: 500,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      setLoading(false);
    }
  }, [showErrorNotification, showSuccessNotification]);

  /**
   * Limpar o cache para um endpoint específico ou todo o cache
   */
  const clearCache = useCallback((endpoint?: string): void => {
    apiClient.clearCache(endpoint);
  }, []);

  return {
    get,
    post,
    put,
    delete: del,
    clearCache,
    loading,
    error,
    isAuthenticated: !!user,
    showErrorNotification,
    showSuccessNotification
  };
}

export default useApi;