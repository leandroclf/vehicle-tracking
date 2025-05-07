'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';
import { useRealtimeContext } from '../providers/RealtimeProvider';

/**
 * Interface para configuração da sincronização
 */
interface SyncConfig<T> {
  // Tabela a ser sincronizada
  table: string;
  // Coluna de timestamp para verificar atualizações
  timestampColumn: string;
  // Função para buscar dados atualizados
  fetchUpdatedData: (lastSyncTimestamp: Date) => Promise<T[]>;
  // Função chamada quando novos dados são sincronizados
  onDataSynced?: (data: T[]) => void;
  // Intervalo mínimo entre sincronizações (ms)
  minSyncInterval?: number;
}

/**
 * Hook para sincronização de dados após reconexão
 * 
 * Este hook monitora o estado da conexão Realtime e, quando uma reconexão
 * é detectada, sincroniza os dados que podem ter sido perdidos durante
 * o período de desconexão.
 * 
 * @param config Configuração da sincronização
 * @returns Objeto com estado da sincronização e funções de controle
 */
export function useSyncAfterReconnection<T>(
  supabaseClient: ReturnType<typeof createClient<Database>>,
  config: SyncConfig<T>
) {
  // Obter contexto Realtime
  const { connectionState, isConnected } = useRealtimeContext();
  
  // Estado para controlar sincronização
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);
  
  // Função para sincronizar dados
  const syncData = useCallback(async () => {
    if (!lastSyncTimestamp) {
      // Se não houver timestamp anterior, definir timestamp atual e sair
      setLastSyncTimestamp(new Date());
      return;
    }
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      // Buscar dados atualizados desde a última sincronização
      const updatedData = await config.fetchUpdatedData(lastSyncTimestamp);
      
      // Atualizar timestamp de sincronização
      setLastSyncTimestamp(new Date());
      
      // Chamar callback com dados sincronizados
      if (config.onDataSynced && updatedData.length > 0) {
        config.onDataSynced(updatedData);
      }
      
      console.log(`[Sync] Sincronizados ${updatedData.length} registros de ${config.table}`);
      
      return updatedData;
    } catch (error) {
      console.error(`[Sync] Erro ao sincronizar ${config.table}:`, error);
      setSyncError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [config, lastSyncTimestamp]);
  
  // Monitorar mudanças no estado da conexão
  useEffect(() => {
    let syncTimeout: NodeJS.Timeout | null = null;
    
    // Quando a conexão for restabelecida, sincronizar dados
    if (connectionState === 'CONNECTED' && lastSyncTimestamp) {
      // Adicionar um pequeno atraso para garantir que a conexão está estável
      syncTimeout = setTimeout(() => {
        syncData().catch(error => {
          console.error('Erro durante sincronização após reconexão:', error);
        });
      }, config.minSyncInterval || 2000);
    }
    
    // Inicializar timestamp na primeira conexão
    if (connectionState === 'CONNECTED' && !lastSyncTimestamp) {
      setLastSyncTimestamp(new Date());
    }
    
    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [connectionState, syncData, lastSyncTimestamp, config.minSyncInterval]);
  
  // Função para forçar sincronização manual
  const forceSyncData = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Não é possível sincronizar: desconectado');
    }
    
    return syncData();
  }, [isConnected, syncData]);
  
  return {
    isSyncing,
    lastSyncTimestamp,
    syncError,
    forceSyncData
  };
}

/**
 * Hook simplificado para sincronização de uma tabela específica
 * 
 * Este hook é uma abstração sobre o useSyncAfterReconnection que facilita
 * a sincronização de uma tabela específica após reconexão.
 * 
 * @param table Nome da tabela
 * @param timestampColumn Nome da coluna de timestamp
 * @param onDataSynced Callback para dados sincronizados
 * @returns Estado da sincronização e funções de controle
 */
export function useTableSyncAfterReconnection<T extends Record<string, any>>(
  supabaseClient: ReturnType<typeof createClient<Database>>,
  table: string,
  timestampColumn: string = 'updated_at',
  onDataSynced?: (data: T[]) => void,
  minSyncInterval: number = 2000
) {
  // Função para buscar dados atualizados
  const fetchUpdatedData = useCallback(async (lastSyncTimestamp: Date) => {
    const { data, error } = await supabaseClient
      .from(table)
      .select('*')
      .gt(timestampColumn, lastSyncTimestamp.toISOString());
      
    if (error) throw error;
    return (data || []) as T[];
  }, [supabaseClient, table, timestampColumn]);
  
  return useSyncAfterReconnection<T>(supabaseClient, {
    table,
    timestampColumn,
    fetchUpdatedData,
    onDataSynced,
    minSyncInterval
  });
}