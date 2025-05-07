"use client";

/**
 * Componente de integração Realtime para o sistema de rastreamento de veículos
 * 
 * Este componente integra as Edge Functions do Supabase e o sistema Realtime
 * na interface do usuário, permitindo atualizações em tempo real e sincronização
 * offline de dados críticos.
 */

"use client";

/**
 * Componente de integração Realtime para o sistema de rastreamento de veículos
 * 
 * Este componente integra as Edge Functions do Supabase e o sistema Realtime
 * na interface do usuário, permitindo atualizações em tempo real e sincronização
 * offline de dados críticos.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { supabase, supabaseRealtime } from '@/lib/supabase';
import { RealtimeSubscriptionManager, RealtimeUpdater } from '@/lib/realtime-subscription';
import { useOfflineSync } from '@/lib/offline-sync';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import Layout from '../layout/Layout';

// Status de sincronização
type SyncStatus = 'online' | 'offline' | 'syncing' | 'loading';

/**
 * Componente principal de integração Realtime
 */
export default function RealtimeIntegration({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // Usar hook personalizado para controle de sincronização offline
  const { isSyncing, pendingChanges, syncError } = useOfflineSync();

  const handleRealtimeError = useCallback((errorMessage: string) => {
    console.error('Erro no RealtimeSubscriptionManager:', errorMessage);
    setError(`Falha na conexão em tempo real: ${errorMessage}. Verifique sua conexão e tente recarregar.`);
    setSyncStatus('offline');
  }, []);

  const handleRealtimeConnectionChange = useCallback((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
    if (status === 'SUBSCRIBED') {
      setSyncStatus('online');
      setError(null);
      console.log('RealtimeIntegration: Conectado e inscrito.');
    } else {
      console.warn(`RealtimeIntegration: Status da conexão alterado para ${status}`);
      // Poderia definir como offline aqui, mas vamos esperar o onError para erros mais graves
      // ou se o status for explicitamente de desconexão.
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setSyncStatus('offline');
        if (!error) {
            setError('Conexão em tempo real perdida. Tentando reconectar...');
        }
      }
    }
  }, [error]);

  useEffect(() => {
    // O RealtimeSubscriptionManager agora é um componente, então não há inicialização manual aqui.
    // O estado de carregamento inicial é gerenciado pelo próprio componente.
    // Apenas definimos como 'online' se não houver erro e não estiver carregando.
    // O estado de 'loading' inicial é tratado pelo syncStatus
    if (syncStatus === 'loading' && !error) {
        // A transição para 'online' ou 'offline' será feita pelo handleRealtimeConnectionChange ou handleRealtimeError
    }
  }, [syncStatus, error]);
  
  // Atualizar status baseado no processo de sincronização offline
  useEffect(() => {
    if (isSyncing) {
      setSyncStatus('syncing');
    } else if (syncError) {
      setError(syncError);
      setSyncStatus('offline');
    } else if (syncStatus === 'syncing' && !syncError) { // Se estava sincronizando e não houve erro, volta para online
      setSyncStatus('online');
    }
  }, [isSyncing, syncError, syncStatus]);
  
  // Renderizar spinner de carregamento
  if (syncStatus === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Spinner size="lg" />
          <p className="ml-2 text-gray-600">Conectando ao sistema em tempo real...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <RealtimeSubscriptionManager 
        supabaseClient={supabaseRealtime} 
        onConnectionError={handleRealtimeError}
        onConnectionStateChange={handleRealtimeConnectionChange}
    >
      <RealtimeUpdater supabaseClient={supabase} />
      {error && (
        <Alert variant="error" title="Erro de Conexão" className="mb-4">
          {error}
        </Alert>
      )}
      
      {syncStatus === 'syncing' && (
        <Alert variant="info" title="Sincronizando Dados" className="mb-4">
          Sincronizando {pendingChanges} alterações pendentes...
        </Alert>
      )}
      
      {syncStatus === 'offline' && !error && (
        <Alert variant="warning" title="Modo Offline" className="mb-4">
          Você está trabalhando no modo offline. Suas alterações serão sincronizadas quando a conexão for restaurada.
        </Alert>
      )}
      
      {children}
    </RealtimeSubscriptionManager>
  );
}

/**
 * Componente para integração com Edge Functions
 * 
 * Este componente fornece métodos para chamar as Edge Functions do Supabase
 * para processamento de eventos complexos.
 */
export function useEdgeFunctions() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, Error | null>>({});
  
  /**
   * Verifica se um veículo está dentro de uma geocerca
   */
  const checkGeofence = async (vehicleId: string, position: { latitude: number, longitude: number }, timestamp: string) => {
    setLoading(prev => ({ ...prev, geofence: true }));
    setError(prev => ({ ...prev, geofence: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('geofence-events', {
        body: { vehicleId, position, timestamp }
      });
      
      if (error) throw error;
      
      setLoading(prev => ({ ...prev, geofence: false }));
      return data;
    } catch (err) {
      console.error('Erro ao processar evento de geocerca:', err);
      setError(prev => ({ ...prev, geofence: err instanceof Error ? err : new Error(String(err)) }));
      setLoading(prev => ({ ...prev, geofence: false }));
      return { success: false, error: err };
    }
  };
  
  /**
   * Processa um alerta de velocidade
   */
  const processSpeedAlert = async (vehicleId: string, speed: number, position: { latitude: number, longitude: number }, timestamp: string) => {
    setLoading(prev => ({ ...prev, speedAlert: true }));
    setError(prev => ({ ...prev, speedAlert: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('speed-alerts', {
        body: { vehicleId, speed, position, timestamp }
      });
      
      if (error) throw error;
      
      setLoading(prev => ({ ...prev, speedAlert: false }));
      return data;
    } catch (err) {
      console.error('Erro ao processar alerta de velocidade:', err);
      setError(prev => ({ ...prev, speedAlert: err instanceof Error ? err : new Error(String(err)) }));
      setLoading(prev => ({ ...prev, speedAlert: false }));
      return { success: false, error: err };
    }
  };
  
  return {
    checkGeofence,
    processSpeedAlert,
    loading,
    error
  };
}