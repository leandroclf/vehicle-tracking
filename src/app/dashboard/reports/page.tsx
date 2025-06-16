'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Table } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Eye, Download, RefreshCw, Plus, Calendar, ListFilter } from 'lucide-react';
import { useReports } from '@/lib/reports';
import ReportDetails from '@/components/dashboard/ReportDetails';
import ReportSummary from '@/components/dashboard/ReportSummary';
import CustomReportForm from '@/components/dashboard/CustomReportForm';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface Report {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
  vehicle_ids: string[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    nextRunDate: string;
  };
  custom_fields?: string[];
  custom_filters?: {
    field: string;
    operator: string;
    value: string | number;
  }[];
}

interface ApiResponse {
  message?: string;
  error?: string;
}

interface ApiReportsResponse extends ApiResponse {
  reports?: Report[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
};

const getReportTypeName = (type: string) => {
  const types: Record<string, string> = {
    'movement': 'Movimentação de Veículos',
    'stops': 'Paradas',
    'geofence': 'Violações de Geocerca',
    'speed': 'Excesso de Velocidade',
    'mileage': 'Quilometragem',
    'consumption': 'Consumo de Combustível',
    'behavior': 'Comportamento do Motorista',
    'efficiency': 'Eficiência Operacional',
    'custom': 'Relatório Customizado'
  };
  
  return types[type] || type;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const { getReportTypes } = useReports();
  const { token } = useAuth();
  
  const limit = 10;
  
  useEffect(() => {
    fetchVehicles();
    fetchReports();
  }, [currentPage, token]);
  
  const fetchVehicles = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json() as { vehicles: Vehicle[], error?: string };
      
      if (response.ok) {
        setVehicles(data.vehicles || []);
      } else {
        console.error('Erro ao buscar veículos:', data.error);
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  };
  
  const fetchReports = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const response = await fetch(`/api/reports?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json() as ApiReportsResponse;
      
      if (response.ok) {
        setReports(data.reports || []);
        setTotalReports(data.pagination?.total || 0);
      } else {
        setError(data.error || 'Erro ao buscar relatórios');
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      setError('Erro ao buscar relatórios. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    if (!reportType || !startDate || !endDate || selectedVehicles.length === 0 || !token) {
      setError('Todos os campos são obrigatórios');
      setSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType,
          startDate,
          endDate,
          vehicleIds: selectedVehicles,
          format: reportFormat
        }),
      });
      
      const data = await response.json() as ApiResponse;
      
      if (response.ok) {
        toast.success('Relatório solicitado com sucesso');
        setReportType('');
        setStartDate('');
        setEndDate('');
        setSelectedVehicles([]);
        fetchReports();
      } else {
        setError(data.error || 'Erro ao solicitar relatório');
      }
    } catch (error) {
      console.error('Erro ao solicitar relatório:', error);
      setError('Erro ao solicitar relatório. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
  };
  
  const closeDetails = () => {
    setSelectedReport(null);
    fetchReports(); // Recarregar lista em caso de alterações
  };
  
  const handleDownload = (report: Report) => {
    window.open(`/api/reports/${report.id}/download?format=${reportFormat}`, '_blank');
  };
  
  const refreshReports = () => {
    fetchReports();
  };
  
  const calculateTotalPages = (total: number, itemsPerPage: number) => {
    return Math.ceil(total / itemsPerPage);
  };
  
  const handleCustomReportSubmit = async (data: {
    title: string;
    vehicleIds: string[];
    startDate: string;
    endDate: string;
    format: 'PDF' | 'Excel';
    customFields: string[];
    customFilters: {
      field: string;
      operator: string;
      value: string | number;
    }[];
  }) => {
    if (!token) {
      setError('Usuário não autenticado');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: data.title,
          vehicleIds: data.vehicleIds,
          startDate: data.startDate,
          endDate: data.endDate,
          format: data.format.toLowerCase(),
          customFields: data.customFields,
          customFilters: data.customFilters,
          reportType: 'custom'
        }),
      });
      
      const responseData = await response.json() as ApiResponse;
      
      if (response.ok) {
        toast.success('Relatório customizado solicitado com sucesso');
        setShowCustomForm(false);
        fetchReports();
      } else {
        setError(responseData.error || 'Erro ao solicitar relatório customizado');
      }
    } catch (error) {
      console.error('Erro ao solicitar relatório customizado:', error);
      setError('Erro ao solicitar relatório customizado. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  // Colunas para a tabela de relatórios
  const columns = [
    {
      header: 'Tipo',
      accessor: (report: Report) => getReportTypeName(report.report_type)
    },
    {
      header: 'Período',
      accessor: (report: Report) => (
        `${formatDate(report.start_date)} - ${formatDate(report.end_date)}`
      )
    },
    {
      header: 'Status',
      accessor: (report: Report) => (
        <span className={
          report.status === 'processing' ? 'text-yellow-500' :
          report.status === 'completed' ? 'text-green-500' :
          'text-red-500'
        }>
          {report.status === 'processing' && 'Em processamento'}
          {report.status === 'completed' && 'Concluído'}
          {report.status === 'error' && 'Erro'}
        </span>
      )
    },
    {
      header: 'Agendamento',
      accessor: (report: Report) => (
        <span>
          {report.schedule ? (
            <Calendar size={16} className="text-blue-500" />
          ) : null}
        </span>
      )
    },
    {
      header: 'Ações',
      accessor: (report: Report) => (
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handleViewDetails(report)}
          >
            <Eye size={14} />
            Ver
          </Button>
          
          {report.status === 'completed' && (
            <Button 
              variant="secondary" 
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleDownload(report)}
            >
              <Download size={14} />
              Download
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Relatórios</h1>
      
      {selectedReport ? (
        <div className="mb-6">
          <ReportDetails 
            report={selectedReport} 
            vehicles={vehicles} 
            onClose={closeDetails} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">Novo Relatório</h2>
            <div className="flex gap-2">
              <Button 
                variant={showCustomForm ? "primary" : "secondary"}
                className="flex items-center gap-1"
                onClick={() => setShowCustomForm(false)}
              >
                <ListFilter size={16} />
                Relatório Padrão
              </Button>
              <Button 
                variant={showCustomForm ? "secondary" : "primary"}
                className="flex items-center gap-1"
                onClick={() => setShowCustomForm(true)}
              >
                <Plus size={16} />
                Relatório Customizado
              </Button>
            </div>
          </div>
          
          {showCustomForm ? (
            <CustomReportForm
              vehicles={vehicles}
              onSubmit={handleCustomReportSubmit}
              isSubmitting={submitting}
            />
          ) : (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Gerar Relatório</h2>
              {error && <Alert className="mb-4" variant="error">{error}</Alert>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Relatório
                  </label>
                  <select
                    id="reportType"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={submitting}
                  >
                    <option value="">Selecione o tipo</option>
                    {getReportTypes().filter(type => type.id !== 'custom').map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

              <div className="mb-4">
                <label htmlFor="vehicleIds" className="block text-sm font-medium text-gray-700 mb-1">
                  Veículos
                </label>
                <select
                  id="vehicleIds"
                  multiple
                  value={selectedVehicles}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions,
                      option => option.value
                    );
                    setSelectedVehicles(values);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
                  disabled={submitting}
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} ({vehicle.plate})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Segure Ctrl para selecionar múltiplos veículos
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={reportFormat === 'pdf'}
                      onChange={() => setReportFormat('pdf')}
                      className="h-4 w-4 text-blue-600"
                      disabled={submitting}
                    />
                    <span className="ml-2">PDF</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      checked={reportFormat === 'excel'}
                      onChange={() => setReportFormat('excel')}
                      className="h-4 w-4 text-green-600"
                      disabled={submitting}
                    />
                    <span className="ml-2">Excel</span>
                  </label>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1"
                >
                  {submitting ? 'Processando...' : 'Gerar Relatório'}
                </Button>
              </div>
              </form>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Relatórios Recentes</h2>
              <Button 
                variant="secondary" 
                className="flex items-center gap-1"
                onClick={refreshReports}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Atualizar
              </Button>
            </div>
            
            {loading ? (
              <div className="py-4 text-center">Carregando...</div>
            ) : (
              <div>
                <Table
                  data={reports}
                  columns={columns}
                  isLoading={loading}
                  emptyMessage="Nenhum relatório encontrado"
                />
                
                {totalReports > limit && (
                  <div className="mt-4">
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={calculateTotalPages(totalReports, limit)}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
      
      {reports.length > 0 && !selectedReport && (
        <div className="mt-6">
          <ReportSummary reports={reports} />
        </div>
      )}
    </div>
  );
} 