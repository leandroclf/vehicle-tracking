'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { RealtimeConnectionManager, ConnectionState, LogLevel } from '../realtime-connection-manager';
import { RealtimeEvent } from '../realtime/websocket-client';

// Tipos de entidades que podem ser monitoradas em tempo real
export type RealtimeEntity = 'vehicles' | 'drivers' | 'geofences' | 'alerts' | 'reports' | 'notifications';

// Tipos de eventos que podem ser monitorados
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// Interface para configuração de assinatura
export interface SubscriptionConfig {
  entity: RealtimeEntity;
  event?: RealtimeEvent;
  filter?: string;
  filterValue?: any;
  schema?: string;
}

// Interface para o retorno do hook
export interface RealtimeConnectionResult<T> {
  subscribe: (config: SubscriptionConfig, callback: (payload: RealtimeEvent<T>) => void) => Promise<string>;
  unsubscribe: (channelName: string) => Promise<void>;
  unsubscribeAll: () => Promise<void>;
  connectionState: ConnectionState;
  connectionStats: Record<string, any>;
  error: Error | null;
}

// Configurações para o hook
export interface UseRealtimeConnectionOptions {
  initialReconnectDelay?: number;
  reconnectBackoffFactor?: number;
  maxReconnectAttempts?: number;
  healthCheckInterval?: number;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onConnectionError?: (error: Error) => void;
  logger?: (level: LogLevel, message: string, context?: Record<string, any>) => void;
}

/**
 * Hook personalizado para gerenciar conexões Realtime com WebSockets
 * 
 * Este hook utiliza o RealtimeConnectionManager para fornecer uma interface
 * amigável para os componentes React, com recursos de reconexão automática,
 * verificação de saúde e sincronização de dados.
 * 
 * @param wsUrl URL do servidor WebSocket
 * @param options Opções de configuração para o gerenciador de conexão
 * @returns Interface para gerenciar assinaturas e monitorar o estado da conexão
 */
export function useRealtimeConnection<T>(
  wsUrl: string,
  options: UseRealtimeConnectionOptions = {}
): RealtimeConnectionResult<T> {
  // Referência para o gerenciador de conexão
  const managerRef = useRef<RealtimeConnectionManager | null>(null);
  
  // Estado para armazenar erros
  const [error, setError] = useState<Error | null>(null);
  
  // Estado para armazenar o estado da conexão
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  
  // Estado para armazenar estatísticas da conexão
  const [connectionStats, setConnectionStats] = useState<Record<string, any>>({});
  
  // Inicializar o gerenciador de conexão
  useEffect(() => {
    // Callback para mudanças de estado da conexão
    const handleConnectionStateChange = (state: ConnectionState) => {
      setConnectionState(state);
      if (options.onConnectionStateChange) {
        options.onConnectionStateChange(state);
      }
    };
    
    // Callback para erros de conexão
    const handleConnectionError = (err: Error) => {
      setError(err);
      if (options.onConnectionError) {
        options.onConnectionError(err);
      }
    };
    
    // Criar instância do gerenciador de conexão
    const manager = new RealtimeConnectionManager(wsUrl, {
      ...options,
      onConnectionStateChange: handleConnectionStateChange,
      onConnectionError: handleConnectionError
    });
    
    managerRef.current = manager;
    
    // Atualizar estatísticas periodicamente
    const statsInterval = setInterval(() => {
      if (managerRef.current) {
        setConnectionStats(managerRef.current.getStats());
      }
    }, 5000);
    
    // Limpar recursos ao desmontar
    return () => {
      clearInterval(statsInterval);
      if (managerRef.current) {
        managerRef.current.cleanup();
        managerRef.current = null;
      }
    };
  }, [wsUrl]);
  
  // Função para assinar um canal
  const subscribe = useCallback(async (
    config: SubscriptionConfig,
    callback: (payload: RealtimeEvent<T>) => void
  ): Promise<string> => {
    if (!managerRef.current) {
      throw new Error('Gerenciador de conexão não inicializado');
    }
    
    try {
      const channelName = await managerRef.current.subscribe({
        entity: config.entity,
        event: config.event,
        schema: config.schema,
        filter: config.filter,
        filterValue: config.filterValue,
        callback
      });
      
      return channelName;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);
  
  // Função para cancelar assinatura de um canal
  const unsubscribe = useCallback(async (channelName: string): Promise<void> => {
    if (!managerRef.current) {
      return;
    }
    
    try {
      await managerRef.current.unsubscribe(channelName);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);
  
  // Função para cancelar todas as assinaturas
  const unsubscribeAll = useCallback(async (): Promise<void> => {
    if (!managerRef.current) {
      return;
    }
    
    try {
      await managerRef.current.unsubscribeAll();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);
  
  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
    connectionState,
    connectionStats,
    error
  };
}

/**
 * Hook simplificado para assinatura em uma única entidade
 * 
 * Este hook é uma abstração sobre o useRealtimeConnection que facilita
 * a assinatura em uma única entidade, gerenciando automaticamente o ciclo de vida
 * da assinatura.
 * 
 * @param wsUrl URL do servidor WebSocket
 * @param config Configuração da assinatura
 * @param callback Função a ser chamada quando ocorrer um evento
 * @param options Opções de configuração para o gerenciador de conexão
 * @returns Estado da conexão e funções para gerenciar a assinatura
 */
export function useRealtimeSubscription<T>(
  wsUrl: string,
  config: SubscriptionConfig,
  callback: (payload: RealtimeEvent<T>) => void,
  options: UseRealtimeConnectionOptions = {}
) {
  const {
    subscribe,
    unsubscribe,
    connectionState,
    connectionStats,
    error
  } = useRealtimeConnection<T>(wsUrl, options);
  
  // Referência para o nome do canal
  const channelNameRef = useRef<string | null>(null);
  
  // Estabilizar o callback usando useRef
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Criar uma versão estável do callback
  const stableCallback = useCallback((payload: RealtimeEvent<T>) => {
    callbackRef.current(payload);
  }, []);
  
  // Configurar assinatura
  useEffect(() => {
    const setupSubscription = async () => {
      try {
        // Cancelar assinatura anterior se existir
        if (channelNameRef.current) {
          await unsubscribe(channelNameRef.current);
          channelNameRef.current = null;
        }
        
        // Criar nova assinatura
        const channelName = await subscribe(config, stableCallback);
        channelNameRef.current = channelName;
      } catch (err) {
        console.error('Erro ao configurar assinatura:', err);
      }
    };
    
    setupSubscription();
    
    // Limpar assinatura ao desmontar
    return () => {
      if (channelNameRef.current) {
        unsubscribe(channelNameRef.current).catch(err => {
          console.error('Erro ao cancelar assinatura:', err);
        });
      }
    };
  }, [subscribe, unsubscribe, config.entity, config.event, config.filter, config.filterValue, stableCallback]);
  
  return {
    connectionState,
    connectionStats,
    error,
    isConnected: connectionState === 'CONNECTED',
    isReconnecting: connectionState === 'RECONNECTING',
    hasError: !!error || connectionState === 'FAILED'
  };
}