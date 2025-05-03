'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { format, differenceInDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Report {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
  };
}

interface ReportsByType {
  name: string;
  count: number;
  color?: string;
}

interface ReportsByStatus {
  name: string;
  value: number;
  color: string;
}

interface ReportsBySchedule {
  name: string;
  value: number;
  color: string;
}

interface ReportSummaryProps {
  reports: Report[];
}

export default function ReportSummary({ reports }: ReportSummaryProps) {
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#F28D35', '#D0679D', '#7D8DE5', '#5A6ACF'
  ];
  
  const STATUS_COLORS = {
    'processing': '#FFBB28',
    'completed': '#00C49F',
    'error': '#FF8042'
  };
  
  const SCHEDULE_COLORS = {
    'scheduled': '#0088FE',
    'not_scheduled': '#D0679D'
  };

  const getReportsByType = (): ReportsByType[] => {
    const typeMap: Record<string, number> = {};
    const typeColorMap: Record<string, string> = {};
    const typeNameMap: Record<string, string> = {
      'movement': 'Movimentação',
      'stops': 'Paradas',
      'geofence': 'Geocercas',
      'speed': 'Velocidade',
      'mileage': 'Quilometragem',
      'consumption': 'Consumo',
      'behavior': 'Comportamento',
      'efficiency': 'Eficiência',
      'custom': 'Customizado'
    };
    
    reports.forEach((report, index) => {
      const type = report.report_type;
      typeMap[type] = (typeMap[type] || 0) + 1;
      
      // Atribuir uma cor consistente para cada tipo
      if (!typeColorMap[type]) {
        typeColorMap[type] = COLORS[Object.keys(typeColorMap).length % COLORS.length];
      }
    });
    
    return Object.entries(typeMap).map(([type, count], index) => ({
      name: typeNameMap[type] || type,
      count,
      color: typeColorMap[type]
    }));
  };
  
  const getReportsByStatus = (): ReportsByStatus[] => {
    const statusMap: Record<string, number> = {
      'processing': 0,
      'completed': 0,
      'error': 0
    };
    
    const statusNameMap: Record<string, string> = {
      'processing': 'Em Processamento',
      'completed': 'Concluídos',
      'error': 'Com Erro'
    };
    
    reports.forEach(report => {
      const status = report.status;
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    return Object.entries(statusMap).map(([status, count]) => ({
      name: statusNameMap[status] || status,
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#CCCCCC'
    }));
  };
  
  const getReportsByTimePeriod = () => {
    const periods: Record<string, number> = {
      '7d': 0,
      '30d': 0,
      '+30d': 0
    };
    
    reports.forEach(report => {
      const days = differenceInDays(
        parseISO(report.end_date),
        parseISO(report.start_date)
      );
      
      if (days <= 7) {
        periods['7d'] += 1;
      } else if (days <= 30) {
        periods['30d'] += 1;
      } else {
        periods['+30d'] += 1;
      }
    });
    
    return [
      { name: 'Até 7 dias', value: periods['7d'], color: '#0088FE' },
      { name: '8-30 dias', value: periods['30d'], color: '#00C49F' },
      { name: 'Mais de 30 dias', value: periods['+30d'], color: '#FFBB28' }
    ];
  };
  
  const getReportsBySchedule = (): ReportsBySchedule[] => {
    const scheduled = reports.filter(report => report.schedule).length;
    const notScheduled = reports.length - scheduled;
    
    return [
      { name: 'Agendados', value: scheduled, color: SCHEDULE_COLORS.scheduled },
      { name: 'Não Agendados', value: notScheduled, color: SCHEDULE_COLORS.not_scheduled }
    ];
  };
  
  const reportsByType = getReportsByType();
  const reportsByStatus = getReportsByStatus();
  const reportsByPeriod = getReportsByTimePeriod();
  const reportsBySchedule = getReportsBySchedule();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Relatórios por Tipo</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={reportsByType}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => [`${value} relatório(s)`, 'Quantidade']} />
              <Bar dataKey="count" name="Quantidade">
                {
                  reportsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Status dos Relatórios</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {reportsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} relatório(s)`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Períodos Analisados</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportsByPeriod}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {reportsByPeriod.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} relatório(s)`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Agendamento</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportsBySchedule}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {reportsBySchedule.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} relatório(s)`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 