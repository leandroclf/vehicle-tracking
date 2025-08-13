/**
 * Serviços para integração com APIs externas e internas
 */

import { getDbPool } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// Tipos para telemetria
export interface TelemetryData {
  vehicleId: string;
  vehicleName: string;
  speed: number;
  maxSpeed: number;
  engineTemp: number;
  fuelLevel: number;
  batteryLevel: number;
  engineLoad: number;
  lastUpdate: string;
  location?: {
    lat: number;
    lng: number;
  };
}

// Tipos para clima
export interface WeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
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

export interface LocationOption {
  id: string;
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Tipos para geocercas
export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: 'circle' | 'polygon' | 'rectangle';
  color: string;
  coordinates: Array<{lat: number; lng: number}>;
  radius?: number; // Para geocercas do tipo círculo
  createdAt: string;
  updatedAt: string;
  alerts: boolean; // Se deve gerar alertas quando veículos entrarem/saírem
}

// Tipos para rotas
export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export interface VehicleRoute {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  distance: number; // em km
  duration: number; // em minutos
  points: RoutePoint[];
  averageSpeed: number;
  maxSpeed: number;
}

// Tipos para agrupamento de veículos
export interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  vehicleIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Serviço de Telemetria
 */
export const TelemetryService = {
  /**
   * Obtém dados de telemetria para todos os veículos ou um veículo específico
   */
  async getTelemetryData(vehicleId?: string): Promise<TelemetryData[]> {
    try {
      // TODO: Migrado do Supabase para PostgreSQL direto
      // TODO: Implementar query SQL direta
    let query = null; // pool.query.from('vehicle_telemetry').select('*');
      
      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }
      
      const { data, error } = await query.order('last_update', { ascending: false });
      
      if (error) throw error;
      
      // Transformar dados do banco para o formato esperado pelo widget
      return data.map(item => ({
        vehicleId: item.vehicle_id,
        vehicleName: item.vehicle_name,
        speed: item.speed,
        maxSpeed: item.max_speed,
        engineTemp: item.engine_temp,
        fuelLevel: item.fuel_level,
        batteryLevel: item.battery_level,
        engineLoad: item.engine_load,
        lastUpdate: item.last_update,
        location: item.location ? {
          lat: item.location.lat,
          lng: item.location.lng
        } : undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar dados de telemetria:', error);
      
      // Fallback para dados simulados em caso de erro
      return [
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
          location: {
            lat: -23.550520,
            lng: -46.633308
          }
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
          location: {
            lat: -23.557321,
            lng: -46.639331
          }
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
          location: {
            lat: -23.563219,
            lng: -46.652541
          }
        }
      ];
    }
  },
  
  /**
   * Obtém histórico de telemetria para um veículo específico
   */
  async getTelemetryHistory(vehicleId: string, period: 'day' | 'week' | 'month'): Promise<any[]> {
    try {
      // Definir intervalo de tempo baseado no período
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      // Buscar dados históricos
      // TODO: Implementar query SQL direta
    const data = null;`r`n    const error = null;`r`n    // await pool.query(...)
        .from('vehicle_telemetry_history')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', now.toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico de telemetria:', error);
      
      // Gerar dados simulados para demonstração
      const historyPoints = [];
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      // Número de pontos a gerar
      const pointCount = period === 'day' ? 24 : period === 'week' ? 7 : 30;
      const interval = (now.getTime() - startDate.getTime()) / pointCount;
      
      for (let i = 0; i < pointCount; i++) {
        const timestamp = new Date(startDate.getTime() + (interval * i));
        
        historyPoints.push({
          vehicle_id: vehicleId,
          timestamp: timestamp.toISOString(),
          speed: Math.floor(Math.random() * 100),
          fuel_level: Math.floor(Math.random() * 100),
          engine_temp: Math.floor(Math.random() * 30) + 70,
          location: {
            lat: -23.55 + (Math.random() * 0.1),
            lng: -46.63 + (Math.random() * 0.1)
          }
        });
      }
      
      return historyPoints;
    }
  }
};

/**
 * Serviço de Clima
 */
export const WeatherService = {
  /**
   * Obtém localizações disponíveis para previsão do tempo
   */
  async getLocations(): Promise<LocationOption[]> {
    try {
      // Em produção, buscar localizações do banco de dados
      // TODO: Implementar query SQL direta
    const data = null;`r`n    const error = null;`r`n    // await pool.query(...)
        .from('vehicle_locations')
        .select('id, name, coordinates')
        .order('name');
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        coordinates: item.coordinates
      }));
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
      
      // Fallback para dados simulados
      return [
        { id: 'sao-paulo', name: 'São Paulo, SP', coordinates: { lat: -23.550520, lng: -46.633308 } },
        { id: 'rio-de-janeiro', name: 'Rio de Janeiro, RJ', coordinates: { lat: -22.906847, lng: -43.172897 } },
        { id: 'belo-horizonte', name: 'Belo Horizonte, MG', coordinates: { lat: -19.916681, lng: -43.934493 } },
        { id: 'brasilia', name: 'Brasília, DF', coordinates: { lat: -15.793889, lng: -47.882778 } },
        { id: 'curitiba', name: 'Curitiba, PR', coordinates: { lat: -25.428954, lng: -49.271944 } }
      ];
    }
  },
  
  /**
   * Obtém dados meteorológicos para uma localização específica
   * Em produção, integrar com API de clima como OpenWeatherMap ou WeatherAPI
   */
  async getWeatherData(locationId: string): Promise<WeatherData | null> {
    try {
      // Simular chamada à API externa
      // Em produção, usar fetch para API real
      // const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${locationId}&days=5`);
      // const data = await response.json();
      
      // Buscar localização para obter nome
      const locations = await this.getLocations();
      const location = locations.find(loc => loc.id === locationId);
      
      if (!location) return null;
      
      // Gerar dados simulados para demonstração
      const conditions: Array<'clear' | 'cloudy' | 'rain' | 'storm' | 'fog'> = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const today = new Date();
      const forecast = [];
      
      for (let i = 0; i < 5; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(today.getDate() + i);
        
        forecast.push({
          day: i === 0 ? 'Hoje' : weekdays[forecastDate.getDay()],
          temperature: Math.floor(Math.random() * 15) + 15,
          condition: conditions[Math.floor(Math.random() * conditions.length)]
        });
      }
      
      return {
        location: location.name,
        coordinates: location.coordinates,
        temperature: Math.floor(Math.random() * 15) + 15,
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 30) + 5,
        precipitation: Math.floor(Math.random() * 80),
        forecast
      };
    } catch (error) {
      console.error('Erro ao buscar dados meteorológicos:', error);
      return null;
    }
  },
  
  /**
   * Obtém dados meteorológicos para múltiplas localizações
   */
  async getMultiLocationWeather(locationIds: string[]): Promise<Record<string, WeatherData>> {
    const result: Record<string, WeatherData> = {};
    
    for (const locationId of locationIds) {
      const data = await this.getWeatherData(locationId);
      if (data) {
        result[locationId] = data;
      }
    }
    
    return result;
  }
};