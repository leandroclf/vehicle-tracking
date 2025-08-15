"use client";

/**
 * Componente de integração Realtime para o sistema de rastreamento de veículos
 * 
 * Este componente integra WebSockets e o sistema Realtime
 * na interface do usuário, permitindo atualizações em tempo real e sincronização
 * offline de dados críticos.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRealtimeContext, ConnectionState } from '@/lib/providers/RealtimeProvider';
import { useOfflineSync } from '@/lib/offline-sync';
import { Alert } from '../ui/Alert';
import { Skeleton } from '../ui/skeleton';
import Layout from '../layout/Layout';

// Status de sincronização
type SyncStatus = 'online' | 'offline' | 'syncing' | 'loading';

/**
 * Componente principal de integração Realtime
 */
export default function RealtimeIntegration({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [currentError, setCurrentError] = useState<string | null>(null);
  
  const { isSyncing, pendingChanges, syncError: offlineSyncError } = useOfflineSync();
  const { connectionState, error: realtimeContextError } = useRealtimeContext();

  useEffect(() => {
    let newStatus: SyncStatus = 'loading';
    let errorMessage: string | null = null;

    if (offlineSyncError) {
      errorMessage = offlineSyncError;
      newStatus = 'offline';
    } else if (realtimeContextError) {
      errorMessage = realtimeContextError.message;
      newStatus = 'offline';
    }

    if (isSyncing) {
      newStatus = 'syncing';
    } else {
      switch (connectionState) {
        case 'CONNECTED':
          newStatus = 'online';
          // Limpa o erro apenas se a conexão estiver online e não houver erro de sincronização offline
          if (!offlineSyncError) errorMessage = null;
          break;
        case 'CONNECTING':
        case 'RECONNECTING':
          newStatus = 'loading'; // Ou um estado 'reconnecting' se preferir
          if (!offlineSyncError && !realtimeContextError) errorMessage = 'Conectando ao sistema em tempo real...';
          break;
        case 'DISCONNECTED':
        case 'SUSPENDED':
        case 'ERROR':
          newStatus = 'offline';
          if (!errorMessage) errorMessage = 'Conexão em tempo real perdida. Verifique sua conexão.';
          break;
        default:
          newStatus = 'loading'; // Estado inicial ou desconhecido
          break;
      }
    }
    
    setSyncStatus(newStatus);
    setCurrentError(errorMessage);

  }, [connectionState, realtimeContextError, isSyncing, offlineSyncError]);
  
  // Renderizar spinner de carregamento
  // Renderizar spinner de carregamento ou estado de reconexão
  if (syncStatus === 'loading' && connectionState !== 'CONNECTED') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <p className="text-gray-600">Conectando ao sistema em tempo real...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <>
      {currentError && syncStatus !== 'online' && (
        <Alert variant={syncStatus === 'offline' || realtimeContextError || offlineSyncError ? "error" : "warning"} title="Status da Conexão" className="mb-4">
          {currentError}
        </Alert>
      )}
      
      {syncStatus === 'syncing' && (
        <Alert variant="info" title="Sincronizando Dados" className="mb-4">
          Sincronizando {pendingChanges > 0 ? `${pendingChanges} alterações pendentes` : 'alterações'}...
        </Alert>
      )}
      
      {syncStatus === 'offline' && !currentError && (
        <Alert variant="warning" title="Modo Offline" className="mb-4">
          Você está trabalhando no modo offline. Suas alterações serão sincronizadas quando a conexão for restaurada.
        </Alert>
      )}
      
      {children}
    </>
  );
}

/**
 * Hook para integração com APIs de processamento
 * 
 * Este hook fornece métodos para chamar as APIs REST
 * para processamento de eventos complexos.
 */
export function useApiProcessing() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, Error | null>>({});
  
  /**
   * Verifica se um veículo está dentro de uma geocerca
   */
  const checkGeofence = async (vehicleId: string, position: { latitude: number, longitude: number }, timestamp: string) => {
    setLoading(prev => ({ ...prev, geofence: true }));
    setError(prev => ({ ...prev, geofence: null }));
    
    try {
      const response = await fetch('/api/geofences/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleId, position, timestamp }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }
      
      const data = await response.json();
      
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
      const response = await fetch('/api/alerts/speed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleId, speed, position, timestamp }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }
      
      const data = await response.json();
      
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