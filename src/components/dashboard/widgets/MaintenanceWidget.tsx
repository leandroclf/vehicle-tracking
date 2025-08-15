'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs-fixed';
import { Progress } from '@/components/ui/Progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, AlertTriangle, CheckCircle, Clock, ArrowRight, Wrench } from 'lucide-react';

interface MaintenanceItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'oil' | 'tires' | 'brakes' | 'filters' | 'general';
  description: string;
  status: 'pending' | 'scheduled' | 'completed' | 'overdue';
  dueDate: string;
  completedDate?: string;
  healthPercentage: number;
  lastServiceDate: string;
  nextServiceDate: string;
  mileage: number;
  notes?: string;
}

interface VehicleMaintenanceStatus {
  vehicleId: string;
  vehicleName: string;
  overallHealth: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceItems: MaintenanceItem[];
}

export default function MaintenanceWidget() {
  const [maintenanceData, setMaintenanceData] = useState<VehicleMaintenanceStatus[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento de dados de manutenção
  useEffect(() => {
    const fetchMaintenanceData = () => {
      // Simulação de dados - em produção, isso viria da API
      const mockData: VehicleMaintenanceStatus[] = [
        {
          vehicleId: 'v1',
          vehicleName: 'Caminhão 01',
          overallHealth: 78,
          lastMaintenanceDate: '2023-10-15',
          nextMaintenanceDate: '2023-12-15',
          maintenanceItems: [
            {
              id: 'm1',
              vehicleId: 'v1',
              vehicleName: 'Caminhão 01',
              type: 'oil',
              description: 'Troca de óleo',
              status: 'pending',
              dueDate: '2023-12-15',
              healthPercentage: 65,
              lastServiceDate: '2023-09-15',
              nextServiceDate: '2023-12-15',
              mileage: 15000
            },
            {
              id: 'm2',
              vehicleId: 'v1',
              vehicleName: 'Caminhão 01',
              type: 'tires',
              description: 'Rodízio de pneus',
              status: 'completed',
              dueDate: '2023-10-10',
              completedDate: '2023-10-08',
              healthPercentage: 90,
              lastServiceDate: '2023-10-08',
              nextServiceDate: '2024-01-08',
              mileage: 12000
            },
            {
              id: 'm3',
              vehicleId: 'v1',
              vehicleName: 'Caminhão 01',
              type: 'brakes',
              description: 'Verificação de freios',
              status: 'scheduled',
              dueDate: '2023-11-20',
              healthPercentage: 75,
              lastServiceDate: '2023-08-20',
              nextServiceDate: '2023-11-20',
              mileage: 10000
            }
          ]
        },
        {
          vehicleId: 'v2',
          vehicleName: 'Van de Entrega',
          overallHealth: 92,
          lastMaintenanceDate: '2023-11-05',
          nextMaintenanceDate: '2024-02-05',
          maintenanceItems: [
            {
              id: 'm4',
              vehicleId: 'v2',
              vehicleName: 'Van de Entrega',
              type: 'general',
              description: 'Revisão geral',
              status: 'completed',
              dueDate: '2023-11-05',
              completedDate: '2023-11-05',
              healthPercentage: 100,
              lastServiceDate: '2023-11-05',
              nextServiceDate: '2024-02-05',
              mileage: 5000
            },
            {
              id: 'm5',
              vehicleId: 'v2',
              vehicleName: 'Van de Entrega',
              type: 'filters',
              description: 'Troca de filtros',
              status: 'pending',
              dueDate: '2024-01-15',
              healthPercentage: 85,
              lastServiceDate: '2023-10-15',
              nextServiceDate: '2024-01-15',
              mileage: 7500
            }
          ]
        },
        {
          vehicleId: 'v3',
          vehicleName: 'Utilitário 03',
          overallHealth: 45,
          lastMaintenanceDate: '2023-09-01',
          nextMaintenanceDate: '2023-11-01',
          maintenanceItems: [
            {
              id: 'm6',
              vehicleId: 'v3',
              vehicleName: 'Utilitário 03',
              type: 'oil',
              description: 'Troca de óleo',
              status: 'overdue',
              dueDate: '2023-11-01',
              healthPercentage: 30,
              lastServiceDate: '2023-08-01',
              nextServiceDate: '2023-11-01',
              mileage: 18000,
              notes: 'Urgente: Veículo com manutenção atrasada'
            },
            {
              id: 'm7',
              vehicleId: 'v3',
              vehicleName: 'Utilitário 03',
              type: 'brakes',
              description: 'Substituição de pastilhas de freio',
              status: 'scheduled',
              dueDate: '2023-11-25',
              healthPercentage: 60,
              lastServiceDate: '2023-07-25',
              nextServiceDate: '2023-11-25',
              mileage: 16000
            }
          ]
        }
      ];

      setMaintenanceData(mockData);
      if (!selectedVehicle && mockData.length > 0) {
        setSelectedVehicle(mockData[0].vehicleId);
      }
      setIsLoading(false);
    };

    fetchMaintenanceData();
    
    // Atualizar dados a cada 12 horas para simular atualizações de manutenção
    const interval = setInterval(() => {
      fetchMaintenanceData();
    }, 43200000); // 12 horas

    return () => clearInterval(interval);
  }, [selectedVehicle]);

  // Obter dados do veículo selecionado
  const selectedVehicleData = maintenanceData.find(v => v.vehicleId === selectedVehicle);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Determinar cor baseada no valor de saúde
  const getHealthColor = (health: number) => {
    if (health >= 80) return 'bg-green-500';
    if (health >= 60) return 'bg-yellow-500';
    if (health >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Obter ícone e cor para status de manutenção
  const getStatusInfo = (status: 'pending' | 'scheduled' | 'completed' | 'overdue') => {
    switch (status) {
      case 'completed':
        return { icon: <CheckCircle size={16} />, color: 'success', text: 'Concluído' };
      case 'scheduled':
        return { icon: <Calendar size={16} />, color: 'info', text: 'Agendado' };
      case 'pending':
        return { icon: <Clock size={16} />, color: 'warning', text: 'Pendente' };
      case 'overdue':
        return { icon: <AlertTriangle size={16} />, color: 'error', text: 'Atrasado' };
      default:
        return { icon: <Clock size={16} />, color: 'default', text: 'Desconhecido' };
    }
  };

  // Obter ícone para tipo de manutenção
  const getMaintenanceTypeIcon = (type: 'oil' | 'tires' | 'brakes' | 'filters' | 'general') => {
    switch (type) {
      case 'oil':
        return <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full"><Wrench className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /></div>;
      case 'tires':
        return <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full"><Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>;
      case 'brakes':
        return <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><Wrench className="h-4 w-4 text-red-600 dark:text-red-400" /></div>;
      case 'filters':
        return <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full"><Wrench className="h-4 w-4 text-green-600 dark:text-green-400" /></div>;
      case 'general':
        return <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full"><Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>;
      default:
        return <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><Wrench className="h-4 w-4 text-gray-600 dark:text-gray-400" /></div>;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de manutenção...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <Wrench className="mr-2 h-5 w-5 text-blue-500" />
          Status de Manutenção
        </h3>
      </div>

      <div className="p-4 flex-grow overflow-hidden flex flex-col">
        {/* Seletor de veículo */}
        <div className="mb-4">
          <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Selecione o veículo:
          </label>
          <select
            id="vehicle-select"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            aria-label="Selecionar veículo para status de manutenção"
          >
            {maintenanceData.map((vehicle) => (
              <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                {vehicle.vehicleName}
              </option>
            ))}
          </select>
        </div>

        {selectedVehicleData ? (
          <div className="flex-grow overflow-auto">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Status geral de saúde */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Saúde do Veículo</h4>
                    <span className={`text-sm font-bold ${selectedVehicleData.overallHealth >= 70 ? 'text-green-500' : selectedVehicleData.overallHealth >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {selectedVehicleData.overallHealth}%
                    </span>
                  </div>
                  <Progress 
                    value={selectedVehicleData.overallHealth} 
                    max={100} 
                    className={getHealthColor(selectedVehicleData.overallHealth)}
                  />
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Última Manutenção</p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(selectedVehicleData.lastMaintenanceDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Próxima Manutenção</p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(selectedVehicleData.nextMaintenanceDate)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Lista de itens de manutenção */}
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Itens de Manutenção</h4>
                  <div className="space-y-3">
                    {selectedVehicleData.maintenanceItems.map((item) => {
                      const statusInfo = getStatusInfo(item.status);
                      return (
                        <div key={item.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              {getMaintenanceTypeIcon(item.type)}
                              <div className="ml-3">
                                <h5 className="font-medium text-gray-800 dark:text-gray-200">{item.description}</h5>
                                <div className="flex items-center mt-1">
                                  <StatusBadge variant={statusInfo.color as any}>
                                    <span className="flex items-center">
                                      {statusInfo.icon}
                                      <span className="ml-1">{statusInfo.text}</span>
                                    </span>
                                  </StatusBadge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {item.status === 'completed' ? 'Concluído em:' : 'Vencimento:'}
                              </div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {formatDate(item.status === 'completed' && item.completedDate ? item.completedDate : item.dueDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {selectedVehicleData.maintenanceItems.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  return (
                    <div key={item.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                          {getMaintenanceTypeIcon(item.type)}
                          <span className="ml-2">{item.description}</span>
                        </h5>
                        <StatusBadge variant={statusInfo.color as any}>
                          <span className="flex items-center">
                            {statusInfo.icon}
                            <span className="ml-1">{statusInfo.text}</span>
                          </span>
                        </StatusBadge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Condição</span>
                          <span className={`text-sm font-bold ${item.healthPercentage >= 70 ? 'text-green-500' : item.healthPercentage >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {item.healthPercentage}%
                          </span>
                        </div>
                        <Progress 
                          value={item.healthPercentage} 
                          max={100} 
                          className={getHealthColor(item.healthPercentage)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Último Serviço</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(item.lastServiceDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Próximo Serviço</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(item.nextServiceDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Quilometragem</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{item.mileage.toLocaleString()} km</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Status</p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{statusInfo.text}</p>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
                          <p className="flex items-start">
                            <AlertTriangle size={16} className="mr-1 mt-0.5 flex-shrink-0" />
                            <span>{item.notes}</span>
                          </p>
                        </div>
                      )}
                      
                      {item.status !== 'completed' && (
                        <div className="mt-3 flex justify-end">
                          <button className="text-sm text-blue-600 dark:text-blue-400 flex items-center hover:underline">
                            Agendar Manutenção
                            <ArrowRight size={14} className="ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhum veículo selecionado</p>
          </div>
        )}
      </div>

      <div className="p-2 text-xs text-right text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Última verificação: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </Card>
  );
}