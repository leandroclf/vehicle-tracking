'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  const [error, setError] = useState('');
  
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      
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
              >
                <option value="">Selecione um tipo</option>
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
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
                onChange={handleVehicleSelection}
                value={selectedVehicles}
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.model}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Pressione Ctrl para selecionar múltiplos veículos</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setReportType('');
                  setStartDate('');
                  setEndDate('');
                  setSelectedVehicles([]);
                  setError('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Processando...' : 'Gerar'}
              </Button>
            </div>
          </form>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Relatórios Recentes</h2>
          {loading ? (
            <p className="text-center py-4">Carregando...</p>
          ) : reports.length === 0 ? (
            <p className="text-center py-4">Nenhum relatório encontrado</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border-b pb-3">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{getReportTypeName(report.report_type)}</h3>
                    <span className="text-sm text-gray-500">{formatDate(report.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {report.vehicle_ids.length} veículo(s) • {formatDate(report.start_date)} - {formatDate(report.end_date)}
                  </p>
                  <div className="flex mt-2">
                    {report.status === 'completed' ? (
                      <>
                        <a 
                          href={report.file_url} 
                          className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Baixar PDF
                        </a>
                        <a 
                          href={report.file_url?.replace('.pdf', '.csv')} 
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Baixar CSV
                        </a>
                      </>
                    ) : (
                      <span className="text-sm text-amber-600">
                        {report.status === 'processing' ? 'Processando...' : 'Erro ao gerar'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {totalReports > limit && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={calculateTotalPages(totalReports, limit)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 