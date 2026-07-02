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
      // Simulação de uma chamada API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dados simulados de relatórios
      const mockReports: Report[] = [
        {
          id: '1',
          title: 'Relatório diário de atividades',
          type: 'daily',
          startDate: '2025-04-26T00:00:00Z',
          endDate: '2025-04-26T23:59:59Z',
          vehicles: [1, 2, 3],
          status: 'completed',
          downloadUrl: '/api/reports/1/download',
          createdAt: '2025-04-27T08:30:00Z',
          format: 'pdf',
          size: 1250000
        },
        {
          id: '2',
          title: 'Relatório semanal de atividades',
          type: 'weekly',
          startDate: '2025-04-20T00:00:00Z',
          endDate: '2025-04-26T23:59:59Z',
          vehicles: 'all',
          status: 'completed',
          downloadUrl: '/api/reports/2/download',
          createdAt: '2025-04-27T07:15:00Z',
          format: 'xlsx',
          size: 3540000
        },
        {
          id: '3',
          title: 'Relatório personalizado',
          type: 'custom',
          startDate: '2025-04-01T00:00:00Z',
          endDate: '2025-04-26T23:59:59Z',
          vehicles: [1],
          status: 'processing',
          createdAt: '2025-04-27T09:45:00Z',
          format: 'csv'
        }
      ];
      
      setReports(mockReports);
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

  // Gerar um novo relatório
  const generateReport = async (reportData: Omit<Report, 'id' | 'status' | 'createdAt' | 'downloadUrl'>): Promise<Report | null> => {
    setIsLoading(true);
    
    try {
      // Simulação de uma chamada API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Criar novo relatório
      const newReport: Report = {
        ...reportData,
        id: `report-${Date.now()}`,
        status: 'processing',
        createdAt: new Date().toISOString()
      };
      
      setReports(prev => [...prev, newReport]);
      
      // Simular processamento do relatório
      setTimeout(() => {
        setReports(prev => 
          prev.map(report => 
            report.id === newReport.id
              ? { 
                  ...report, 
                  status: 'completed',
                  downloadUrl: `/api/reports/${newReport.id}/download`
                }
              : report
          )
        );
      }, 5000);
      
      return newReport;
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError('Falha ao gerar relatório. Tente novamente mais tarde.');
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
    
    try {
      // Simulação do download
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return report.downloadUrl;
    } catch (err) {
      console.error('Erro ao baixar relatório:', err);
      return null;
    }
  };

  // Excluir um relatório
  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      // Simulação de uma chamada API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReports(prev => prev.filter(report => report.id !== id));
      return true;
    } catch (err) {
      console.error('Erro ao excluir relatório:', err);
      return false;
    }
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
