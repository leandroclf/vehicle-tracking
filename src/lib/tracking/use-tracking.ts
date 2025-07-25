/**
 * Hook React para integração com o serviço de rastreamento
 * 
 * Este hook fornece uma interface React para o TrackingService,
 * gerenciando estado, subscrições e atualizações em tempo real.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingService, Position, VehicleStatus, Trip, TrackingEvent } from './tracking-service';

export interface UseTrackingOptions {
  vehicleId?: number;
  autoStart?: boolean;
  enableRealtime?: boolean;
}

export interface TrackingState {
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
  lastPosition: Position | null;
  vehicleStatus: VehicleStatus | null;
  currentTrip: Trip | null;
  recentEvents: TrackingEvent[];
}

/**
 * Hook principal para rastreamento de veículos
 */
export function useTracking(options: UseTrackingOptions = {}) {
  const { vehicleId, autoStart = false, enableRealtime = true } = options;
  
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    isLoading: false,
    error: null,
    lastPosition: null,
    vehicleStatus: null,
    currentTrip: null,
    recentEvents: []
  });

  const callbacksRef = useRef<{
    onPositionUpdate?: (position: Position) => void;
    onStatusUpdate?: (status: VehicleStatus) => void;
    onEventUpdate?: (event: TrackingEvent) => void;
  }>({});

  /**
   * Inicia o rastreamento
   */
  const startTracking = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (enableRealtime) {
        await trackingService.startTracking();
      }
      
      setState(prev => ({ ...prev, isTracking: true, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar rastreamento'
      }));
    }
  }, [enableRealtime]);

  /**
   * Para o rastreamento
   */
  const stopTracking = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (enableRealtime) {
        await trackingService.stopTracking();
      }
      
      setState(prev => ({ ...prev, isTracking: false, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao parar rastreamento'
      }));
    }
  }, [enableRealtime]);

  /**
   * Carrega dados iniciais do veículo
   */
  const loadVehicleData = useCallback(async (vId: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Carregar última posição
      const lastPosition = await trackingService.getLatestPosition(vId);
      
      // Carregar status do veículo
      const vehicleStatus = await trackingService.getVehicleStatus(vId);
      
      // Carregar viagem atual (se houver)
      const trips = await trackingService.getVehicleTrips(vId);
      const currentTrip = trips.find(trip => !trip.end_time) || null;
      
      // Carregar eventos recentes
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Últimas 24h
      const recentEvents = await trackingService.getVehicleEvents(vId, undefined, startDate, endDate);

      setState(prev => ({
        ...prev,
        lastPosition,
        vehicleStatus,
        currentTrip,
        recentEvents: recentEvents.slice(0, 10), // Últimos 10 eventos
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados do veículo'
      }));
    }
  }, []);

  /**
   * Manipulador de atualização de posição
   */
  const handlePositionUpdate = useCallback((position: Position) => {
    if (!vehicleId || position.vehicle_id === vehicleId) {
      setState(prev => ({ ...prev, lastPosition: position }));
      callbacksRef.current.onPositionUpdate?.(position);
    }
  }, [vehicleId]);

  /**
   * Manipulador de atualização de status
   */
  const handleStatusUpdate = useCallback((status: VehicleStatus) => {
    if (!vehicleId || status.vehicle_id === vehicleId) {
      setState(prev => ({ ...prev, vehicleStatus: status }));
      callbacksRef.current.onStatusUpdate?.(status);
    }
  }, [vehicleId]);

  /**
   * Manipulador de eventos de rastreamento
   */
  const handleEventUpdate = useCallback((event: TrackingEvent) => {
    if (!vehicleId || event.vehicle_id === vehicleId) {
      setState(prev => ({
        ...prev,
        recentEvents: [event, ...prev.recentEvents.slice(0, 9)]
      }));
      callbacksRef.current.onEventUpdate?.(event);
    }
  }, [vehicleId]);

  /**
   * Registra callbacks para eventos
   */
  const setCallbacks = useCallback((callbacks: {
    onPositionUpdate?: (position: Position) => void;
    onStatusUpdate?: (status: VehicleStatus) => void;
    onEventUpdate?: (event: TrackingEvent) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);

  /**
   * Obtém histórico de posições
   */
  const getPositionHistory = useCallback(async (
    vId: number,
    startTime: string,
    endTime: string,
    limit?: number
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const history = await trackingService.getPositionHistory(vId, startTime, endTime, limit);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return history;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar histórico'
      }));
      return [];
    }
  }, []);

  /**
   * Obtém viagens do veículo
   */
  const getTrips = useCallback(async (
    vId: number,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const trips = await trackingService.getVehicleTrips(vId, startDate, endDate);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return trips;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar viagens'
      }));
      return [];
    }
  }, []);

  /**
   * Obtém eventos do veículo
   */
  const getEvents = useCallback(async (
    vId: number,
    eventType?: string,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const events = await trackingService.getVehicleEvents(vId, eventType, startDate, endDate);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return events;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar eventos'
      }));
      return [];
    }
  }, []);

  /**
   * Limpa erros
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Efeito para configurar subscrições em tempo real
  useEffect(() => {
    if (enableRealtime) {
      trackingService.on('position_update', handlePositionUpdate);
      trackingService.on('status_update', handleStatusUpdate);
      trackingService.on('tracking_event', handleEventUpdate);

      return () => {
        trackingService.off('position_update', handlePositionUpdate);
        trackingService.off('status_update', handleStatusUpdate);
        trackingService.off('tracking_event', handleEventUpdate);
      };
    }
  }, [enableRealtime, handlePositionUpdate, handleStatusUpdate, handleEventUpdate]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (vehicleId) {
      loadVehicleData(vehicleId);
    }
  }, [vehicleId, loadVehicleData]);

  // Efeito para auto-start
  useEffect(() => {
    if (autoStart && !state.isTracking) {
      startTracking();
    }
  }, [autoStart, state.isTracking, startTracking]);

  return {
    // Estado
    ...state,
    
    // Ações
    startTracking,
    stopTracking,
    loadVehicleData,
    setCallbacks,
    clearError,
    
    // Consultas
    getPositionHistory,
    getTrips,
    getEvents
  };
}

/**
 * Hook para rastreamento de múltiplos veículos
 */
