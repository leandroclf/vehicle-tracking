'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Droplet, TrendingDown, TrendingUp, BarChart3, Calendar, Fuel } from 'lucide-react';

interface FuelConsumptionData {
  vehicleId: string;
  vehicleName: string;
  currentConsumption: number; // km/l
  averageConsumption: number; // km/l
  totalDistance: number; // km
  totalFuel: number; // litros
  efficiency: number; // percentual de eficiência (0-100)
  trend: 'up' | 'down' | 'stable';
  history: {
    date: string;
    consumption: number;
    distance: number;
    fuelAmount: number;
  }[];
  fuelCost: number; // custo por litro
  totalCost: number; // custo total
  estimatedSavings: number; // economia estimada
}

export default function FuelConsumptionWidget() {
  const [consumptionData, setConsumptionData] = useState<FuelConsumptionData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Simular carregamento de dados de consumo
  useEffect(() => {
    const fetchConsumptionData = () => {
      // Simulação de dados - em produção, isso viria da API
      const mockData: FuelConsumptionData[] = [
        {
          vehicleId: 'v1',
          vehicleName: 'Caminhão 01',
          currentConsumption: 3.2,
          averageConsumption: 3.5,
          totalDistance: 12500,
          totalFuel: 3571.4,
          efficiency: 85,
          trend: 'down',
          history: generateMockHistory(30, 3.0, 3.8),
          fuelCost: 5.89,
          totalCost: 21035.55,
          estimatedSavings: 1250.45
        },
        {
          vehicleId: 'v2',
          vehicleName: 'Van de Entrega',
          currentConsumption: 9.8,
          averageConsumption: 9.2,
          totalDistance: 8750,
          totalFuel: 951.1,
          efficiency: 92,
          trend: 'up',
          history: generateMockHistory(30, 8.5, 10.0),
          fuelCost: 5.89,
          totalCost: 5601.98,
          estimatedSavings: 320.75
        },
        {
          vehicleId: 'v3',
          vehicleName: 'Utilitário 03',
          currentConsumption: 11.5,
          averageConsumption: 11.2,
          totalDistance: 6200,
          totalFuel: 553.6,
          efficiency: 88,
          trend: 'stable',
          history: generateMockHistory(30, 10.8, 11.8),
          fuelCost: 5.89,
          totalCost: 3260.70,
          estimatedSavings: 175.20
        }
      ];

      setConsumptionData(mockData);
      if (!selectedVehicle && mockData.length > 0) {
        setSelectedVehicle(mockData[0].vehicleId);
      }
      setIsLoading(false);
    };

    // Função para gerar histórico de consumo simulado
    function generateMockHistory(days: number, minConsumption: number, maxConsumption: number) {
      const history = [];
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const consumption = minConsumption + Math.random() * (maxConsumption - minConsumption);
        const distance = 50 + Math.random() * 200; // 50-250 km por dia
        const fuelAmount = distance / consumption;
        
        history.push({
          date: date.toISOString().split('T')[0],
          consumption: parseFloat(consumption.toFixed(2)),
          distance: parseFloat(distance.toFixed(1)),
          fuelAmount: parseFloat(fuelAmount.toFixed(2))
        });
      }
      
      return history.reverse(); // Ordem cronológica
    }

    fetchConsumptionData();
    
    // Atualizar dados a cada 24 horas
    const interval = setInterval(() => {
      fetchConsumptionData();
    }, 86400000); // 24 horas

    return () => clearInterval(interval);
  }, [selectedVehicle]);

  // Obter dados do veículo selecionado
  const selectedVehicleData = consumptionData.find(v => v.vehicleId === selectedVehicle);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Filtrar histórico com base no intervalo de tempo selecionado
  const getFilteredHistory = () => {
    if (!selectedVehicleData) return [];
    
    const today = new Date();
    let startDate = new Date(today);
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    return selectedVehicleData.history.filter(item => item.date >= startDateStr);
  };

  // Calcular estatísticas para o período filtrado
  const getFilteredStats = () => {
    const filteredHistory = getFilteredHistory();
    
    if (filteredHistory.length === 0) {
      return {
        avgConsumption: 0,
        totalDistance: 0,
        totalFuel: 0,
        totalCost: 0
      };
    }
    
    const totalDistance = filteredHistory.reduce((sum, item) => sum + item.distance, 0);
    const totalFuel = filteredHistory.reduce((sum, item) => sum + item.fuelAmount, 0);
    const avgConsumption = totalDistance / totalFuel;
    const totalCost = totalFuel * (selectedVehicleData?.fuelCost || 0);
    
    return {
      avgConsumption: parseFloat(avgConsumption.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(1)),
      totalFuel: parseFloat(totalFuel.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2))
    };
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de consumo...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <Fuel className="mr-2 h-5 w-5 text-green-500" />
          Consumo de Combustível
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
            aria-label="Selecionar veículo para análise de consumo"
          >
            {consumptionData.map((vehicle) => (
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
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Resumo de consumo */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm text-gray-500 dark:text-gray-400">Consumo Atual</h4>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {selectedVehicleData.currentConsumption.toFixed(1)}
                        </span>
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">km/l</span>
                        
                        {selectedVehicleData.trend === 'up' && (
                          <TrendingUp className="ml-2 h-5 w-5 text-green-500" />
                        )}
                        {selectedVehicleData.trend === 'down' && (
                          <TrendingDown className="ml-2 h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <h4 className="text-sm text-gray-500 dark:text-gray-400">Média Histórica</h4>
                      <div>
                        <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          {selectedVehicleData.averageConsumption.toFixed(1)}
                        </span>
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">km/l</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Eficiência</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {selectedVehicleData.efficiency}%
                      </span>
                    </div>
                    <Progress 
                      value={selectedVehicleData.efficiency} 
                      max={100} 
                      className={selectedVehicleData.efficiency >= 80 ? 'bg-green-500' : 
                               selectedVehicleData.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
                    />
                  </div>
                </div>
                
                {/* Estatísticas de consumo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center mb-1">
                      <BarChart3 className="h-4 w-4 text-blue-500 mr-1" />
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Distância Total</h5>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {selectedVehicleData.totalDistance.toLocaleString()} km
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Droplet className="h-4 w-4 text-blue-500 mr-1" />
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Combustível Total</h5>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {selectedVehicleData.totalFuel.toLocaleString()} L
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Fuel className="h-4 w-4 text-green-500 mr-1" />
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Custo por Litro</h5>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {formatCurrency(selectedVehicleData.fuelCost)}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center mb-1">
                      <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Economia Estimada</h5>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedVehicleData.estimatedSavings)}
                    </p>
                  </div>
                </div>
                
                {/* Custo total */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Custo Total com Combustível</h4>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {formatCurrency(selectedVehicleData.totalCost)}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {/* Seletor de período */}
                <div className="flex justify-center mb-4">
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      onClick={() => setTimeRange('week')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
                    >
                      Semana
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange('month')}
                      className={`px-4 py-2 text-sm font-medium ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-t border-b border-gray-300 dark:border-gray-600'}`}
                    >
                      Mês
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRange('year')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
                    >
                      Ano
                    </button>
                  </div>
                </div>
                
                {/* Estatísticas do período */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(() => {
                    const stats = getFilteredStats();
                    return (
                      <>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center mb-1">
                            <Droplet className="h-4 w-4 text-blue-500 mr-1" />
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Consumo Médio</h5>
                          </div>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {stats.avgConsumption.toFixed(1)} km/l
                          </p>
                        </div>
                        
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center mb-1">
                            <BarChart3 className="h-4 w-4 text-blue-500 mr-1" />
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Distância</h5>
                          </div>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {stats.totalDistance.toLocaleString()} km
                          </p>
                        </div>
                        
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center mb-1">
                            <Fuel className="h-4 w-4 text-green-500 mr-1" />
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Combustível</h5>
                          </div>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {stats.totalFuel.toLocaleString()} L
                          </p>
                        </div>
                        
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center mb-1">
                            <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Custo</h5>
                          </div>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {formatCurrency(stats.totalCost)}
                          </p>
                        </div>
                      </>
                    );
                  })()} 
                </div>
                
                {/* Tabela de histórico */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Distância
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Combustível
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Consumo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {getFilteredHistory().map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                              {formatDate(item.date)}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {item.distance.toFixed(1)} km
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {item.fuelAmount.toFixed(2)} L
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                            <span className={item.consumption > selectedVehicleData.averageConsumption ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {item.consumption.toFixed(1)} km/l
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </div>
    </Card>
  );
}