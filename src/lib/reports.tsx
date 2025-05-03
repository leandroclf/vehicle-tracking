'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  reportType: 'movement' | 'stops' | 'geofence' | 'speed' | 'mileage' | 'consumption' | 'behavior' | 'efficiency' | 'custom';
  downloadUrl?: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6, para relatórios semanais
    dayOfMonth?: number; // 1-31, para relatórios mensais
    nextRunDate: string;
  };
  customFields?: string[]; // Para relatórios customizáveis
  customFilters?: {
    field: string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: string | number;
  }[];
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
    reportType: Report['reportType'];
    customFields?: string[];
    customFilters?: Report['customFilters'];
  }) => Promise<Report>;
  getVehicleReports: (vehicleId: number) => Report[];
  scheduleReport: (reportId: number, schedule: Report['schedule']) => Promise<void>;
  cancelSchedule: (reportId: number) => Promise<void>;
  deleteReport: (reportId: number) => Promise<void>;
  getReportTypes: () => { id: string; name: string }[];
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
    reportType: 'movement',
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
    reportType: 'mileage',
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
    reportType: 'geofence',
    downloadUrl: '#',
    schedule: {
      frequency: 'monthly',
      dayOfMonth: 1,
      nextRunDate: '2025-05-01T00:00:00'
    }
  },
  {
    id: 4,
    title: 'Relatório de Consumo de Combustível',
    vehicleId: 3,
    vehicleName: 'Fiat Strada',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    createdAt: '2025-04-01T09:15:00',
    format: 'PDF',
    status: 'completed',
    reportType: 'consumption',
    downloadUrl: '#'
  },
  {
    id: 5,
    title: 'Análise de Comportamento do Motorista',
    vehicleId: 1,
    vehicleName: 'Honda Civic',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    createdAt: '2025-04-01T09:15:00',
    format: 'PDF',
    status: 'completed',
    reportType: 'behavior',
    downloadUrl: '#'
  },
  {
    id: 6,
    title: 'Relatório de Eficiência Operacional',
    vehicleId: null,
    vehicleName: 'Todos os veículos',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    createdAt: '2025-04-01T09:15:00',
    format: 'Excel',
    status: 'completed',
    reportType: 'efficiency',
    downloadUrl: '#'
  },
  {
    id: 7,
    title: 'Relatório Customizado',
    vehicleId: 2,
    vehicleName: 'Toyota Corolla',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    createdAt: '2025-04-01T09:15:00',
    format: 'PDF',
    status: 'completed',
    reportType: 'custom',
    downloadUrl: '#',
    customFields: ['data', 'velocidade', 'rpm', 'temperatura_motor', 'consumo_instantaneo'],
    customFilters: [
      { field: 'velocidade', operator: 'gt', value: 80 },
      { field: 'temperatura_motor', operator: 'gte', value: 90 }
    ]
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

  // Verificar relatórios agendados
  useEffect(() => {
    const checkScheduledReports = () => {
      const now = new Date();
      
      // Verificar se algum relatório agendado precisa ser executado
      reports.forEach(report => {
        if (report.schedule && new Date(report.schedule.nextRunDate) <= now) {
          // Criar novo relatório baseado no agendamento
          generateReport({
            title: report.title,
            vehicleId: report.vehicleId,
            vehicleName: report.vehicleName,
            startDate: calculateStartDate(report.schedule.frequency),
            endDate: new Date().toISOString().split('T')[0],
            format: report.format,
            reportType: report.reportType,
            customFields: report.customFields,
            customFilters: report.customFilters
          });
          
          // Atualizar a data da próxima execução
          scheduleReport(report.id, {
            ...report.schedule,
            nextRunDate: calculateNextRunDate(report.schedule)
          });
        }
      });
    };
    
    // Verificar a cada 15 minutos
    const intervalId = setInterval(checkScheduledReports, 15 * 60 * 1000);
    
    // Verificar na inicialização
    checkScheduledReports();
    
    return () => clearInterval(intervalId);
  }, [reports]);

  // Calcular data de início com base na frequência
  const calculateStartDate = (frequency: 'daily' | 'weekly' | 'monthly'): string => {
    const today = new Date();
    let startDate = new Date();
    
    switch (frequency) {
      case 'daily':
        startDate.setDate(today.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(today.getMonth() - 1);
        break;
    }
    
    return startDate.toISOString().split('T')[0];
  };

  // Calcular próxima data de execução
  const calculateNextRunDate = (schedule: Report['schedule']): string => {
    if (!schedule) return '';
    
    const nextDate = new Date();
    
    switch (schedule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        if (schedule.dayOfWeek !== undefined) {
          // Ajustar para o dia da semana específico
          const currentDay = nextDate.getDay();
          const daysToAdd = (schedule.dayOfWeek - currentDay + 7) % 7;
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        }
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (schedule.dayOfMonth !== undefined) {
          // Ajustar para o dia do mês específico
          nextDate.setDate(Math.min(schedule.dayOfMonth, getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
        }
        break;
    }
    
    return nextDate.toISOString();
  };

  // Obter o número de dias em um mês
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Gerar novo relatório
  const generateReport = async (params: {
    title: string;
    vehicleId: number | null;
    vehicleName: string;
    startDate: string;
    endDate: string;
    format: 'PDF' | 'Excel';
    reportType: Report['reportType'];
    customFields?: string[];
    customFilters?: Report['customFilters'];
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

  // Agendar relatório periódico
  const scheduleReport = async (reportId: number, schedule: Report['schedule']): Promise<void> => {
    setIsLoading(true);
    try {
      // Em um cenário real, aqui chamaria a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId ? { ...report, schedule } : report
        )
      );
    } catch (error) {
      setError('Erro ao agendar relatório');
      console.error('Erro ao agendar relatório:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar agendamento
  const cancelSchedule = async (reportId: number): Promise<void> => {
    setIsLoading(true);
    try {
      // Em um cenário real, aqui chamaria a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId ? { ...report, schedule: undefined } : report
        )
      );
    } catch (error) {
      setError('Erro ao cancelar agendamento');
      console.error('Erro ao cancelar agendamento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir relatório
  const deleteReport = async (reportId: number): Promise<void> => {
    setIsLoading(true);
    try {
      // Em um cenário real, aqui chamaria a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReports(prevReports => 
        prevReports.filter(report => report.id !== reportId)
      );
    } catch (error) {
      setError('Erro ao excluir relatório');
      console.error('Erro ao excluir relatório:', error);
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

  // Obter tipos de relatório disponíveis
  const getReportTypes = () => {
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

  const value = {
    reports,
    isLoading,
    error,
    generateReport,
    getVehicleReports,
    scheduleReport,
    cancelSchedule,
    deleteReport,
    getReportTypes
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};
