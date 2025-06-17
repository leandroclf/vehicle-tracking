'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, CloudRain, Sun, Wind, Thermometer, Droplets, CloudFog } from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  humidity: number;
  windSpeed: number;
  precipitation: number;
  forecast: {
    day: string;
    temperature: number;
    condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  }[];
}

interface LocationOption {
  id: string;
  name: string;
}

interface VehicleLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lastUpdate: string;
}

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
  const [showVehicleWeather, setShowVehicleWeather] = useState<boolean>(false);

  // Simular carregamento de dados meteorológicos e localizações de veículos
  useEffect(() => {
    const fetchWeatherData = () => {
      // Simulação de localizações disponíveis
      const mockLocations: LocationOption[] = [
        { id: 'sao-paulo', name: 'São Paulo, SP' },
        { id: 'rio-de-janeiro', name: 'Rio de Janeiro, RJ' },
        { id: 'belo-horizonte', name: 'Belo Horizonte, MG' },
        { id: 'brasilia', name: 'Brasília, DF' },
        { id: 'curitiba', name: 'Curitiba, PR' }
      ];
      
      // Simulação de localizações de veículos
      const mockVehicleLocations: VehicleLocation[] = [
        { id: 'v1', name: 'Caminhão 01', lat: -23.5505, lng: -46.6333, lastUpdate: new Date().toISOString() }, // São Paulo
        { id: 'v2', name: 'Van de Entrega', lat: -22.9068, lng: -43.1729, lastUpdate: new Date().toISOString() }, // Rio de Janeiro
        { id: 'v3', name: 'Utilitário 03', lat: -19.9167, lng: -43.9345, lastUpdate: new Date().toISOString() } // Belo Horizonte
      ];
      
      setLocations(mockLocations);
      setVehicleLocations(mockVehicleLocations);
      
      if (!selectedLocation && mockLocations.length > 0) {
        setSelectedLocation(mockLocations[0].id);
      }
      
      // Simulação de dados meteorológicos - em produção, isso viria da API
      if (selectedLocation) {
        // Gerar dados aleatórios para demonstração
        const conditions: Array<'clear' | 'cloudy' | 'rain' | 'storm' | 'fog'> = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        // Verificar se é uma localização de veículo
        const isVehicle = selectedLocation.startsWith('v');
        let locationName = '';
        
        if (isVehicle) {
          const vehicle = mockVehicleLocations.find(v => v.id === selectedLocation);
          locationName = vehicle ? `${vehicle.name} (em trânsito)` : '';
        } else {
          locationName = mockLocations.find(loc => loc.id === selectedLocation)?.name || '';
        }
        
        const mockData: WeatherData = {
          location: locationName,
          temperature: Math.floor(Math.random() * 15) + 15, // 15-30°C
          condition: randomCondition,
          humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
          windSpeed: Math.floor(Math.random() * 30) + 5, // 5-35 km/h
          precipitation: Math.floor(Math.random() * 80), // 0-80%
          forecast: [
            {
              day: 'Hoje',
              temperature: Math.floor(Math.random() * 15) + 15,
              condition: conditions[Math.floor(Math.random() * conditions.length)]
            },
            {
              day: 'Amanhã',
              temperature: Math.floor(Math.random() * 15) + 15,
              condition: conditions[Math.floor(Math.random() * conditions.length)]
            },
            {
              day: 'Quarta',
              temperature: Math.floor(Math.random() * 15) + 15,
              condition: conditions[Math.floor(Math.random() * conditions.length)]
            },
            {
              day: 'Quinta',
              temperature: Math.floor(Math.random() * 15) + 15,
              condition: conditions[Math.floor(Math.random() * conditions.length)]
            },
            {
              day: 'Sexta',
              temperature: Math.floor(Math.random() * 15) + 15,
              condition: conditions[Math.floor(Math.random() * conditions.length)]
            }
          ]
        };
        
        setWeatherData(mockData);
      }
      
      setIsLoading(false);
    };

    fetchWeatherData();
    
    // Atualizar dados a cada 30 minutos para simular atualizações meteorológicas
    const interval = setInterval(() => {
      fetchWeatherData();
    }, 1800000); // 30 minutos

    return () => clearInterval(interval);
  }, [selectedLocation]);

  // Renderizar ícone baseado na condição meteorológica
  const renderWeatherIcon = (condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog', size: number = 24) => {
    switch (condition) {
      case 'clear':
        return <Sun size={size} className="text-yellow-500" />;
      case 'cloudy':
        return <Cloud size={size} className="text-gray-500" />;
      case 'rain':
        return <CloudRain size={size} className="text-blue-500" />;
      case 'storm':
        return <CloudRain size={size} className="text-purple-500" />;
      case 'fog':
        return <CloudFog size={size} className="text-gray-400" />;
      default:
        return <Cloud size={size} className="text-gray-500" />;
    }
  };

  // Obter descrição da condição meteorológica
  const getWeatherDescription = (condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog') => {
    switch (condition) {
      case 'clear':
        return 'Céu limpo';
      case 'cloudy':
        return 'Nublado';
      case 'rain':
        return 'Chuva';
      case 'storm':
        return 'Tempestade';
      case 'fog':
        return 'Neblina';
      default:
        return 'Desconhecido';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados meteorológicos...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <Cloud className="mr-2 h-5 w-5 text-blue-500" />
          Condições Meteorológicas
        </h3>
      </div>

      <div className="p-4 flex-grow overflow-hidden flex flex-col">
        {/* Seletor de localização */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="location-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Selecione a localização:
            </label>
            <div className="flex items-center">
              <label htmlFor="vehicle-weather-toggle" className="text-xs text-gray-600 dark:text-gray-400 mr-2">
                Clima nas rotas
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  id="vehicle-weather-toggle" 
                  checked={showVehicleWeather}
                  onChange={() => setShowVehicleWeather(!showVehicleWeather)}
                  className="sr-only"
                />
                <div className="block h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-10"></div>
                <div className={`absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition-transform ${showVehicleWeather ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </div>
          </div>
          <select
            id="location-select"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            aria-label="Selecionar localização para previsão do tempo"
          >
            {showVehicleWeather ? (
              // Mostrar localizações de veículos
              vehicleLocations.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))
            ) : (
              // Mostrar localizações fixas
              locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))
            )}
          </select>
        </div>

        {weatherData ? (
          <div className="flex-grow overflow-auto">
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="current">Atual</TabsTrigger>
                <TabsTrigger value="forecast">Previsão</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-4">
                <div className="flex flex-col items-center mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="mb-2">
                    {renderWeatherIcon(weatherData.condition, 48)}
                  </div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                    {weatherData.temperature}°C
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {getWeatherDescription(weatherData.condition)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {weatherData.location}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Droplets className="h-6 w-6 text-blue-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Umidade</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{weatherData.humidity}%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Wind className="h-6 w-6 text-teal-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Vento</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{weatherData.windSpeed} km/h</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CloudRain className="h-6 w-6 text-indigo-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Precipitação</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{weatherData.precipitation}%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Thermometer className="h-6 w-6 text-red-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Sensação</div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{weatherData.temperature + (Math.random() > 0.5 ? 2 : -2)}°C</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="forecast" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {weatherData.forecast.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {renderWeatherIcon(day.condition)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">{day.day}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{getWeatherDescription(day.condition)}</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        {day.temperature}°C
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma localização selecionada</p>
          </div>
        )}
      </div>

      <div className="p-2 text-xs text-right text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Dados atualizados às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </Card>
  );
}