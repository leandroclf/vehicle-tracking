/**
 * Serviço de Rastreamento GPS - Yukz Vehicle Tracking
 * 
 * Este serviço gerencia o rastreamento em tempo real dos veículos,
 * incluindo processamento de posições GPS, cálculo de viagens,
 * detecção de eventos e alertas.
 */

import { WebSocketManager } from '../realtime/websocket-client';

// Tipos para o sistema de rastreamento
export interface Position {
  id?: number;
  vehicle_id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number;
  direction?: number;
  ignition: boolean;
  battery_level?: number;
  satellites?: number;
  accuracy?: number;
  odometer?: number;
  fuel_level?: number;
  engine_temp?: number;
  engine_load?: number;
  rpm?: number;
  voltage?: number;
  gsm_signal?: number;
  address?: string;
  raw_data?: any;
}

export interface VehicleStatus {
  vehicle_id: number;
  status: 'online' | 'offline';
  is_moving: boolean;
  last_update: string;
  lat: number;
  lng: number;
  speed: number;
  direction?: string;
  ignition: boolean;
  battery?: number;
  satellites?: number;
}

export interface Trip {
  id?: number;
  vehicle_id: number;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  distance_meters?: number;
  start_lat: number;
  start_lng: number;
  start_address?: string;
  end_lat?: number;
  end_lng?: number;
  end_address?: string;
  max_speed?: number;
  avg_speed?: number;
}

export interface TrackingEvent {
  id?: number;
  vehicle_id: number;
  trip_id?: number;
  type: 'ignition_on' | 'ignition_off' | 'speed_alert' | 'movement_start' | 
        'movement_stop' | 'panic' | 'battery_low' | 'geofence_enter' | 
        'geofence_exit' | 'location_update';
  timestamp: string;
  lat?: number;
  lng?: number;
  address?: string;
  speed?: number;
  ignition?: boolean;
  battery?: number;
  details?: any;
}

// Shape mínimo de veículo retornado pela API (usado para resolver o usuário dono)
interface VehicleApiResponse {
  user_id?: string;
}

// Configurações de alerta de velocidade do usuário
interface UserSpeedSettings {
  speed_alert_enabled?: boolean;
  speed_alert_value?: number;
}

// Geocerca retornada pela API de geocercas do usuário
interface GeofenceApiResponse {
  id?: number | string;
  type?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius_meters?: number;
}

/**
 * Classe principal do serviço de rastreamento
 */
export class TrackingService {
  private wsManager: WebSocketManager | null = null;
  private isListening = false;
  private eventCallbacks: Map<string, ((data: any) => void)[]> = new Map();
  private apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  constructor() {
    // Só inicializar WebSocket no cliente
    if (typeof window !== 'undefined') {
      this.initializeWebSocketConnection();
    }
  }

  /**
   * Inicializa a conexão WebSocket
   */
  private initializeWebSocketConnection() {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      console.warn('WebSocket não pode ser inicializado no servidor');
      return;
    }
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    this.wsManager = new WebSocketManager(wsUrl);
    
    // Configurar handlers para eventos WebSocket
    this.wsManager.onOpen(() => {
      console.log('WebSocket conectado para tracking service');
    });
    
    this.wsManager.onClose(() => {
      console.log('WebSocket desconectado para tracking service');
    });
    
