"use client";

/**
 * Sistema de integração Realtime para o sistema de rastreamento de veículos
 * 
 * Este módulo implementa funcionalidades para permitir atualizações em tempo real
 * na interface do usuário, expandindo o sistema Realtime para outras entidades
 * como veículos, motoristas e relatórios.
 */

import React, { useEffect, useState } from 'react';
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
// O hook useRealtimeSubscription foi movido e refatorado para src/lib/hooks/useSupabaseRealtime.ts
// Esta versão antiga foi removida para evitar conflitos e uso incorreto.

// O componente RealtimeSubscriptionManager foi removido.
// A lógica de subscrição agora deve ser gerenciada pelo hook useSupabaseRealtime
// diretamente nos componentes que necessitam de dados em tempo real ou através de um provedor de contexto customizado.

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