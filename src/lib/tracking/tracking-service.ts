/**
 * Serviço de Rastreamento GPS - Yukz Vehicle Tracking
 * 
 * Este serviço gerencia o rastreamento em tempo real dos veículos,
 * incluindo processamento de posições GPS, cálculo de viagens,
 * detecção de eventos e alertas.
 */

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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

/**
 * Classe principal do serviço de rastreamento
 */
export class TrackingService {
  private realtimeChannel: RealtimeChannel | null = null;
  private isListening = false;
  private eventCallbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeRealtimeSubscription();
  }

  /**
   * Inicializa a subscrição em tempo real
   */
  private initializeRealtimeSubscription() {
    this.realtimeChannel = supabase
      .channel('vehicle-tracking')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'positions' },
        (payload) => this.handlePositionUpdate(payload.new as Position)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vehicle_status' },
        (payload) => this.handleStatusUpdate(payload.new as VehicleStatus)
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => this.handleEventUpdate(payload.new as TrackingEvent)
      );
  }

  /**
   * Inicia o monitoramento em tempo real
   */
  async startTracking(): Promise<void> {
    if (!this.isListening && this.realtimeChannel) {
      await this.realtimeChannel.subscribe();
      this.isListening = true;
      console.log('Rastreamento em tempo real iniciado');
    }
  }

  /**
   * Para o monitoramento em tempo real
   */
  async stopTracking(): Promise<void> {
    if (this.isListening && this.realtimeChannel) {
      await this.realtimeChannel.unsubscribe();
      this.isListening = false;
      console.log('Rastreamento em tempo real parado');
    }
  }

  /**
   * Registra um callback para eventos específicos
   */
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Remove um callback de evento
   */
  off(event: string, callback: Function): void {
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
    // Buscar configurações de alerta de velocidade do usuário
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('user_id')
      .eq('id', position.vehicle_id)
      .single();

    if (!vehicle) return;

    const { data: settings } = await supabase
      .from('settings')
      .select('speed_alert_enabled, speed_alert_value')
      .eq('user_id', vehicle.user_id)
      .single();

    if (settings?.speed_alert_enabled && position.speed > (settings.speed_alert_value || 120)) {
      await this.createEvent({
        vehicle_id: position.vehicle_id,
        type: 'speed_alert',
        timestamp: position.timestamp,
        lat: position.latitude,
        lng: position.longitude,
        speed: position.speed,
        details: {
          speed_limit: settings.speed_alert_value,
          exceeded_by: position.speed - settings.speed_alert_value
        }
      });
    }
  }

  /**
   * Verifica geocercas
   */
  private async checkGeofences(position: Position): Promise<void> {
    // Buscar geocercas do usuário
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('user_id')
      .eq('id', position.vehicle_id)
      .single();

    if (!vehicle) return;

    const { data: geofences } = await supabase
      .from('geofences')
      .select('*')
      .eq('user_id', vehicle.user_id);

    if (!geofences) return;

    for (const geofence of geofences) {
      const isInside = this.isPointInGeofence(
        position.latitude,
        position.longitude,
        geofence
      );

      // Verificar se houve mudança de estado (entrada/saída)
      // Isso requereria armazenar o estado anterior, que pode ser implementado
      // usando uma cache ou consultando a última posição
    }
  }

  /**
   * Verifica se um ponto está dentro de uma geocerca
   */
  private isPointInGeofence(lat: number, lng: number, geofence: any): boolean {
    if (geofence.type === 'circle') {
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
    // Buscar viagem ativa (sem end_time)
    const { data: activeTrip } = await supabase
      .from('trips')
      .select('*')
      .eq('vehicle_id', position.vehicle_id)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

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

    const { error } = await supabase
      .from('trips')
      .insert(trip);

    if (error) {
      console.error('Erro ao iniciar viagem:', error);
    } else {
      await this.createEvent({
        vehicle_id: position.vehicle_id,
        type: 'movement_start',
        timestamp: position.timestamp,
        lat: position.latitude,
        lng: position.longitude
      });
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

    await supabase
      .from('trips')
      .update(updates)
      .eq('id', trip.id);
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

    const { error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', trip.id);

    if (error) {
      console.error('Erro ao finalizar viagem:', error);
    } else {
      await this.createEvent({
        vehicle_id: position.vehicle_id,
        type: 'movement_stop',
        timestamp: position.timestamp,
        lat: position.latitude,
        lng: position.longitude
      });
    }
  }

  /**
   * Cria um evento de rastreamento
   */
  private async createEvent(event: Partial<TrackingEvent>): Promise<void> {
    const { error } = await supabase
      .from('events')
      .insert(event);

    if (error) {
      console.error('Erro ao criar evento:', error);
    }
  }

  /**
   * API pública para inserir uma nova posição
   */
  async insertPosition(position: Omit<Position, 'id'>): Promise<Position | null> {
    const { data, error } = await supabase
      .from('positions')
      .insert(position)
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir posição:', error);
      return null;
    }

    return data;
  }

  /**
   * Obtém a última posição de um veículo
   */
  async getLatestPosition(vehicleId: number): Promise<Position | null> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar última posição:', error);
      return null;
    }

    return data;
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
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('timestamp', startTime)
      .lte('timestamp', endTime)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico de posições:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtém status atual de um veículo
   */
  async getVehicleStatus(vehicleId: number): Promise<VehicleStatus | null> {
    const { data, error } = await supabase
      .from('vehicle_status')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();

    if (error) {
      console.error('Erro ao buscar status do veículo:', error);
      return null;
    }

    return data;
  }

  /**
   * Obtém viagens de um veículo
   */
  async getVehicleTrips(
    vehicleId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Trip[]> {
    let query = supabase
      .from('trips')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) {
      console.error('Erro ao buscar viagens:', error);
      return [];
    }

    return data || [];
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
    let query = supabase
      .from('events')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (eventType) {
      query = query.eq('type', eventType);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }

    return data || [];
  }
}

// Instância singleton do serviço de rastreamento
export const trackingService = new TrackingService();