'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Definição do tipo de relatório
export interface Report {
  id: number;
  title: string;
  vehicleId: number | null; // null para "todos os veículos"
  vehicleName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  format: 'PDF' | 'Excel';
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
}

// Definição do contexto de relatórios
interface ReportContextType {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  generateReport: (params: {
    title: string;
    vehicleId: number | null;
    vehicleName: string;
    startDate: string;
    endDate: string;
    format: 'PDF' | 'Excel';
  }) => Promise<Report>;
  getVehicleReports: (vehicleId: number) => Report[];
}

// Dados simulados de relatórios
const mockReports: Report[] = [
  {
    id: 1,
    title: 'Relatório de Rotas',
    vehicleId: 1,
    vehicleName: 'Honda Civic',
    startDate: '2025-04-15',
    endDate: '2025-04-22',
    createdAt: '2025-04-22T10:30:00',
    format: 'PDF',
    status: 'completed',
    downloadUrl: '#'
  },
  {
    id: 2,
    title: 'Relatório de Uso do Veículo',
    vehicleId: 2,
    vehicleName: 'Toyota Corolla',
    startDate: '2025-04-01',
    endDate: '2025-04-15',
    createdAt: '2025-04-15T14:45:00',
    format: 'Excel',
    status: 'completed',
    downloadUrl: '#'
  },
  {
    id: 3,
    title: 'Relatório de Eventos',
    vehicleId: null,
    vehicleName: 'Todos os veículos',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    createdAt: '2025-04-01T09:15:00',
    format: 'PDF',
    status: 'completed',
    downloadUrl: '#'
  }
];

// Criação do contexto
const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useReports = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports deve ser usado dentro de um ReportProvider');
  }
  return context;
};

// Provedor de relatórios
export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gerar novo relatório
  const generateReport = async (params: {
    title: string;
    vehicleId: number | null;
    vehicleName: string;
    startDate: string;
    endDate: string;
    format: 'PDF' | 'Excel';
  }): Promise<Report> => {
    setIsLoading(true);
    try {
      // Simulação de geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: Report = {
        id: reports.length + 1,
        ...params,
        createdAt: new Date().toISOString(),
        status: 'completed',
        downloadUrl: '#'
      };
      
      setReports(prevReports => [...prevReports, newReport]);
      return newReport;
    } catch (error) {
      setError('Erro ao gerar relatório');
      console.error('Erro ao gerar relatório:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Obter relatórios de um veículo específico
  const getVehicleReports = (vehicleId: number): Report[] => {
    return reports.filter(report => 
      report.vehicleId === vehicleId || report.vehicleId === null
    );
  };

  const value = {
    reports,
    isLoading,
    error,
    generateReport,
    getVehicleReports
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};
