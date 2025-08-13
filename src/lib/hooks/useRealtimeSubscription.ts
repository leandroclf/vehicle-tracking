'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';

type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionConfig {
  schema?: string;
  table: string;
  event: SubscriptionEvent;
  filter?: string;
}

interface UseRealtimeSubscriptionProps {
  channelName: string;
  config: SubscriptionConfig;
  callback: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Hook personalizado para gerenciar inscrições WebSocket Realtime
 * 
 * @param channelName Nome único para o canal
 * @param config Configuração da inscrição (tabela, evento, filtro)
 * @param callback Função a ser chamada quando ocorrer um evento
 * @param enabled Controla se a inscrição está ativa
 */
export const useRealtimeSubscription = ({
  channelName,
  config,
  callback,
  enabled = true
}: UseRealtimeSubscriptionProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED');
  const [error, setError] = useState<Error | null>(null);
  const { user, token } = useAuth();
  
  // Armazenar userId em uma ref para evitar re-renderizações desnecessárias
  const userIdRef = useRef<string | null>(null);
  
  // Atualizar userIdRef quando o user mudar
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);
  
  // Usar uma ref para armazenar a versão mais recente do callback
  const callbackRef = useRef(callback);
  
  // Atualizar a ref quando o callback mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Criar uma versão estável do callback com useCallback
  const stableCallback = useCallback((payload: any) => {
    callbackRef.current(payload);
  }, []);

  // Usar uma ref para o estado do socket para evitar dependências cíclicas
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || !userIdRef.current || !token) return;

    try {
      // Limpar socket anterior se existir
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Criar conexão WebSocket
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      
      ws.onopen = () => {
        setStatus('CONNECTED');
        setError(null);
        
        // Enviar configuração de inscrição
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: channelName,
          config: {
            table: config.table,
            event: config.event,
            filter: config.filter,
            schema: config.schema || 'public'
          }
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.channel === channelName) {
            stableCallback(data.payload);
          }
        } catch (err) {
          console.error('Erro ao processar mensagem WebSocket:', err);
        }
      };
      
      ws.onerror = (error) => {
        setStatus('ERROR');
        setError(new Error('Erro na conexão WebSocket'));
      };
      
      ws.onclose = () => {
        setStatus('DISCONNECTED');
      };

      // Armazenar socket na ref e no estado
      socketRef.current = ws;
      setSocket(ws);

      // Limpar conexão ao desmontar
      return () => {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
          setStatus('DISCONNECTED');
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido na conexão'));
      setStatus('ERROR');
    }
  }, [channelName, enabled, token, stableCallback, config.event, config.schema, config.table, config.filter]);

  // Função para desconectar manualmente
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setStatus('DISCONNECTED');
    }
  }, []);

  return { status, error, disconnect };
};

/**
 * Hook para se inscrever em atualizações de uma tabela específica
 */
export const useTableSubscription = <T extends Record<string, any>>(
  table: string,
  event: SubscriptionEvent = '*',
  callback: (record: T) => void,
  filter?: string,
  enabled = true
) => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Usar uma string estável como nome do canal, usando userId como parte do nome
  const channelNameRef = useRef(`${table}-${userId || 'anonymous'}-${event}-${Date.now()}`);
  
  // Estabilizar o callback usando useCallback e useRef
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const stableCallback = useCallback((payload: any) => {
    if (callbackRef.current) {
      callbackRef.current(payload.new as T);
    }
  }, []);
  
  return useRealtimeSubscription({
    channelName: channelNameRef.current,
    config: {
      table,
      event,
      filter
    },
    callback: stableCallback,
    enabled: enabled && !!userId
  });
};

/**
 * Hook para se inscrever em atualizações de veículos
 */
export const useVehiclesSubscription = (
  callback: (vehicle: any) => void,
  event: SubscriptionEvent = 'UPDATE',
  enabled = true
) => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Estabilizar o callback usando useRef
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const stableCallback = useCallback((payload: any) => {
    if (callbackRef.current) {
      callbackRef.current(payload.new);
    }
  }, []);
  
  return useRealtimeSubscription({
    channelName: `vehicles-${userId}-${event}`,
    config: {
      table: 'vehicles',
      event,
      filter: userId ? `user_id=eq.${userId}` : undefined
    },
    callback: stableCallback,
    enabled: enabled && !!userId
  });
};

/**
 * Hook para se inscrever em atualizações de posições GPS
 */
export const useGpsPositionsSubscription = (
  vehicleId: string,
  callback: (position: any) => void,
  enabled = true
) => {
  const { user } = useAuth();
  const userId = user?.id;
  
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const stableCallback = useCallback((payload: any) => {
    if (callbackRef.current) {
      callbackRef.current(payload.new);
    }
  }, []);
  
  return useRealtimeSubscription({
    channelName: `gps-positions-${vehicleId}-${userId}`,
    config: {
      table: 'gps_positions',
      event: 'INSERT',
      filter: `vehicle_id=eq.${vehicleId}`
    },
    callback: stableCallback,
    enabled: enabled && !!userId && !!vehicleId
  });
};

/**
 * Hook para se inscrever em alertas
 */
export const useAlertsSubscription = (
  callback: (alert: any) => void,
  enabled = true
) => {
  const { user } = useAuth();
  const userId = user?.id;
  
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const stableCallback = useCallback((payload: any) => {
    if (callbackRef.current) {
      callbackRef.current(payload.new);
    }
  }, []);
  
  return useRealtimeSubscription({
    channelName: `alerts-${userId}`,
    config: {
      table: 'alerts',
      event: 'INSERT',
      filter: userId ? `user_id=eq.${userId}` : undefined
    },
    callback: stableCallback,
    enabled: enabled && !!userId
  });
};