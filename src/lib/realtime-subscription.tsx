"use client";

/**
 * Sistema de integração Realtime para o sistema de rastreamento de veículos
 * 
 * Este módulo implementa funcionalidades para permitir atualizações em tempo real
 * na interface do usuário, expandindo o sistema Realtime para outras entidades
 * como veículos, motoristas e relatórios.
 */

import React from 'react';
import { useEffect, useState } from 'react';
import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

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
}

// Interface para o retorno do hook
export interface RealtimeSubscriptionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  lastEvent: RealtimePostgresChangesPayload<T> | null;
}

/**
 * Hook para assinar atualizações em tempo real de uma entidade
 * 
 * @param supabaseClient Cliente Supabase inicializado
 * @param config Configuração da assinatura
 * @param initialData Dados iniciais (opcional)
 * @returns Objeto com dados atualizados e estado da assinatura
 */
export function useRealtimeSubscription<T>(
  supabaseClient: ReturnType<typeof createClient<Database>>,
  config: SubscriptionConfig,
  initialData: T[] = []
): RealtimeSubscriptionResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimePostgresChangesPayload<T> | null>(null);

  useEffect(() => {
    // Definir o canal de assinatura
    let channel: RealtimeChannel;
    
    const setupSubscription = async () => {
      try {
        setLoading(true);
        
        // Buscar dados iniciais se não foram fornecidos
        if (initialData.length === 0) {
          let query = supabaseClient.from(config.entity).select('*');
          
          // Aplicar filtro se fornecido
          if (config.filter && config.filterValue !== undefined) {
            query = query.eq(config.filter, config.filterValue);
          }
          
          const { data: initialResults, error: initialError } = await query;
          
          if (initialError) {
            throw initialError;
          }
          
          setData(initialResults as T[]);
        }
        
        // Configurar o canal de assinatura
        channel = supabaseClient
          .channel(`${config.entity}-changes-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: config.event || '*',
              schema: 'public',
              table: config.entity,
              ...(config.filter && config.filterValue ? 
                { filter: `${config.filter}=eq.${config.filterValue}` } : {})
            },
            (payload) => {
              setLastEvent(payload as RealtimePostgresChangesPayload<T>);
              
              // Atualizar os dados com base no tipo de evento
              switch (payload.eventType) {
                case 'INSERT':
                  setData(currentData => [...currentData, payload.new as T]);
                  break;
                  
                case 'UPDATE':
                  setData(currentData => 
                    currentData.map(item => 
                      // @ts-ignore - Assumindo que o item tem uma propriedade 'id'
                      item.id === payload.new.id ? payload.new as T : item
                    )
                  );
                  break;
                  
                case 'DELETE':
                  setData(currentData => 
                    currentData.filter(item => 
                      // @ts-ignore - Assumindo que o item tem uma propriedade 'id'
                      item.id !== payload.old.id
                    )
                  );
                  break;
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Assinatura ativa para ${config.entity}`);
              setLoading(false);
            }
          });
          
      } catch (err) {
        console.error(`Erro ao configurar assinatura para ${config.entity}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };
    
    setupSubscription();
    
    // Limpar assinatura quando o componente for desmontado
    return () => {
      if (channel) {
        console.log(`Removendo assinatura para ${config.entity}`);
        supabaseClient.removeChannel(channel);
      }
    };
  }, [supabaseClient, config.entity, config.event, config.filter, config.filterValue]);
  
  return { data, loading, error, lastEvent };
}

/**
 * Componente para gerenciar múltiplas assinaturas em tempo real
 * 
 * Este componente pode ser usado para centralizar todas as assinaturas
 * em tempo real da aplicação, evitando múltiplas conexões.
 */
export interface RealtimeSubscriptionManagerProps {
  supabaseClient: ReturnType<typeof createClient<Database>>;
  children: React.ReactNode;
  onConnectionStateChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR', channelName: string) => void;
  onConnectionError?: (errorMessage: string, channelName: string) => void;
}

export function RealtimeSubscriptionManager({
  supabaseClient,
  children,
  onConnectionStateChange,
  onConnectionError,
}: RealtimeSubscriptionManagerProps) {
  useEffect(() => {
    const channels: RealtimeChannel[] = [];

    const setupChannel = (channelName: string, table: RealtimeEntity) => {
      const channel = supabaseClient
        .channel(`global-${channelName}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            const event = new CustomEvent(`realtime-${channelName}`, { detail: payload });
            window.dispatchEvent(event);
          }
        )
        .subscribe((status, err) => {
          if (err && onConnectionError) {
            onConnectionError(err.message, channelName);
          }
          if (onConnectionStateChange) {
            onConnectionStateChange(status, channelName);
          }
          if (status === 'SUBSCRIBED') {
            console.log(`Canal global '${channelName}' inscrito com sucesso.`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Erro ou timeout no canal global '${channelName}': ${status}`, err);
          }
        });
      channels.push(channel);
      return channel;
    };

    setupChannel('notifications', 'notifications');
    setupChannel('vehicles', 'vehicles');
    setupChannel('alerts', 'alerts');

    return () => {
      channels.forEach(channel => {
        supabaseClient.removeChannel(channel).catch(error => 
          console.error(`Erro ao remover canal ${channel.topic}:`, error)
        );
      });
    };
  }, [supabaseClient, onConnectionStateChange, onConnectionError]);

  return <>{children}</>;
}

/**
 * Hook para escutar eventos globais de tempo real
 * 
 * @param eventType Tipo de evento global para escutar
 * @param callback Função a ser chamada quando o evento ocorrer
 */
export function useRealtimeGlobalEvent<T>(
  eventType: 'realtime-notification' | 'realtime-vehicle' | 'realtime-alert',
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };
    
    window.addEventListener(eventType, handleEvent);
    
    return () => {
      window.removeEventListener(eventType, handleEvent);
    };
  }, [eventType, callback]);
}

/**
 * Componente para atualizar a interface com dados em tempo real
 * 
 * Este componente pode ser usado em qualquer página que precise de
 * atualizações em tempo real, como o dashboard, mapa, etc.
 */
export function RealtimeUpdater({
  supabaseClient
}: {
  supabaseClient: ReturnType<typeof createClient<Database>>;
}) {
  // Escutar eventos globais de notificações
  useRealtimeGlobalEvent('realtime-notification', (payload) => {
    // Atualizar contador de notificações ou exibir toast
    if (payload.eventType === 'INSERT') {
      // Exibir notificação na interface
      const notification = payload.new;
      
      // Verificar se o navegador suporta notificações
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/notification-icon.png'
        });
      }
      
      // Atualizar contador de notificações não lidas
      const event = new CustomEvent('update-notification-count');
      window.dispatchEvent(event);
    }
  });
  
  // Escutar eventos globais de veículos
  useRealtimeGlobalEvent('realtime-vehicle', (payload) => {
    // Atualizar posição no mapa ou status do veículo
    if (payload.eventType === 'UPDATE') {
      // Disparar evento para atualizar mapa se estiver visível
      const event = new CustomEvent('update-vehicle-position', { detail: payload.new });
      window.dispatchEvent(event);
    }
  });
  
  // Escutar eventos globais de alertas
  useRealtimeGlobalEvent('realtime-alert', (payload) => {
    // Exibir alerta na interface
    if (payload.eventType === 'INSERT') {
      const alert = payload.new;
      
      // Exibir toast ou notificação de alerta
      const event = new CustomEvent('show-alert-notification', { detail: alert });
      window.dispatchEvent(event);
    }
  });
  
  // Componente não renderiza nada visualmente
  return null;
}