export function useMultiVehicleTracking(vehicleIds: number[] = []) {
  const [vehicles, setVehicles] = useState<Map<number, TrackingState>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega dados de todos os veículos
   */
  const loadAllVehicles = useCallback(async () => {
    if (vehicleIds.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      const vehicleData = new Map<number, TrackingState>();

      for (const vehicleId of vehicleIds) {
        try {
          const lastPosition = await trackingService.getLatestPosition(vehicleId);
          const vehicleStatus = await trackingService.getVehicleStatus(vehicleId);
          const trips = await trackingService.getVehicleTrips(vehicleId);
          const currentTrip = trips.find(trip => !trip.end_time) || null;

          vehicleData.set(vehicleId, {
            isTracking: false,
            isLoading: false,
            error: null,
            lastPosition,
            vehicleStatus,
            currentTrip,
            recentEvents: []
          });
        } catch (vehicleError) {
          vehicleData.set(vehicleId, {
            isTracking: false,
            isLoading: false,
            error: vehicleError instanceof Error ? vehicleError.message : 'Erro desconhecido',
            lastPosition: null,
            vehicleStatus: null,
            currentTrip: null,
            recentEvents: []
          });
        }
      }

      setVehicles(vehicleData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao carregar veículos');
    } finally {
      setIsLoading(false);
    }
  }, [vehicleIds]);

  /**
   * Manipulador de atualização de posição para múltiplos veículos
   */
  const handlePositionUpdate = useCallback((position: Position) => {
    if (vehicleIds.includes(position.vehicle_id)) {
      setVehicles(prev => {
        const newMap = new Map(prev);
        const vehicleState = newMap.get(position.vehicle_id);
        if (vehicleState) {
          newMap.set(position.vehicle_id, {
            ...vehicleState,
            lastPosition: position
          });
        }
        return newMap;
      });
    }
  }, [vehicleIds]);

  /**
   * Manipulador de atualização de status para múltiplos veículos
   */
  const handleStatusUpdate = useCallback((status: VehicleStatus) => {
    if (vehicleIds.includes(status.vehicle_id)) {
      setVehicles(prev => {
        const newMap = new Map(prev);
        const vehicleState = newMap.get(status.vehicle_id);
        if (vehicleState) {
          newMap.set(status.vehicle_id, {
            ...vehicleState,
            vehicleStatus: status
          });
        }
        return newMap;
      });
    }
  }, [vehicleIds]);

  // Efeito para configurar subscrições
  useEffect(() => {
    trackingService.on('position_update', handlePositionUpdate);
    trackingService.on('status_update', handleStatusUpdate);

    return () => {
      trackingService.off('position_update', handlePositionUpdate);
      trackingService.off('status_update', handleStatusUpdate);
    };
  }, [handlePositionUpdate, handleStatusUpdate]);

  // Efeito para carregar dados quando os IDs mudam
  useEffect(() => {
    loadAllVehicles();
  }, [loadAllVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    loadAllVehicles,
    clearError: () => setError(null)
  };
}

/**
 * Hook para estatísticas de rastreamento
 */
export function useTrackingStats(vehicleId?: number) {
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalDuration: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    isLoading: false,
    error: null as string | null
  });

  const loadStats = useCallback(async (vId: number, days: number = 30) => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const trips = await trackingService.getVehicleTrips(vId, startDate, endDate);
      
      const totalTrips = trips.length;
      const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance_meters || 0), 0);
      const totalDuration = trips.reduce((sum, trip) => sum + (trip.duration_seconds || 0), 0);
      const maxSpeed = Math.max(...trips.map(trip => trip.max_speed || 0), 0);
      const averageSpeed = totalDuration > 0 ? (totalDistance / totalDuration) * 3.6 : 0; // km/h

      setStats({
        totalTrips,
        totalDistance,
        totalDuration,
        averageSpeed,
        maxSpeed,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar estatísticas'
      }));
    }
  }, []);

  useEffect(() => {
    if (vehicleId) {
      loadStats(vehicleId);
    }
  }, [vehicleId, loadStats]);

  return {
    ...stats,
    loadStats
  };
}