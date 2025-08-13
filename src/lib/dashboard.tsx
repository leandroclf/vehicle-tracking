'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDbPool } from '@/lib/database';

// Definição dos tipos para estatísticas do dashboard
export interface DashboardStatistics {
  vehicle_count: number;
  active_vehicles: number;
  total_distance: number;
  alerts_count: number;
  fuel_consumption: number;
  period: 'today' | 'week' | 'month';
}

// Definição do tipo para widget do dashboard
export interface DashboardWidget {
  id: string;
  type: 'vehicle_count' | 'active_vehicles' | 'total_distance' | 'alerts' | 'fuel' | 'custom';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  config?: Record<string, any>;
}

// Definição do contexto de dashboard
interface DashboardContextType {
  statistics: DashboardStatistics | null;
  widgets: DashboardWidget[];
  isLoading: boolean;
  error: string | null;
  fetchStatistics: (period: 'today' | 'week' | 'month') => Promise<void>;
  saveWidgetConfiguration: (widgets: DashboardWidget[]) => Promise<boolean>;
  resetWidgetConfiguration: () => Promise<boolean>;
}

// Valor padrão do contexto
const defaultContextValue: DashboardContextType = {
  statistics: null,
  widgets: [],
  isLoading: false,
  error: null,
  fetchStatistics: async () => {},
  saveWidgetConfiguration: async () => false,
  resetWidgetConfiguration: async () => false,
};

// Criação do contexto
const DashboardContext = createContext<DashboardContextType>(defaultContextValue);

// Hook para usar o contexto
export const useDashboard = () => useContext(DashboardContext);

// Provedor do contexto
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar configuração de widgets ao iniciar
  useEffect(() => {
    loadWidgetConfiguration();
  }, []);

  // Função para buscar estatísticas
  const fetchStatistics = async (period: 'today' | 'week' | 'month' = 'today') => {
    try {
      setIsLoading(true);
      setError(null);

      const pool = getDbPool();
      const { data: session } = await // TODO: Implementar autenticação JWT // getSession();

      if (!session?.session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(`/api/dashboard/statistics?period=${period}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas');
      }

      const data = await response.json();
      setStatistics({
        ...data,
        period,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar configuração de widgets
  const loadWidgetConfiguration = async () => {
    try {
      setIsLoading(true);
      
      const pool = getDbPool();
      const { data: session } = await // TODO: Implementar autenticação JWT // getSession();

      if (!session?.session) {
        throw new Error('Sessão não encontrada');
      }

      // TODO: Implementar query SQL direta
    const data = null; const error = null; // await pool.query(...)
        .from('user_settings')
        .select('dashboard_widgets')
        .eq('user_id', session.session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
        throw error;
      }

      // Se não encontrar configuração, usar padrão
      if (!data || !data.dashboard_widgets) {
        setWidgets(getDefaultWidgets());
        return;
      }

      setWidgets(data.dashboard_widgets);
    } catch (err) {
      console.error('Erro ao carregar configuração de widgets:', err);
      setWidgets(getDefaultWidgets());
    } finally {
      setIsLoading(false);
    }
  };

  // Função para salvar configuração de widgets
  const saveWidgetConfiguration = async (updatedWidgets: DashboardWidget[]): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const pool = getDbPool();
      const { data: session } = await // TODO: Implementar autenticação JWT // getSession();

      if (!session?.session) {
        throw new Error('Sessão não encontrada');
      }

      // TODO: Implementar query SQL direta
    const error = null; // await pool.query(...)
        .from('user_settings')
        .upsert({
          user_id: session.session.user.id,
          dashboard_widgets: updatedWidgets,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      setWidgets(updatedWidgets);
      return true;
    } catch (err) {
      console.error('Erro ao salvar configuração de widgets:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para resetar configuração de widgets
  const resetWidgetConfiguration = async (): Promise<boolean> => {
    const defaultWidgets = getDefaultWidgets();
    return await saveWidgetConfiguration(defaultWidgets);
  };

  // Função para obter widgets padrão
  const getDefaultWidgets = (): DashboardWidget[] => {
    return [
      {
        id: 'vehicle-count',
        type: 'vehicle_count',
        title: 'Total de Veículos',
        size: 'small',
        position: 0,
      },
      {
        id: 'active-vehicles',
        type: 'active_vehicles',
        title: 'Veículos Ativos',
        size: 'small',
        position: 1,
      },
      {
        id: 'total-distance',
        type: 'total_distance',
        title: 'Distância Total',
        size: 'medium',
        position: 2,
      },
      {
        id: 'alerts',
        type: 'alerts',
        title: 'Alertas',
        size: 'medium',
        position: 3,
      },
      {
        id: 'fuel',
        type: 'fuel',
        title: 'Consumo de Combustível',
        size: 'small',
        position: 4,
      },
    ];
  };

  return (
    <DashboardContext.Provider
      value={{
        statistics,
        widgets,
        isLoading,
        error,
        fetchStatistics,
        saveWidgetConfiguration,
        resetWidgetConfiguration,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}