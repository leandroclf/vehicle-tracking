'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

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
  client?: SupabaseClient;
  enabled?: boolean;
}

/**
 * Hook personalizado para gerenciar inscrições do Supabase Realtime
 * 
 * @param channelName Nome único para o canal
 * @param config Configuração da inscrição (tabela, evento, filtro)
 * @param callback Função a ser chamada quando ocorrer um evento
 * @param client Cliente Supabase opcional (usa o padrão se não fornecido)
 * @param enabled Controla se a inscrição está ativa
 */
export const useRealtimeSubscription = ({
  channelName,
  config,
  callback,
  client = supabase,
  enabled = true
}: UseRealtimeSubscriptionProps) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<'SUBSCRIBED' | 'UNSUBSCRIBED' | 'ERROR'>('UNSUBSCRIBED');
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  
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

  // Usar uma ref para o estado do canal para evitar dependências cíclicas
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !userIdRef.current) return;

    try {
      // Limpar canal anterior se existir
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      
      // Criar um canal com o nome fornecido
      const realtimeChannel = client
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event: config.event,
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter,
          }, 
          stableCallback
        )
        .subscribe((newStatus) => {
          if (newStatus === 'SUBSCRIBED') {
            setStatus('SUBSCRIBED');
          } else if (newStatus === 'CHANNEL_ERROR') {
            setStatus('ERROR');
            setError(new Error('Erro ao se inscrever no canal'));
          }
        });

      // Armazenar canal na ref e no estado
      channelRef.current = realtimeChannel;
      setChannel(realtimeChannel);

      // Limpar inscrição ao desmontar
      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
          setStatus('UNSUBSCRIBED');
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido na inscrição'));
      setStatus('ERROR');
    }
  // Remover 'user' da matriz de dependências para evitar loops
  }, [channelName, enabled, client, stableCallback, config.event, config.schema, config.table, config.filter]);

  // Função para cancelar a inscrição manualmente
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setChannel(null);
      setStatus('UNSUBSCRIBED');
    }
  }, []);

  return { status, error, unsubscribe };
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
  // Adicionar timestamp para evitar colisões em múltiplas renderizações
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
  
  const stableCallback = useCallback((vehicle: any) => {
    if (callbackRef.current) {
      callbackRef.current(vehicle);
    }
  }, []);
  
  const filter = userId ? `user_id=eq.${userId}` : undefined;
  
  return useTableSubscription(
    'vehicles',
    event,
    stableCallback,
    filter,
    enabled && !!userId
  );
};

/**
 * Hook para se inscrever em novos alertas
 */
export const useAlertsSubscription = (
  callback: (alert: any) => void,
  event: SubscriptionEvent = 'INSERT',
  enabled = true
) => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Estabilizar o callback usando useRef
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const stableCallback = useCallback((alert: any) => {
    if (callbackRef.current) {
      callbackRef.current(alert);
    }
  }, []);
  
  const filter = userId ? `user_id=eq.${userId}` : undefined;
  
  return useTableSubscription(
    'alerts',
    event,
    stableCallback,
    filter,
    enabled && !!userId
  );
};

/**
 * Hook para se inscrever em atualizações de geocercas
 */
export const useGeofencesSubscription = (
  callback: (geofence: any) => void,
  event: SubscriptionEvent = '*',
  enabled = true
) => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Estabilizar o callback usando useRef
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const stableCallback = useCallback((geofence: any) => {
    if (callbackRef.current) {
      callbackRef.current(geofence);
    }
  }, []);
  
  const filter = userId ? `user_id=eq.${userId}` : undefined;
  
  return useTableSubscription(
    'geofences',
    event,
    stableCallback,
    filter,
    enabled && !!userId
  );
};

export default useRealtimeSubscription;