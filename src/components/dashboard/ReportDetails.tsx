'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExternalLink, Download, AlertCircle, CheckCircle, Clock, Calendar, XCircle } from 'lucide-react';
import { useReports } from '@/lib/reports';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Report {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: 'processing' | 'completed' | 'error';
  file_url?: string;
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

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface ReportDetailsProps {
  report: Report;
  vehicles: Vehicle[];
  onClose: () => void;
}

export default function ReportDetails({ report, vehicles, onClose }: ReportDetailsProps) {
  const { scheduleReport, cancelSchedule } = useReports();
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'excel'>('pdf');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Segunda-feira
  const [dayOfMonth, setDayOfMonth] = useState(1); // 1º dia do mês

  const getReportTypeName = (type: string): string => {
    const types: Record<string, string> = {
      'movement': 'Movimentação de Veículos',
      'stops': 'Paradas',
      'geofence': 'Violações de Geocerca',
      'speed': 'Excesso de Velocidade',
      'mileage': 'Quilometragem',
      'consumption': 'Consumo de Combustível',
      'behavior': 'Comportamento do Motorista',
      'efficiency': 'Eficiência Operacional',
      'custom': 'Relatório Customizado',
    };
    
    return types[type] || type;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getVehicleName = (id: string): string => {
    const vehicle = vehicles.find(v => v.id === id);
    return vehicle ? `${vehicle.model} (${vehicle.plate})` : id;
  };

  const getStatusIcon = () => {
    switch (report.status) {
      case 'processing':
        return <Clock className="text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="text-green-500" />;
      case 'error':
        return <AlertCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  const handleDownload = () => {
    const url = `/api/reports/${report.id}/download${downloadFormat === 'excel' ? '?format=excel' : ''}`;
    window.open(url, '_blank');
  };

  const handleSchedule = async () => {
    try {
      const today = new Date();
      let nextRunDate = new Date();
      
      switch (scheduleFrequency) {
        case 'daily':
          nextRunDate.setDate(today.getDate() + 1);
          break;
        case 'weekly':
          const targetDay = dayOfWeek;
          const currentDay = today.getDay();
          const daysToAdd = (targetDay - currentDay + 7) % 7;
          nextRunDate.setDate(today.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
          break;
        case 'monthly':
          nextRunDate.setMonth(today.getMonth() + 1);
          nextRunDate.setDate(dayOfMonth);
          // Verificar se o dia é válido no próximo mês
          if (nextRunDate.getDate() !== dayOfMonth) {
            // Se não for, voltar para o último dia do mês
            nextRunDate.setDate(0);
          }
          break;
      }
      
      const schedule = {
        frequency: scheduleFrequency,
        ...(scheduleFrequency === 'weekly' && { dayOfWeek }),
        ...(scheduleFrequency === 'monthly' && { dayOfMonth }),
        nextRunDate: nextRunDate.toISOString()
      };
      
      await scheduleReport(parseInt(report.id), schedule);
      setShowScheduleForm(false);
    } catch (error) {
      console.error('Erro ao agendar relatório:', error);
    }
  };

  const handleCancelSchedule = async () => {
    try {
      await cancelSchedule(parseInt(report.id));
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  const renderWeekDaySelector = () => {
    const weekDays = [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Segunda-feira' },
      { value: 2, label: 'Terça-feira' },
      { value: 3, label: 'Quarta-feira' },
      { value: 4, label: 'Quinta-feira' },
      { value: 5, label: 'Sexta-feira' },
      { value: 6, label: 'Sábado' }
    ];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Dia da semana</label>
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
          className="w-full rounded-md border border-gray-300 p-2"
        >
          {weekDays.map(day => (
            <option key={day.value} value={day.value}>{day.label}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderMonthDaySelector = () => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Dia do mês</label>
        <select
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
          className="w-full rounded-md border border-gray-300 p-2"
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderScheduleForm = () => {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-4">Agendar Relatório</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Frequência</label>
          <select
            value={scheduleFrequency}
            onChange={(e) => setScheduleFrequency(e.target.value as any)}
            className="w-full rounded-md border border-gray-300 p-2"
          >
            <option value="daily">Diariamente</option>
            <option value="weekly">Semanalmente</option>
            <option value="monthly">Mensalmente</option>
          </select>
        </div>
        
        {scheduleFrequency === 'weekly' && renderWeekDaySelector()}
        {scheduleFrequency === 'monthly' && renderMonthDaySelector()}
        
        <div className="flex space-x-2 mt-4">
          <Button onClick={handleSchedule}>Confirmar Agendamento</Button>
          <Button variant="secondary" onClick={() => setShowScheduleForm(false)}>Cancelar</Button>
        </div>
      </div>
    );
  };

  const renderScheduleInfo = () => {
    if (!report.schedule) return null;
    
    const nextRun = formatDateTime(report.schedule.nextRunDate);
    let frequencyText = 'Diariamente';
    
    if (report.schedule.frequency === 'weekly') {
      const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const day = report.schedule.dayOfWeek !== undefined ? weekDays[report.schedule.dayOfWeek] : 'Semanalmente';
      frequencyText = `Semanalmente (${day})`;
    } else if (report.schedule.frequency === 'monthly') {
      const day = report.schedule.dayOfMonth || 1;
      frequencyText = `Mensalmente (Dia ${day})`;
    }
    
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold flex items-center gap-1 mb-2">
              <Calendar size={16} className="text-blue-500" /> 
              Relatório Agendado
            </h3>
            <p className="text-sm">Frequência: {frequencyText}</p>
            <p className="text-sm">Próxima execução: {nextRun}</p>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleCancelSchedule}
          >
            <XCircle size={14} />
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  const renderCustomFields = () => {
    if (!report.custom_fields || report.custom_fields.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Campos Customizados</h3>
        <div className="bg-gray-50 p-3 rounded-md">
          {report.custom_fields.map((field, index) => (
            <div key={index} className="mb-1 last:mb-0">
              {field}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomFilters = () => {
    if (!report.custom_filters || report.custom_filters.length === 0) return null;
    
    const getOperatorLabel = (op: string) => {
      const operators: Record<string, string> = {
        'eq': 'igual a',
        'gt': 'maior que',
        'lt': 'menor que',
        'gte': 'maior ou igual a',
        'lte': 'menor ou igual a',
        'contains': 'contém'
      };
      return operators[op] || op;
    };
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Filtros Aplicados</h3>
        <div className="bg-gray-50 p-3 rounded-md">
          {report.custom_filters.map((filter, index) => (
            <div key={index} className="mb-1 last:mb-0">
              {filter.field} {getOperatorLabel(filter.operator)} {filter.value}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {getStatusIcon()}
          <span>{getReportTypeName(report.report_type)}</span>
        </h2>
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Período</h3>
          <p className="text-gray-800">
            {formatDate(report.start_date)} a {formatDate(report.end_date)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Data de Criação</h3>
          <p className="text-gray-800">{formatDate(report.created_at)}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">Status</h3>
          <p className="text-gray-800 flex items-center gap-2">
            {report.status === 'processing' && 'Em processamento'}
            {report.status === 'completed' && 'Concluído'}
            {report.status === 'error' && 'Erro'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">ID</h3>
          <p className="text-gray-800">{report.id}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Veículos</h3>
        <div className="bg-gray-50 p-3 rounded-md">
          {report.vehicle_ids.map((id) => (
            <div key={id} className="mb-1 last:mb-0">
              {getVehicleName(id)}
            </div>
          ))}
        </div>
      </div>

      {report.report_type === 'custom' && (
        <>
          {renderCustomFields()}
          {renderCustomFilters()}
        </>
      )}

      {report.schedule ? renderScheduleInfo() : (showScheduleForm && renderScheduleForm())}

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-4">
          {report.status === 'completed' && (
            <div className="flex items-center">
              <div className="flex items-center mr-2">
                <label className="inline-flex items-center mr-2">
                  <input
                    type="radio"
                    name="downloadFormat"
                    value="pdf"
                    checked={downloadFormat === 'pdf'}
                    onChange={() => setDownloadFormat('pdf')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-1 text-sm">PDF</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="downloadFormat"
                    value="excel"
                    checked={downloadFormat === 'excel'}
                    onChange={() => setDownloadFormat('excel')}
                    className="h-4 w-4 text-green-600"
                  />
                  <span className="ml-1 text-sm">Excel</span>
                </label>
              </div>
              <Button 
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download size={16} /> Download
              </Button>
            </div>
          )}
        </div>
        
        {report.status === 'completed' && !showScheduleForm && !report.schedule && (
          <Button 
            variant="secondary" 
            className="flex items-center gap-2"
            onClick={() => setShowScheduleForm(true)}
          >
            <Calendar size={16} /> Agendar
          </Button>
        )}
      </div>
    </Card>
  );
} 