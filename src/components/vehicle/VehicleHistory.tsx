'use client';

import { useState } from 'react';
import { Clock, Car, Info, Calendar, Map, Power, Zap } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HistoryRecord {
  date: string;
  time: string;
  address: string;
  speed: number;
  ignition: 'ligado' | 'desligado';
  voltage: string;
  direction?: string;
}

interface VehicleHistoryProps {
  vehicleName?: string;
  vehicleDriver?: string;
  vehicleDetails?: string;
  vehicleImei?: string;
  startDate?: string;
  endDate?: string;
  ignitionOnTime?: string;
  ignitionOffTime?: string;
  distanceTraveled?: string;
  historyRecords?: HistoryRecord[];
  className?: string;
  onClose?: () => void;
  'data-testid'?: string;
}

export default function VehicleHistory({
  vehicleName = 'Divin Car Ltda',
  vehicleDriver = 'Não informado',
  vehicleDetails = 'Ford Ecosport Freestyle 1 5 12V Flex 5P Aut (EVW2G86)',
  vehicleImei = '865190070481786',
  startDate = '02/05/2025 18:07',
  endDate = '03/05/2025 18:07',
  ignitionOnTime = '1 hora, 52 minutos e 33 segundos',
  ignitionOffTime = '22 horas, 2 minutos e 6 segundos',
  distanceTraveled = '33,13 km',
  historyRecords = [],
  className,
  onClose,
  'data-testid': dataTestId
}: VehicleHistoryProps) {
  const [records, setRecords] = useState<HistoryRecord[]>(historyRecords.length > 0 ? historyRecords : [
    {
      date: '02/05/2025',
      time: '18:09:46',
      address: 'Estrada Coronel Pedro Corrêa - Barra Olímpica, Rio de Janeiro - RJ',
      speed: 0,
      ignition: 'desligado',
      voltage: '12.50v'
    },
    {
      date: '02/05/2025',
      time: '18:11:06',
      address: 'Estrada Coronel Pedro Corrêa - Barra Olímpica, Rio de Janeiro - RJ',
      speed: 0,
      ignition: 'desligado',
      voltage: '12.50v'
    }
  ]);

  // Definir colunas da tabela
  const columns: DataTableColumn<HistoryRecord>[] = [
    {
      key: 'datetime',
      title: 'Data/Hora',
      sortable: true,
      render: (_value, record) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{record.date}</div>
          <div className="text-gray-500">{record.time}</div>
        </div>
      ),
    },
    {
      key: 'address',
      title: 'Endereço',
      render: (_value, record) => (
        <div className="text-sm text-gray-900 max-w-xs truncate" title={record.address}>
          {record.address}
        </div>
      ),
    },
    {
      key: 'speed',
      title: 'Velocidade',
      sortable: true,
      render: (_value, record) => (
        <Badge variant={record.speed > 0 ? 'default' : 'secondary'}>
          {record.speed} km/h
        </Badge>
      ),
    },
    {
      key: 'ignition',
      title: 'Ignição',
      render: (_value, record) => (
        <div className="flex items-center space-x-2">
          {record.ignition === 'ligado' ? (
            <Power className="h-4 w-4 text-green-500" />
          ) : (
            <Power className="h-4 w-4 text-red-500" />
          )}
          <Badge variant={record.ignition === 'ligado' ? 'success' : 'destructive'}>
            {record.ignition === 'ligado' ? 'Ligado' : 'Desligado'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'voltage',
      title: 'Voltagem',
      render: (_value, record) => (
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">{record.voltage}</span>
        </div>
      ),
    },
    {
      key: 'direction',
      title: 'Direção',
      render: (_value, record) => (
        <span className="text-sm text-gray-500">
          {record.direction || '-'}
        </span>
      ),
    },
  ];

  return (
    <Card className={cn("w-full max-w-6xl", className)} data-testid={dataTestId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-3">
          <Clock className="h-6 w-6" />
          <span>Histórico do Veículo</span>
        </CardTitle>
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            data-testid="close-history"
          >
            <span className="text-xl">×</span>
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informações do Veículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <div className="flex">
              <div className="w-32 font-medium text-gray-700">Nome:</div>
              <div className="text-gray-900">{vehicleName}</div>
            </div>
            
            <div className="flex">
              <div className="w-32 font-medium text-gray-700">Condutor:</div>
              <div className="text-gray-900">{vehicleDriver}</div>
            </div>
            
            <div className="flex">
              <div className="w-32 font-medium text-gray-700">Ativo:</div>
              <div className="text-gray-900">{vehicleDetails}</div>
            </div>
            
            <div className="flex">
              <div className="w-32 font-medium text-gray-700">IMEI:</div>
              <div className="text-gray-900 font-mono">{vehicleImei}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex">
              <div className="w-40 font-medium text-gray-700">Data/Hora Inicial:</div>
              <div className="text-gray-900">{startDate}</div>
            </div>
            
            <div className="flex">
              <div className="w-40 font-medium text-gray-700">Data/Hora Final:</div>
              <div className="text-gray-900">{endDate}</div>
            </div>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Power className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Ignição Ligada</div>
                  <div className="text-lg font-semibold text-gray-900">{ignitionOnTime}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Power className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Ignição Desligada</div>
                  <div className="text-lg font-semibold text-gray-900">{ignitionOffTime}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Map className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Distância Percorrida</div>
                  <div className="text-lg font-semibold text-gray-900">{distanceTraveled}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabela de Histórico */}
        <DataTable
          data={records}
          columns={columns}
          searchable
          sortable
          pagination
          emptyMessage="Nenhum registro de histórico encontrado."
          className="border rounded-lg"
          data-testid="vehicle-history-table"
        />
      </CardContent>
    </Card>
  );
}