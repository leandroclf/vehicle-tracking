'use client';

import { useState } from 'react';
import { Clock, Car, Info, Calendar, Map } from 'lucide-react';

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
  historyRecords = []
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

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-4xl">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Históricos</h2>
        </div>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {}}
        >
          <span className="text-2xl">×</span>
        </button>
      </div>
      
      <div className="p-6 bg-gray-100">
        <div className="space-y-2">
          <div className="flex">
            <div className="w-32 font-medium">Nome:</div>
            <div>{vehicleName}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium">Condutor:</div>
            <div>{vehicleDriver}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium">Ativo:</div>
            <div>{vehicleDetails}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium">Imei:</div>
            <div>{vehicleImei}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium">Data/Hora Inicial:</div>
            <div>{startDate}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium">Data/Hora Final:</div>
            <div>{endDate}</div>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <div className="flex">
            <div className="w-64 font-medium">Ignição ligada total:</div>
            <div>{ignitionOnTime}</div>
          </div>
          
          <div className="flex">
            <div className="w-64 font-medium">Ignição desligada total:</div>
            <div>{ignitionOffTime}</div>
          </div>
          
          <div className="flex">
            <div className="w-64 font-medium">Distância percorrida total:</div>
            <div>{distanceTraveled}</div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Endereço
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Km/h
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ignição
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evt/Volt
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                D
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.date}<br />{record.time}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {record.address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.speed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.ignition === 'ligado' ? 'Ligado' : 'Desligado'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.voltage}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.direction || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 flex justify-center space-x-2">
        <button className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-md">
          <span className="sr-only">Página inicial</span>
          ⏮
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-md">
          <span className="sr-only">Página anterior</span>
          ⏪
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-md">
          1
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-md">
          <span className="sr-only">Próxima página</span>
          ⏩
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-md">
          <span className="sr-only">Última página</span>
          ⏭
        </button>
      </div>
    </div>
  );
} 