'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExternalLink, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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

interface ReportDetailsProps {
  report: Report;
  vehicles: Vehicle[];
  onClose: () => void;
}

export default function ReportDetails({ report, vehicles, onClose }: ReportDetailsProps) {
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'excel'>('pdf');

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
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
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

      <div className="flex justify-end gap-2">
        {report.status === 'completed' && (
          <>
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
          </>
        )}
      </div>
    </Card>
  );
} 