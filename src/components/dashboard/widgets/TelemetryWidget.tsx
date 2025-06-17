'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Gauge, Thermometer, Battery, Droplet, Activity } from 'lucide-react';

interface TelemetryData {
  vehicleId: string;
  vehicleName: string;
  speed: number;
  maxSpeed: number;
  engineTemp: number;
  fuelLevel: number;
  batteryLevel: number;
  engineLoad: number;
  lastUpdate: string;
  tirePressure: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  oilLevel: number;
  coolantLevel: number;
  odometerReading: number;
}

export default function TelemetryWidget() {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento de dados de telemetria
  useEffect(() => {
    const fetchTelemetryData = () => {
      // Simulação de dados - em produção, isso viria da API
      const mockData: TelemetryData[] = [
        {
          vehicleId: 'v1',
          vehicleName: 'Caminhão 01',
          speed: 65,
          maxSpeed: 120,
          engineTemp: 92,
          fuelLevel: 45,
          batteryLevel: 98,
          engineLoad: 72,
          lastUpdate: new Date().toISOString(),
          tirePressure: {
            frontLeft: 32,
            frontRight: 32,
            rearLeft: 35,
            rearRight: 34
          },
          oilLevel: 85,
          coolantLevel: 90,
          odometerReading: 45678
        },
        {
          vehicleId: 'v2',
          vehicleName: 'Van de Entrega',
          speed: 0,
          maxSpeed: 180,
          engineTemp: 75,
          fuelLevel: 80,
          batteryLevel: 100,
          engineLoad: 0,
          lastUpdate: new Date().toISOString(),
          tirePressure: {
            frontLeft: 30,
            frontRight: 30,
            rearLeft: 30,
            rearRight: 30
          },
          oilLevel: 95,
          coolantLevel: 100,
          odometerReading: 12345
        },
        {
          vehicleId: 'v3',
          vehicleName: 'Utilitário 03',
          speed: 87,
          maxSpeed: 160,
          engineTemp: 98,
          fuelLevel: 30,
          batteryLevel: 85,
          engineLoad: 65,
          lastUpdate: new Date().toISOString(),
          tirePressure: {
            frontLeft: 29,
            frontRight: 31,
            rearLeft: 30,
            rearRight: 30
          },
          oilLevel: 70,
          coolantLevel: 85,
          odometerReading: 78901
        }
      ];

      setTelemetryData(mockData);
      if (!selectedVehicle && mockData.length > 0) {
        setSelectedVehicle(mockData[0].vehicleId);
      }
      setIsLoading(false);
    };

    fetchTelemetryData();
    
    // Atualizar dados a cada 5 segundos para simular telemetria em tempo real
    const interval = setInterval(() => {
      fetchTelemetryData();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedVehicle]);

  // Obter dados do veículo selecionado
  const selectedVehicleData = telemetryData.find(v => v.vehicleId === selectedVehicle);

  // Função para formatar data
  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Determinar cor baseada no valor
  const getColorClass = (value: number, thresholds: [number, number]) => {
    const [warning, danger] = thresholds;
    if (value >= danger) return 'text-red-500 dark:text-red-400';
    if (value >= warning) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  // Determinar cor para progresso
  const getProgressColor = (value: number, thresholds: [number, number], inverse: boolean = false) => {
    const [warning, danger] = thresholds;
    if (inverse) {
      if (value <= danger) return 'bg-red-500';
      if (value <= warning) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (value >= danger) return 'bg-red-500';
      if (value >= warning) return 'bg-yellow-500';
      return 'bg-green-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de telemetria...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <Activity className="mr-2 h-5 w-5 text-blue-500" />
          Telemetria em Tempo Real
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
            aria-label="Selecionar veículo para telemetria"
          >
            {telemetryData.map((vehicle) => (
              <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                {vehicle.vehicleName}
              </option>
            ))}
          </select>
        </div>

        {selectedVehicleData ? (
          <div className="flex-grow overflow-auto">
            <Tabs defaultValue="gauges" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="gauges">Medidores</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
              </TabsList>

              <TabsContent value="gauges" className="space-y-4">
                {/* Velocidade */}
                <div className="flex items-center">
                  <div className="mr-3">
                    <Gauge className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Velocidade</span>
                      <span className={`text-sm font-bold ${getColorClass(selectedVehicleData.speed, [80, 100])}`}>
                        {selectedVehicleData.speed} km/h
                      </span>
                    </div>
                    <Progress 
                      value={(selectedVehicleData.speed / selectedVehicleData.maxSpeed) * 100} 
                      max={100} 
                      className={getProgressColor(selectedVehicleData.speed, [80, 100])}
                    />
                  </div>
                </div>

                {/* Temperatura do Motor */}
                <div className="flex items-center">
                  <div className="mr-3">
                    <Thermometer className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Temperatura do Motor</span>
                      <span className={`text-sm font-bold ${getColorClass(selectedVehicleData.engineTemp, [85, 95])}`}>
                        {selectedVehicleData.engineTemp}°C
                      </span>
                    </div>
                    <Progress 
                      value={(selectedVehicleData.engineTemp / 120) * 100} 
                      max={100} 
                      className={getProgressColor(selectedVehicleData.engineTemp, [85, 95])}
                    />
                  </div>
                </div>

                {/* Nível de Combustível */}
                <div className="flex items-center">
                  <div className="mr-3">
                    <Droplet className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nível de Combustível</span>
                      <span className={`text-sm font-bold ${getColorClass(100 - selectedVehicleData.fuelLevel, [70, 85])}`}>
                        {selectedVehicleData.fuelLevel}%
                      </span>
                    </div>
                    <Progress 
                      value={selectedVehicleData.fuelLevel} 
                      max={100} 
                      className={getProgressColor(selectedVehicleData.fuelLevel, [30, 15], true)}
                    />
                  </div>
                </div>

                {/* Bateria */}
                <div className="flex items-center">
                  <div className="mr-3">
                    <Battery className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bateria</span>
                      <span className={`text-sm font-bold ${getColorClass(100 - selectedVehicleData.batteryLevel, [70, 85])}`}>
                        {selectedVehicleData.batteryLevel}%
                      </span>
                    </div>
                    <Progress 
                      value={selectedVehicleData.batteryLevel} 
                      max={100} 
                      className={getProgressColor(selectedVehicleData.batteryLevel, [30, 15], true)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nível de Combustível</div>
                    <div className="text-lg font-semibold">{selectedVehicleData.fuelLevel}%</div>
                  </div>
                  
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bateria</div>
                    <div className="text-lg font-semibold">{selectedVehicleData.batteryLevel}%</div>
                  </div>
                  
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Carga do Motor</div>
                    <div className="text-lg font-semibold">{selectedVehicleData.engineLoad}%</div>
                  </div>
                  
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Última Atualização</div>
                    <div className="text-lg font-semibold">{formatLastUpdate(selectedVehicleData.lastUpdate)}</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="diagnostics" className="space-y-4">
                {/* Pressão dos Pneus */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pressão dos Pneus (PSI)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dianteiro Esquerdo</div>
                      <div className={`text-lg font-semibold ${getColorClass(selectedVehicleData.tirePressure.frontLeft, [28, 26])}`}>
                        {selectedVehicleData.tirePressure.frontLeft}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dianteiro Direito</div>
                      <div className={`text-lg font-semibold ${getColorClass(selectedVehicleData.tirePressure.frontRight, [28, 26])}`}>
                        {selectedVehicleData.tirePressure.frontRight}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Traseiro Esquerdo</div>
                      <div className={`text-lg font-semibold ${getColorClass(selectedVehicleData.tirePressure.rearLeft, [28, 26])}`}>
                        {selectedVehicleData.tirePressure.rearLeft}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Traseiro Direito</div>
                      <div className={`text-lg font-semibold ${getColorClass(selectedVehicleData.tirePressure.rearRight, [28, 26])}`}>
                        {selectedVehicleData.tirePressure.rearRight}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Níveis de Fluidos */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Níveis de Fluidos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nível de Óleo</div>
                      <div className="flex items-center">
                        <div className="flex-grow">
                          <Progress 
                            value={selectedVehicleData.oilLevel} 
                            max={100} 
                            className={getProgressColor(selectedVehicleData.oilLevel, [60, 40], true)}
                          />
                        </div>
                        <div className="ml-2 text-lg font-semibold">{selectedVehicleData.oilLevel}%</div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Líquido de Arrefecimento</div>
                      <div className="flex items-center">
                        <div className="flex-grow">
                          <Progress 
                            value={selectedVehicleData.coolantLevel} 
                            max={100} 
                            className={getProgressColor(selectedVehicleData.coolantLevel, [60, 40], true)}
                          />
                        </div>
                        <div className="ml-2 text-lg font-semibold">{selectedVehicleData.coolantLevel}%</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Odômetro */}
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Leitura do Odômetro</div>
                  <div className="text-lg font-semibold">{selectedVehicleData.odometerReading.toLocaleString('pt-BR')} km</div>
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

      {selectedVehicleData && (
        <div className="p-2 text-xs text-right text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          Última atualização: {formatLastUpdate(selectedVehicleData.lastUpdate)}
        </div>
      )}
    </Card>
  );
}