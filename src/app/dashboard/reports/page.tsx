'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import ReportDetails from '@/components/dashboard/ReportDetails';
import ReportSummary from '@/components/dashboard/ReportSummary';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Download, Eye, RefreshCw } from 'lucide-react';

interface Report {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: 'processing' | 'completed' | 'error';
  file_url?: string;
  created_at: string;
  vehicle_ids: string[];
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface ApiVehiclesResponse {
  vehicles: Vehicle[];
  error?: string;
}

interface ApiReportsResponse {
  reports: Report[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

interface ApiResponse {
  error?: string;
  message?: string;
  reportId?: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  const limit = 5;
  
  useEffect(() => {
    fetchVehicles();
    fetchReports();
  }, [currentPage]);
  
  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json() as ApiVehiclesResponse;
      
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
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const response = await fetch(`/api/reports?limit=${limit}&offset=${offset}`);
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
    
    if (!reportType || !startDate || !endDate || selectedVehicles.length === 0) {
      setError('Todos os campos são obrigatórios');
      setSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  
  const handleVehicleSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    setSelectedVehicles(options.map(option => option.value));
  };
  
  const getReportTypeName = (type: string): string => {
    const types: Record<string, string> = {
      'movement': 'Movimentação de Veículos',
      'stops': 'Paradas',
      'geofence': 'Violações de Geocerca',
      'speed': 'Excesso de Velocidade',
      'mileage': 'Quilometragem',
    };
    
    return types[type] || type;
  };
  
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const calculateTotalPages = (total: number, perPage: number): number => {
    return Math.ceil(total / perPage);
  };

  const handleDownload = (report: Report) => {
    const url = `/api/reports/${report.id}/download${reportFormat === 'excel' ? '?format=excel' : ''}`;
    window.open(url, '_blank');
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportFormat(e.target.value as 'pdf' | 'excel');
  };

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
  };

  const closeDetails = () => {
    setSelectedReport(null);
  };

  const refreshReports = () => {
    fetchReports();
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
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      
      {selectedReport ? (
        <div className="mb-6">
          <ReportDetails 
            report={selectedReport} 
            vehicles={vehicles} 
            onClose={closeDetails} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  <option value="movement">Movimentação de Veículos</option>
                  <option value="stops">Paradas</option>
                  <option value="geofence">Violações de Geocerca</option>
                  <option value="speed">Excesso de Velocidade</option>
                  <option value="mileage">Quilometragem</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="vehicles" className="block text-sm font-medium text-gray-700 mb-1">
                  Veículos
                </label>
                <select
                  id="vehicles"
                  multiple
                  value={selectedVehicles}
                  onChange={handleVehicleSelection}
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
                  Segure Ctrl (ou Cmd no Mac) para selecionar múltiplos veículos
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      defaultChecked
                      className="h-4 w-4 text-blue-600"
                      onChange={handleFormatChange}
                    />
                    <span className="ml-2">PDF</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      className="h-4 w-4 text-green-600"
                      onChange={handleFormatChange}
                    />
                    <span className="ml-2">Excel</span>
                  </label>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </form>
          </Card>
          
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