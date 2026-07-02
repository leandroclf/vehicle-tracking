'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  nextRunDate?: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  vehicles: number[] | 'all';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  filters?: Record<string, any>;
  format: 'pdf' | 'csv' | 'xlsx';
  size?: number;
}

export interface ReportType {
  id: string;
  name: string;
}

interface ReportContextType {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  fetchReports: () => Promise<void>;
  getReport: (id: string) => Report | undefined;
  generateReport: (reportData: Omit<Report, 'id' | 'status' | 'createdAt' | 'downloadUrl'>) => Promise<Report | null>;
  downloadReport: (id: string) => Promise<string | null>;
  deleteReport: (id: string) => Promise<boolean>;
  getReportTypes: () => ReportType[];
  /** Agendamento de relatórios não é suportado no baseline de produção */
  scheduleReport: (id: number, schedule: ReportSchedule) => Promise<boolean>;
  cancelSchedule: (id: number) => Promise<boolean>;
}

// Valor padrão do contexto
const defaultContextValue: ReportContextType = {
  reports: [],
  isLoading: false,
  error: null,
  fetchReports: async () => {},
  getReport: () => undefined,
  generateReport: async () => null,
  downloadReport: async () => null,
  deleteReport: async () => false,
  getReportTypes: () => [],
  scheduleReport: async () => false,
  cancelSchedule: async () => false
};

// Criar o contexto
const ReportContext = createContext<ReportContextType>(defaultContextValue);

// Hook para usar o contexto
export const useReports = () => {
  const context = useContext(ReportContext);
  
  if (context === undefined) {
    throw new Error('useReports deve ser usado dentro de um ReportProvider');
  }
  
  return context;
};

// Provider de relatórios
export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar relatórios ao montar o componente
  useEffect(() => {
    fetchReports();
  }, []);

  // Buscar relatórios da API
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/reports?limit=100&offset=0', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao carregar relatórios');
      }

      const data = (await response.json()) as {
        reports: Array<{
          id: string;
          report_type: string;
          start_date: string;
          end_date: string;
          status: 'processing' | 'completed' | 'error';
          created_at: string;
          vehicle_ids: string[];
        }>;
      };

      const mapped: Report[] = (data.reports || []).map(item => ({
        id: item.id,
        title: `Relatório ${item.report_type}`,
        type: 'custom',
        startDate: item.start_date,
        endDate: item.end_date,
        vehicles: item.vehicle_ids.map(id => parseInt(id, 10)).filter(Number.isInteger),
        status: item.status === 'error' ? 'failed' : item.status === 'processing' ? 'processing' : 'completed',
        downloadUrl: `/api/reports/${item.id}/download`,
        createdAt: item.created_at,
        format: 'csv',
      }));

      setReports(mapped);
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err);
      setError('Falha ao carregar relatórios. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obter um relatório específico
  const getReport = (id: string): Report | undefined => {
    return reports.find(report => report.id === id);
  };

  // Obter tipos de relatórios disponíveis
  const getReportTypes = (): ReportType[] => {
    return [
      { id: 'movement', name: 'Movimentação de Veículos' },
      { id: 'stops', name: 'Paradas' },
      { id: 'geofence', name: 'Violações de Geocerca' },
      { id: 'speed', name: 'Excesso de Velocidade' },
      { id: 'mileage', name: 'Quilometragem' },
      { id: 'consumption', name: 'Consumo de Combustível' },
      { id: 'behavior', name: 'Comportamento do Motorista' },
      { id: 'efficiency', name: 'Eficiência Operacional' },
      { id: 'custom', name: 'Relatório Customizado' }
    ];
  };

  // Gerar um novo relatório (síncrono na API)
  const generateReport = async (reportData: Omit<Report, 'id' | 'status' | 'createdAt' | 'downloadUrl'>): Promise<Report | null> => {
    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reportType: reportData.type,
          startDate: reportData.startDate,
          endDate: reportData.endDate,
          vehicleIds: reportData.vehicles === 'all' ? [] : reportData.vehicles,
          format: reportData.format,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao gerar relatório');
      }

      await fetchReports();
      const data = (await response.json().catch(() => null)) as { report?: { id: string } } | null;
      return data?.report ? reports.find(r => r.id === data.report!.id) ?? null : null;
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError(err instanceof Error ? err.message : 'Falha ao gerar relatório. Tente novamente mais tarde.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Baixar um relatório
  const downloadReport = async (id: string): Promise<string | null> => {
    const report = reports.find(r => r.id === id);
    
    if (!report || report.status !== 'completed' || !report.downloadUrl) {
      return null;
    }
    
    return report.downloadUrl;
  };

  // Excluir um relatório — sem suporte de backend no baseline
  const deleteReport = async (): Promise<boolean> => {
    setError('Exclusão de relatórios não é suportada nesta versão.');
    return false;
  };

  // Agendamento não tem suporte de backend no baseline de produção:
  // as operações falham de forma explícita em vez de fingir sucesso.
  const scheduleReport = async (): Promise<boolean> => {
    setError('Agendamento de relatórios não é suportado nesta versão.');
    return false;
  };

  const cancelSchedule = async (): Promise<boolean> => {
    setError('Agendamento de relatórios não é suportado nesta versão.');
    return false;
  };

  // Valor do contexto
  const value: ReportContextType = {
    reports,
    isLoading,
    error,
    fetchReports,
    getReport,
    generateReport,
    downloadReport,
    deleteReport,
    getReportTypes,
    scheduleReport,
    cancelSchedule
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
}

export default ReportProvider;
