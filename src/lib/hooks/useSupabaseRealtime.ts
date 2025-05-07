"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types'; // Ajuste o caminho conforme necessário

// Tipos de entidades e eventos (podem ser movidos para um arquivo de tipos compartilhado)
export type RealtimeEntity = 'vehicles' | 'drivers' | 'geofences' | 'alerts' | 'reports' | 'notifications' | string;
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface UseSupabaseRealtimeProps<T extends { id: any }> {
  supabaseClient: SupabaseClient<Database>;
  tableName: RealtimeEntity;
  schema?: string;
  filter?: string; // Ex: 'user_id=eq.some_user_id'
  onInsert?: (newRecord: T) => void;
  onUpdate?: (updatedRecord: T) => void;
  onDelete?: (deletedRecord: T) => void;
  onError?: (error: Error) => void;
  initialData?: T[];
  enabled?: boolean; // Para controlar se o hook deve iniciar a subscrição
}

export interface UseSupabaseRealtimeResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
}

/**
 * Hook customizado para gerenciar subscrições Realtime do Supabase.
 *
 * @param supabaseClient Instância do cliente Supabase.
 * @param tableName Nome da tabela para escutar.
 * @param schema Nome do schema (padrão: 'public').
 * @param filter Filtro a ser aplicado na subscrição (ex: 'user_id=eq.some_user_id').
 * @param onInsert Callback para eventos de INSERÇÃO.
 * @param onUpdate Callback para eventos de ATUALIZAÇÃO.
 * @param onDelete Callback para eventos de EXCLUSÃO.
 * @param onError Callback para erros na subscrição.
 * @param initialData Dados iniciais para popular o estado.
 * @param enabled Controla se a subscrição deve ser ativada (padrão: true).
 */
export function useSupabaseRealtime<T extends { id: any }>({
  supabaseClient,
  tableName,
  schema = 'public',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onError,
  initialData = [],
  enabled = true,
}: UseSupabaseRealtimeProps<T>): UseSupabaseRealtimeResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleInsert = useCallback((payload: RealtimePostgresChangesPayload<T>) => {
    const newRecord = payload.new as T;
    setData((currentData) => {
      // Evitar duplicatas se o dado já existir (ex: após reconexão com fetch inicial)
      if (currentData.some(item => item.id === newRecord.id)) {
        return currentData.map(item => item.id === newRecord.id ? newRecord : item);
      }
      return [...currentData, newRecord];
    });
    onInsert?.(newRecord);
  }, [onInsert]);

  const handleUpdate = useCallback((payload: RealtimePostgresChangesPayload<T>) => {
    const updatedRecord = payload.new as T;
    setData((currentData) =>
      currentData.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
    );
    onUpdate?.(updatedRecord);
  }, [onUpdate]);

  const handleDelete = useCallback((payload: RealtimePostgresChangesPayload<T>) => {
    // Supabase pode não enviar 'old' para todos os cenários, ou pode ser um objeto parcial.
    // É mais seguro usar o ID do payload se disponível, ou assumir que o 'old' tem o ID.
    const deletedRecordId = payload.old?.id || (payload.new as T)?.id; // Fallback para new.id se old.id não estiver presente
    const deletedRecord = payload.old as T; // Pode ser parcial

    if (deletedRecordId) {
      setData((currentData) => currentData.filter((item) => item.id !== deletedRecordId));
    }
    // onDelete pode precisar de uma lógica mais robusta se o 'old' for crucial e parcial
    onDelete?.(deletedRecord || { id: deletedRecordId } as T); // Passa o que tiver ou um objeto com ID
  }, [onDelete]);

  useEffect(() => {
    if (!enabled || !supabaseClient || !tableName) {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch inicial dos dados se não houver dados iniciais ou se for explicitamente para recarregar
    // Esta lógica pode ser ajustada conforme a necessidade de buscar dados iniciais sempre ou apenas uma vez.
    if (initialData.length === 0) {
        supabaseClient
        .from(tableName)
        .select('*')
        // Adicionar filtro ao select inicial se existir
        // A sintaxe do filtro para select() pode ser diferente da sintaxe para channel.filter
        // Ex: .eq('column_name', 'value') ou .filter('column_name', 'eq', 'value')
        // Aqui, vamos assumir que o filtro fornecido é para o canal e não para o select inicial.
        // Se precisar de filtro no select, a prop 'filter' precisaria ser parseada.
        .then(({ data: initialResults, error: initialError }) => {
          if (!isMounted) return;
          if (initialError) {
            console.error(`Erro ao buscar dados iniciais para ${tableName}:`, initialError);
            setError(initialError);
            onError?.(initialError);
          } else if (initialResults) {
            setData(initialResults as T[]);
          }
          setLoading(false);
        });
    } else {
        setLoading(false); // Já temos dados iniciais
    }

    const channelName = `realtime:${schema}:${tableName}:${filter || 'all'}`;
    const newChannel = supabaseClient.channel(channelName, {
        config: {
            broadcast: { ack: true },
        },
    });

    newChannel
      .on<T>(
        'postgres_changes',
        { event: 'INSERT', schema, table: tableName, filter },
        (payload) => {
            if (isMounted) handleInsert(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .on<T>(
        'postgres_changes',
        { event: 'UPDATE', schema, table: tableName, filter },
        (payload) => {
            if (isMounted) handleUpdate(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .on<T>(
        'postgres_changes',
        { event: 'DELETE', schema, table: tableName, filter },
        (payload) => {
            if (isMounted) handleDelete(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe((status, err) => {
        if (!isMounted) return;

        if (err) {
          console.error(`Erro na subscrição Realtime para ${tableName}:`, err);
          setError(err);
          onError?.(err);
          setIsConnected(false);
          setLoading(false);
        } else if (status === 'SUBSCRIBED') {
          console.log(`Conectado ao canal Realtime para ${tableName}`);
          setIsConnected(true);
          setError(null); // Limpa erro anterior em caso de reconexão bem-sucedida
          // setLoading(false) é chamado após o fetch inicial ou se houver dados iniciais
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`Canal Realtime para ${tableName} ${status}. Tentando reconectar...`);
          setIsConnected(false);
          // O Supabase client tenta reconectar automaticamente. 
          // Podemos adicionar lógica aqui se quisermos um feedback mais explícito de 'reconnecting'.
          if (status !== 'CLOSED') { // CLOSED pode ser intencional
            const connectionError = new Error(`Canal Realtime ${status}`);
            setError(connectionError);
            onError?.(connectionError);
          }
        }
      });

    channelRef.current = newChannel;

    return () => {
      isMounted = false;
      if (channelRef.current) {
        console.log(`Removendo subscrição Realtime para ${tableName}`);
        supabaseClient.removeChannel(channelRef.current).then(() => {
            console.log(`Canal para ${tableName} removido.`);
        }).catch(removeError => {
            console.error(`Erro ao remover canal para ${tableName}:`, removeError);
        });
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  // As dependências precisam ser cuidadosamente gerenciadas.
  // Callbacks (onInsert, etc.) devem ser estáveis (useCallback no componente pai) ou a subscrição será refeita.
  // supabaseClient e tableName raramente mudam, mas filter pode mudar.
  }, [supabaseClient, tableName, schema, filter, enabled, handleInsert, handleUpdate, handleDelete, onError, initialData.length]); // Adicionado initialData.length para refazer fetch se initialData mudar de vazio para preenchido ou vice-versa

  return { data, loading, error, isConnected };
}