import { useEffect, useState } from 'react';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  useEffect(() => {
    if (!enabled || !user) return;

    try {
      // Criar um canal com o nome fornecido
      const realtimeChannel = client
        .channel(channelName)
        .on('postgres_changes', {
          event: config.event,
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        }, (payload) => {
          callback(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setStatus('SUBSCRIBED');
          } else if (status === 'CHANNEL_ERROR') {
            setStatus('ERROR');
            setError(new Error('Erro ao se inscrever no canal'));
          }
        });

      setChannel(realtimeChannel);

      // Limpar inscrição ao desmontar
      return () => {
        realtimeChannel.unsubscribe();
        setStatus('UNSUBSCRIBED');
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido na inscrição'));
      setStatus('ERROR');
    }
  }, [channelName, config, callback, client, enabled, user]);

  // Função para cancelar a inscrição manualmente
  const unsubscribe = () => {
    if (channel) {
      channel.unsubscribe();
      setStatus('UNSUBSCRIBED');
    }
  };

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
  const channelName = `${table}-${user?.id}-${event}-${Date.now()}`;
  
  return useRealtimeSubscription({
    channelName,
    config: {
      table,
      event,
      filter
    },
    callback: (payload) => callback(payload.new as T),
    enabled
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
  
  return useTableSubscription(
    'vehicles',
    event,
    callback,
    user ? `user_id=eq.${user.id}` : undefined,
    enabled && !!user
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
  
  return useTableSubscription(
    'alerts',
    event,
    callback,
    user ? `user_id=eq.${user.id}` : undefined,
    enabled && !!user
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
  
  return useTableSubscription(
    'geofences',
    event,
    callback,
    user ? `user_id=eq.${user.id}` : undefined,
    enabled && !!user
  );
};

export default useRealtimeSubscription;