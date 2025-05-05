"use client";

/**
 * Componente de integração Realtime para o sistema de rastreamento de veículos
 * 
 * Este componente integra as Edge Functions do Supabase e o sistema Realtime
 * na interface do usuário, permitindo atualizações em tempo real e sincronização
 * offline de dados críticos.
 */

import React, { useEffect, useState } from 'react';
import { supabase, supabaseRealtime } from '@/lib/supabase';
import { RealtimeSubscriptionManager, RealtimeUpdater } from '../../lib/realtime-subscription';
import { useOfflineSync } from '../../lib/offline-sync';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import Layout from '../layout/Layout';

// Status de sincronização
type SyncStatus = 'online' | 'offline' | 'syncing';

/**
 * Componente principal de integração Realtime
 */
export function RealtimeIntegration({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [showSyncAlert, setShowSyncAlert] = useState<boolean>(false);
  
  // Inicializar gerenciador de sincronização offline
  const offlineSync = useOfflineSync(supabaseRealtime);
  
  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      // Tentar sincronizar dados pendentes
      offlineSync.forceSyncAll()
        .then(() => {
          setSyncStatus('online');
          setShowSyncAlert(true);
          // Esconder alerta após 3 segundos
          setTimeout(() => setShowSyncAlert(false), 3000);
        })
        .catch(() => {
          setSyncStatus('offline');
        });
    };
    
    const handleOffline = () => {
      setSyncStatus('offline');
    };
    
    // Verificar status inicial
    if (navigator.onLine) {
      setSyncStatus('online');
    } else {
      setSyncStatus('offline');
    }
    
    // Verificar mudanças pendentes periodicamente
    const checkPendingChanges = () => {
      const hasPending = offlineSync.hasPendingSyncItems();
      setPendingChanges(hasPending ? 1 : 0); // Simplificado para indicador binário
    };
    
    const pendingInterval = setInterval(checkPendingChanges, 5000);
    
    // Configurar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Limpar event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pendingInterval);
    };
  }, [offlineSync]);
  
  return (
    <RealtimeSubscriptionManager supabaseClient={supabaseRealtime}>
      {/* Indicador de status de sincronização */}
      {syncStatus === 'offline' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert 
            variant="warning" 
            title="Modo Offline"
          >
            {pendingChanges > 0 
              ? `Você está offline. ${pendingChanges} alterações pendentes serão sincronizadas quando a conexão for restabelecida.`
              : "Você está offline. Os dados podem não estar atualizados."}
          </Alert>
        </div>
      )}
      
      {syncStatus === 'syncing' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert 
            variant="info" 
            title="Sincronizando"
            icon={<Spinner size="sm" />}
          >
            Sincronizando dados...
          </Alert>
        </div>
      )}
      
      {showSyncAlert && syncStatus === 'online' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert 
            variant="success" 
            title="Sincronização Concluída"
            onClose={() => setShowSyncAlert(false)}
          >
            Todos os dados foram sincronizados com sucesso.
          </Alert>
        </div>
      )}
      
      {/* Componente para atualizar a interface com dados em tempo real */}
      <RealtimeUpdater supabaseClient={supabaseRealtime} />
      
      {/* Conteúdo da aplicação com Layout */}
      <Layout>
        {children}
      </Layout>
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