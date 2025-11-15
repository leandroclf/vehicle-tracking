/**
 * Hook para Dashboard Analytics
 * @description Hook personalizado para gerenciar dados e estado do dashboard analytics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FleetMetrics,
  UsageMetrics,
  SecurityMetrics,
  FinancialMetrics,
  AnalyticsInsight,
  AnalyticsAlert,
  DashboardConfig,
  AnalyticsApiResponse
} from '@/types/analytics';

interface AnalyticsData {
  fleet?: FleetMetrics;
  usage?: UsageMetrics;
  security?: SecurityMetrics;
  financial?: FinancialMetrics;
  insights?: AnalyticsInsight[];
  alerts?: AnalyticsAlert[];
}

interface UseAnalyticsDashboardOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  filters?: DashboardConfig['filters'];
}

interface UseAnalyticsDashboardReturn {
  data: AnalyticsData;
  config: DashboardConfig | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  filters: DashboardConfig['filters'];

  // Actions
  refreshData: () => Promise<void>;
  updateConfig: (config: DashboardConfig) => Promise<void>;
  exportData: (type: 'analytics' | 'raw_data' | 'report', format: 'csv' | 'excel' | 'json') => Promise<string>;
  checkAlerts: (thresholds: Record<string, number>) => Promise<AnalyticsAlert[]>;

  // State management
  setFilters: (filters: DashboardConfig['filters']) => void;
  setRefreshInterval: (interval: number) => void;
  toggleAutoRefresh: () => void;
}

const DEFAULT_FILTERS: DashboardConfig['filters'] = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    preset: 'month'
  },
  vehicles: [],
  drivers: [],
  routes: []
};

export function useAnalyticsDashboard(
  options: UseAnalyticsDashboardOptions = {}
): UseAnalyticsDashboardReturn {
  const {
    refreshInterval = 30000, // 30 segundos
    autoRefresh = true,
    filters: initialFilters
  } = options;

  // State
  const [data, setData] = useState<AnalyticsData>({});
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentFilters, setCurrentFilters] = useState<DashboardConfig['filters']>(() => initialFilters ?? DEFAULT_FILTERS);
  const [currentRefreshInterval, setCurrentRefreshInterval] = useState(refreshInterval);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Busca dados do dashboard
   */
  const fetchData = useCallback(async (type: string = 'all') => {
    try {
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const params = new URLSearchParams({ type });
      
      if (currentFilters) {
        params.append('filters', JSON.stringify(currentFilters));
      }

      const response = await fetch(`/api/analytics/metrics?${params}`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result: AnalyticsApiResponse<AnalyticsData> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      setData(prevData => ({ ...prevData, ...result.data }));
      setLastUpdated(new Date());
      setError(null);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Requisição cancelada, não é erro
      }
      
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [currentFilters]);

  /**
   * Busca configuração do dashboard
   */
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/dashboard/config');
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result: AnalyticsApiResponse<DashboardConfig> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      setConfig(result.data);

    } catch (err) {
      console.error('Erro ao buscar configuração do dashboard:', err);
      // Não definir erro aqui pois a configuração é opcional
    }
  }, []);

  /**
   * Atualiza dados do dashboard
   */
  const refreshData = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

  /**
   * Atualiza configuração do dashboard
   */
  const updateConfig = useCallback(async (newConfig: DashboardConfig) => {
    try {
      const response = await fetch('/api/analytics/dashboard/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result: AnalyticsApiResponse<DashboardConfig> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      setConfig(result.data);

    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
      throw err;
    }
  }, []);

  /**
   * Exporta dados
   */
  const exportData = useCallback(async (
    type: 'analytics' | 'raw_data' | 'report',
    format: 'csv' | 'excel' | 'json'
  ): Promise<string> => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          format,
          filters: currentFilters
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result: AnalyticsApiResponse<{ downloadUrl: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      return result.data.downloadUrl;

    } catch (err) {
      console.error('Erro ao exportar dados:', err);
      throw err;
    }
  }, [currentFilters]);

  /**
   * Verifica alertas
   */
  const checkAlerts = useCallback(async (thresholds: Record<string, number>): Promise<AnalyticsAlert[]> => {
    try {
      const response = await fetch('/api/analytics/alerts/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ thresholds })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result: AnalyticsApiResponse<{ alerts: AnalyticsAlert[] }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      return result.data.alerts;

    } catch (err) {
      console.error('Erro ao verificar alertas:', err);
      throw err;
    }
  }, []);

  /**
   * Define filtros
   */
  const setFilters = useCallback((filters: DashboardConfig['filters']) => {
    setCurrentFilters(filters ?? DEFAULT_FILTERS);
  }, []);

  /**
   * Define intervalo de refresh
   */
  const setRefreshInterval = useCallback((interval: number) => {
    setCurrentRefreshInterval(interval);
  }, []);

  /**
   * Toggle auto refresh
   */
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  // Effect para carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchData(),
        fetchConfig()
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, [fetchData, fetchConfig]);

  // Effect para auto refresh
  useEffect(() => {
    if (!isAutoRefreshEnabled || currentRefreshInterval <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchData();
    }, currentRefreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, currentRefreshInterval, fetchData]);

  // Effect para atualizar dados quando filtros mudam
  useEffect(() => {
    fetchData();
  }, [currentFilters, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    config,
    loading,
    error,
    lastUpdated,
    filters: currentFilters,
    refreshData,
    updateConfig,
    exportData,
    checkAlerts,
    setFilters,
    setRefreshInterval,
    toggleAutoRefresh
  };
}