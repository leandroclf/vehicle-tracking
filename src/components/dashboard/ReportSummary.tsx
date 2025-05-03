'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { format, differenceInDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Report {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
}

interface ReportsByType {
  name: string;
  count: number;
}

interface ReportSummaryProps {
  reports: Report[];
}

export default function ReportSummary({ reports }: ReportSummaryProps) {
  const getReportsByType = (): ReportsByType[] => {
    const typeMap: Record<string, number> = {};
    const typeNameMap: Record<string, string> = {
      'movement': 'Movimentação',
      'stops': 'Paradas',
      'geofence': 'Geocercas',
      'speed': 'Velocidade',
      'mileage': 'Quilometragem'
    };
    
    reports.forEach(report => {
      const type = report.report_type;
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    
    return Object.entries(typeMap).map(([type, count]) => ({
      name: typeNameMap[type] || type,
      count
    }));
  };
  
  const getReportsByStatus = () => {
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
      value: count
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
      { name: 'Até 7 dias', value: periods['7d'] },
      { name: '8-30 dias', value: periods['30d'] },
      { name: 'Mais de 30 dias', value: periods['+30d'] }
    ];
  };
  
  const reportsByType = getReportsByType();
  const reportsByStatus = getReportsByStatus();
  const reportsByPeriod = getReportsByTimePeriod();
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS: Record<string, string> = {
    'Em Processamento': '#FFBB28', // amarelo
    'Concluídos': '#00C49F',       // verde
    'Com Erro': '#FF8042'          // laranja
  };
  
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Resumo de Relatórios</h2>
      
      {reports.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Nenhum relatório gerado ainda.</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium mb-2">Por Tipo</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportsByType}
                  margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Por Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportsByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} relatório(s)`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Por Período</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportsByPeriod}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportsByPeriod.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} relatório(s)`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 