    this.wsManager.onError((error: Error) => {
      console.error('Erro no WebSocket do tracking service:', error);
    });
  }

  /**
   * Inicia o monitoramento em tempo real
   */
  async startTracking(): Promise<void> {
    if (!this.isListening && this.wsManager) {
      this.wsManager.connect();
      
      // WebSocket será conectado através do RealtimeProvider
      // Os canais de rastreamento serão gerenciados pelo provider
      
      this.isListening = true;
      console.log('Rastreamento em tempo real iniciado');
    }
  }

  /**
   * Para o monitoramento em tempo real
   */
  async stopTracking(): Promise<void> {
    if (this.isListening && this.wsManager) {
      // WebSocket será desconectado através do RealtimeProvider
      // Os canais de rastreamento serão gerenciados pelo provider
      
      this.wsManager.disconnect();
      this.isListening = false;
      console.log('Rastreamento em tempo real parado');
    }
  }

  /**
   * Registra um callback para eventos específicos
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Remove um callback de evento
   */
  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emite um evento para os callbacks registrados
   */
  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Manipula atualizações de posição
   */
  private handlePositionUpdate(position: Position): void {
    this.emit('position_update', position);
    
    // Processar eventos baseados na posição
    this.processPositionEvents(position);
  }

  /**
   * Manipula atualizações de status
   */
  private handleStatusUpdate(status: VehicleStatus): void {
    this.emit('status_update', status);
  }

  /**
   * Manipula eventos de rastreamento
   */
  private handleEventUpdate(event: TrackingEvent): void {
    this.emit('tracking_event', event);
  }

  /**
   * Processa eventos baseados na posição
   */
  private async processPositionEvents(position: Position): Promise<void> {
    try {
      // Verificar alertas de velocidade
      await this.checkSpeedAlerts(position);
      
      // Verificar geocercas
      await this.checkGeofences(position);
      
      // Atualizar viagem atual
      await this.updateCurrentTrip(position);
      
    } catch (error) {
      console.error('Erro ao processar eventos de posição:', error);
    }
  }

  /**
   * Verifica alertas de velocidade
   */
  private async checkSpeedAlerts(position: Position): Promise<void> {
    try {
      // Buscar configurações de alerta de velocidade do usuário
      const vehicleResponse = await fetch(`${this.apiBaseUrl}/vehicles/${position.vehicle_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      
      if (!vehicleResponse.ok) return;

      const vehicle = await vehicleResponse.json() as VehicleApiResponse;

      const settingsResponse = await fetch(`${this.apiBaseUrl}/users/${vehicle.user_id}/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (!settingsResponse.ok) return;

      const settings = await settingsResponse.json() as UserSpeedSettings | null;

      const speedLimit = settings?.speed_alert_value || 120;

      if (settings?.speed_alert_enabled && position.speed > speedLimit) {
        await this.createEvent({
          vehicle_id: position.vehicle_id,
          type: 'speed_alert',
          timestamp: position.timestamp,
          lat: position.latitude,
          lng: position.longitude,
          speed: position.speed,
          details: {
            speed_limit: speedLimit,
            exceeded_by: position.speed - speedLimit
          }
        });
      }
    } catch (error) {
      console.error('Erro ao verificar alertas de velocidade:', error);
    }
  }

  /**
   * Verifica geocercas
   */
  private async checkGeofences(position: Position): Promise<void> {
    try {
      // Buscar geocercas do usuário
      const vehicleResponse = await fetch(`${this.apiBaseUrl}/vehicles/${position.vehicle_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      
      if (!vehicleResponse.ok) return;

      const vehicle = await vehicleResponse.json() as VehicleApiResponse;

      const geofencesResponse = await fetch(`${this.apiBaseUrl}/users/${vehicle.user_id}/geofences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (!geofencesResponse.ok) return;

      const geofences = await geofencesResponse.json() as GeofenceApiResponse[];

      for (const geofence of geofences) {
        this.isPointInGeofence(
          position.latitude,
          position.longitude,
          geofence
        );

        // Verificar se houve mudança de estado (entrada/saída)
        // Isso requereria armazenar o estado anterior, que pode ser implementado
        // usando uma cache ou consultando a última posição
      }
    } catch (error) {
      console.error('Erro ao verificar geocercas:', error);
    }
  }

  /**
   * Verifica se um ponto está dentro de uma geocerca
   */
  private isPointInGeofence(lat: number, lng: number, geofence: GeofenceApiResponse): boolean {
    if (geofence.type === 'circle' && geofence.coordinates && geofence.radius_meters !== undefined) {
      const center = geofence.coordinates;
      const distance = this.calculateDistance(
        lat, lng,
        center.latitude, center.longitude
      );
      return distance <= geofence.radius_meters;
    }
    
    // Para polígonos, implementar algoritmo ray casting
    // Por simplicidade, retornando false por enquanto
    return false;
  }

  /**
   * Calcula distância entre dois pontos em metros
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Atualiza a viagem atual do veículo
   */
  private async updateCurrentTrip(position: Position): Promise<void> {
    try {
      // Buscar viagem ativa (sem end_time)
      const response = await fetch(`${this.apiBaseUrl}/vehicles/${position.vehicle_id}/trips/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      
      const activeTrip = response.ok ? (await response.json() as Trip | null) : null;

      if (position.ignition) {
        if (!activeTrip) {
          // Iniciar nova viagem
          await this.startTrip(position);
        } else {
          // Atualizar viagem existente
          await this.updateTrip(activeTrip, position);
        }
      } else if (activeTrip) {
        // Finalizar viagem
        await this.endTrip(activeTrip, position);
      }
    } catch (error) {
      console.error('Erro ao atualizar viagem atual:', error);
    }
  }

  /**
   * Inicia uma nova viagem
   */
  private async startTrip(position: Position): Promise<void> {
    const trip: Partial<Trip> = {
      vehicle_id: position.vehicle_id,
      start_time: position.timestamp,
      start_lat: position.latitude,
      start_lng: position.longitude,
      start_address: position.address
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(trip),
      });

      if (response.ok) {
        await this.createEvent({
          vehicle_id: position.vehicle_id,
          type: 'movement_start',
          timestamp: position.timestamp,
          lat: position.latitude,
          lng: position.longitude
        });
      } else {
        console.error('Erro ao iniciar viagem:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao iniciar viagem:', error);
    }
  }

  /**
   * Atualiza uma viagem existente
   */
  private async updateTrip(trip: Trip, position: Position): Promise<void> {
    const duration = new Date(position.timestamp).getTime() - new Date(trip.start_time).getTime();
    const distance = this.calculateDistance(
      trip.start_lat, trip.start_lng,
      position.latitude, position.longitude
    );

    const updates = {
      duration_seconds: Math.floor(duration / 1000),
      distance_meters: distance,
      max_speed: Math.max(trip.max_speed || 0, position.speed)
    };

    try {
      await fetch(`${this.apiBaseUrl}/trips/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
    }
  }

  /**
   * Finaliza uma viagem
   */
  private async endTrip(trip: Trip, position: Position): Promise<void> {
    const duration = new Date(position.timestamp).getTime() - new Date(trip.start_time).getTime();
    const distance = this.calculateDistance(
      trip.start_lat, trip.start_lng,
      position.latitude, position.longitude
    );

    const updates = {
      end_time: position.timestamp,
      end_lat: position.latitude,
      end_lng: position.longitude,
      end_address: position.address,
      duration_seconds: Math.floor(duration / 1000),
      distance_meters: distance,
      avg_speed: duration > 0 ? (distance / (duration / 1000)) * 3.6 : 0 // km/h
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}/trips/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await this.createEvent({
          vehicle_id: position.vehicle_id,
          type: 'movement_stop',
          timestamp: position.timestamp,
          lat: position.latitude,
          lng: position.longitude
        });
      } else {
        console.error('Erro ao finalizar viagem:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao finalizar viagem:', error);
    }
  }

  /**
   * Cria um evento de rastreamento
   */
  private async createEvent(event: Partial<TrackingEvent>): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.error('Erro ao criar evento:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao criar evento:', error);
    }
  }

  /**
   * API pública para inserir uma nova posição
   */
  async insertPosition(position: Omit<Position, 'id'>): Promise<Position | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(position),
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Erro ao inserir posição:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Erro ao inserir posição:', error);
      return null;
    }
  }

  /**
   * Obtém a última posição de um veículo
   */
  async getLatestPosition(vehicleId: number): Promise<Position | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/vehicles/${vehicleId}/positions/latest`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Erro ao buscar última posição:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar última posição:', error);
      return null;
    }
  }

  /**
   * Obtém histórico de posições de um veículo
   */
  async getPositionHistory(
    vehicleId: number,
    startTime: string,
    endTime: string,
    limit: number = 1000
  ): Promise<Position[]> {
    try {
      const params = new URLSearchParams({
        start_time: startTime,
        end_time: endTime,
        limit: limit.toString()
      });

      const response = await fetch(`${this.apiBaseUrl}/vehicles/${vehicleId}/positions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Erro ao buscar histórico de posições:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de posições:', error);
      return [];
    }
  }

  /**
   * Obtém status atual de um veículo
   */
  async getVehicleStatus(vehicleId: number): Promise<VehicleStatus | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/vehicles/${vehicleId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Erro ao buscar status do veículo:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar status do veículo:', error);
      return null;
    }
  }

  /**
   * Obtém viagens de um veículo
   */
  async getVehicleTrips(
    vehicleId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Trip[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${this.apiBaseUrl}/vehicles/${vehicleId}/trips?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Erro ao buscar viagens:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      return [];
    }
  }

  /**
   * Obtém eventos de um veículo
   */
  async getVehicleEvents(
    vehicleId: number,
    eventType?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TrackingEvent[]> {
    try {
      const params = new URLSearchParams();
      if (eventType) params.append('event_type', eventType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${this.apiBaseUrl}/vehicles/${vehicleId}/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Erro ao buscar eventos:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  }
}

// Instância singleton do serviço de rastreamento
// Lazy initialization para evitar problemas de SSR
let trackingServiceInstance: TrackingService | null = null;

export function getTrackingService(): TrackingService {
  if (typeof window === 'undefined') {
    // No servidor, retornar um mock ou null
    throw new Error('TrackingService só pode ser usado no cliente');
  }
  
  if (!trackingServiceInstance) {
    trackingServiceInstance = new TrackingService();
  }
  
  return trackingServiceInstance;
}

// Manter compatibilidade com código existente
export const trackingService = {
  get instance() {
    return getTrackingService();
  }
};