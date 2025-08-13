'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VehicleTelemetry from '@/components/vehicle/VehicleTelemetry';
import VehicleHistory from '@/components/vehicle/VehicleHistory';
import VehicleCommands from '@/components/vehicle/VehicleCommands';
import VehicleCommandHistory from '@/components/vehicle/VehicleCommandHistory';
import { useVehicles } from '@/lib/vehicles-client';
import { ArrowLeft, MapPin, Clock, Info, Terminal, History, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const { vehicles, isLoading, error } = useVehicles();
  const [activeTab, setActiveTab] = useState('info');
  
  // Encontrar o veículo pelo ID
  const vehicle = vehicles.find(v => String(v.id) === vehicleId);
  
  // Carregar dados do veículo
  useEffect(() => {
    if (!isLoading && !vehicle && !error) {
      toast.error('Veículo não encontrado');
      router.push('/dashboard/vehicles');
    }
  }, [isLoading, vehicle, error, router]);
  
  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Renderizar mensagem de erro
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-6 text-center">
            <div className="mb-4 text-red-500">
              <AlertCircle size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="primary" onClick={() => router.push('/dashboard/vehicles')}>
              Voltar para Lista de Veículos
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Renderizar quando o veículo não for encontrado
  if (!vehicle) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Veículo não encontrado</h2>
            <p className="text-gray-600 mb-4">O veículo solicitado não existe ou você não tem permissão para acessá-lo.</p>
            <Button variant="primary" onClick={() => router.push('/dashboard/vehicles')}>
              Voltar para Lista de Veículos
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Função para determinar classes de abas
  const getTabClasses = (tabName: string) => {
    return `px-4 py-2 border-b-2 font-medium text-sm cursor-pointer transition-colors ${
      activeTab === tabName 
        ? 'border-blue-500 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };
  
  return (
    <div className="p-6">
      {/* Cabeçalho com voltar e informações do veículo */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <Button 
            variant="secondary"
            size="sm" 
            onClick={() => router.push('/dashboard/vehicles')}
          >
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {vehicle.name || `Veículo ${vehicle.plate}`}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={vehicle.status === 'online' ? 'success' : 'default'}>
            {vehicle.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
          <span className="text-sm text-gray-500">
            Última atualização: {vehicle.lastUpdate}
          </span>
        </div>
      </div>
      
      {/* Informações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">Placa</div>
            <div className="text-lg font-semibold">{vehicle.plate}</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">Modelo</div>
            <div className="text-lg font-semibold">{vehicle.details?.model || 'N/A'}</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">Fabricante</div>
            <div className="text-lg font-semibold">{vehicle.details?.manufacturer || 'N/A'}</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">Ano</div>
            <div className="text-lg font-semibold">{vehicle.details?.year || 'N/A'}</div>
          </div>
        </Card>
      </div>
      
      {/* Abas de conteúdo */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <div 
              className={getTabClasses('info')}
              onClick={() => setActiveTab('info')}
            >
              <Info size={16} className="inline mr-1" /> Informações
            </div>
            <div 
              className={getTabClasses('telemetry')}
              onClick={() => setActiveTab('telemetry')}
            >
              <MapPin size={16} className="inline mr-1" /> Telemetria
            </div>
            <div 
              className={getTabClasses('history')}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={16} className="inline mr-1" /> Histórico
            </div>
            <div 
              className={getTabClasses('commands')}
              onClick={() => setActiveTab('commands')}
            >
              <Terminal size={16} className="inline mr-1" /> Comandos
            </div>
            <div 
              className={getTabClasses('command-history')}
              onClick={() => setActiveTab('command-history')}
            >
              <History size={16} className="inline mr-1" /> Histórico de Comandos
            </div>
          </nav>
        </div>
      </div>
      
      {/* Conteúdo das abas */}
      <div className="bg-white rounded-lg shadow">
        {/* Informações */}
        {activeTab === 'info' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações do Veículo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Detalhes Básicos</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">ID</td>
                      <td className="py-2 text-sm">{vehicle.id}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Placa</td>
                      <td className="py-2 text-sm">{vehicle.plate}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Tipo</td>
                      <td className="py-2 text-sm">{vehicle.type}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Status</td>
                      <td className="py-2 text-sm">
                        <Badge variant={vehicle.status === 'online' ? 'success' : 'default'}>
                          {vehicle.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Ignição</td>
                      <td className="py-2 text-sm">
                        <Badge variant={vehicle.ignition ? 'success' : 'default'}>
                          {vehicle.ignition ? 'Ligada' : 'Desligada'}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Movimento</td>
                      <td className="py-2 text-sm">
                        <Badge variant={vehicle.isMoving ? 'success' : 'default'}>
                          {vehicle.isMoving ? 'Em movimento' : 'Parado'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Detalhes Técnicos</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Fabricante</td>
                      <td className="py-2 text-sm">{vehicle.details?.manufacturer || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Modelo</td>
                      <td className="py-2 text-sm">{vehicle.details?.model || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Ano</td>
                      <td className="py-2 text-sm">{vehicle.details?.year || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Cor</td>
                      <td className="py-2 text-sm">{vehicle.details?.color || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">VIN/IMEI</td>
                      <td className="py-2 text-sm">{vehicle.details?.vin || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm font-medium text-gray-500">Última Manutenção</td>
                      <td className="py-2 text-sm">{vehicle.details?.lastMaintenance || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Telemetria */}
        {activeTab === 'telemetry' && (
          <div className="p-6">
            <VehicleTelemetry vehicleId={Number(vehicleId)} />
          </div>
        )}
        
        {/* Histórico */}
        {activeTab === 'history' && (
          <div className="p-6">
            <VehicleHistory 
              vehicleName={vehicle.name || vehicle.plate}
              vehicleDetails={`${vehicle.details?.manufacturer || ''} ${vehicle.details?.model || ''} (${vehicle.plate})`}
              vehicleImei={vehicle.details?.vin || 'N/A'}
            />
          </div>
        )}
        
        {/* Comandos */}
        {activeTab === 'commands' && (
          <div className="p-6">
            <VehicleCommands vehicleId={Number(vehicleId)} />
          </div>
        )}
        
        {/* Histórico de Comandos */}
        {activeTab === 'command-history' && (
          <div className="p-6">
            <VehicleCommandHistory vehicleId={vehicleId} />
          </div>
        )}
      </div>
    </div>
  );
}