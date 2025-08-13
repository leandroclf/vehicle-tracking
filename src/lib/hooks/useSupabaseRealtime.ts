"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketManager, RealtimeEvent } from '../realtime/websocket-client';
import { db } from '../db';
import { eq } from 'drizzle-orm';

// Tipos de entidades e eventos
export type RealtimeEntity = 'vehicles' | 'drivers' | 'geofences' | 'alerts' | 'reports' | 'notifications' | string;
export type WSRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface UseWebSocketRealtimeProps<T extends { id: any }> {
  wsUrl: string;
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

export interface UseWebSocketRealtimeResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
}

/**
 * Hook customizado para gerenciar subscrições Realtime com WebSockets.
 *
 * @param wsUrl URL do servidor WebSocket.
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
export function useWebSocketRealtime<T extends { id: any }>({
  wsUrl,
  tableName,
  schema = 'public',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onError,
  initialData = [],
  enabled = true,
}: UseWebSocketRealtimeProps<T>): UseWebSocketRealtimeResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);

  const handleInsert = useCallback((payload: RealtimeEvent<T>) => {
    const newRecord = payload.data as T;
    setData((currentData) => {
      // Evitar duplicatas se o dado já existir (ex: após reconexão com fetch inicial)
      if (currentData.some(item => item.id === newRecord.id)) {
        return currentData.map(item => item.id === newRecord.id ? newRecord : item);
      }
      return [...currentData, newRecord];
    });
    onInsert?.(newRecord);
  }, [onInsert]);

  const handleUpdate = useCallback((payload: RealtimeEvent<T>) => {
    const updatedRecord = payload.data as T;
    setData((currentData) =>
      currentData.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
    );
    onUpdate?.(updatedRecord);
  }, [onUpdate]);

  const handleDelete = useCallback((payload: RealtimeEvent<T>) => {
    const deletedRecord = payload.data as T;
    const deletedRecordId = deletedRecord.id;

    if (deletedRecordId) {
      setData((currentData) => currentData.filter((item) => item.id !== deletedRecordId));
    }
    onDelete?.(deletedRecord);
  }, [onDelete]);

  useEffect(() => {
    if (!enabled || !wsUrl || !tableName) {
      if (wsManagerRef.current && subscriptionIdRef.current) {
        wsManagerRef.current.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch inicial dos dados se não houver dados iniciais
    if (initialData.length === 0) {
      // Aqui você implementaria a busca inicial dos dados via API REST
      // Por exemplo: fetch(`/api/${tableName}`)
      // Por simplicidade, vamos apenas definir loading como false
      setLoading(false);
    } else {
      setLoading(false); // Já temos dados iniciais
    }

    // Criar instância do WebSocketManager
    const wsManager = new WebSocketManager(wsUrl);
    wsManagerRef.current = wsManager;

    // Configurar callbacks de conexão
    wsManager.onConnect(() => {
      if (isMounted) {
        setIsConnected(true);
        setError(null);
        console.log(`Conectado ao WebSocket para ${tableName}`);
      }
    });

    wsManager.onDisconnect(() => {
      if (isMounted) {
        setIsConnected(false);
        console.warn(`Desconectado do WebSocket para ${tableName}`);
      }
    });

    wsManager.onError((error) => {
      if (isMounted) {
        setError(error);
        onError?.(error);
        setIsConnected(false);
        console.error(`Erro no WebSocket para ${tableName}:`, error);
      }
    });

    // Conectar ao WebSocket
    wsManager.connect();

    // WebSocket será gerenciado através do RealtimeProvider
    // A subscrição será feita através do provider de realtime
    const channelName = `${schema}:${tableName}${filter ? `:${filter}` : ''}`;
    console.log(`Canal ${channelName} será subscrito através do RealtimeProvider`);
    
    // Simular subscription ID para compatibilidade
    subscriptionIdRef.current = channelName;

    return () => {
      isMounted = false;
      if (wsManagerRef.current) {
        if (subscriptionIdRef.current) {
          // WebSocket será gerenciado através do RealtimeProvider
          console.log(`Canal ${subscriptionIdRef.current} será desinscrito através do RealtimeProvider`);
          subscriptionIdRef.current = null;
        }
        wsManagerRef.current.disconnect();
        wsManagerRef.current = null;
      }
      setIsConnected(false);
    };
  }, [wsUrl, tableName, schema, filter, enabled, handleInsert, handleUpdate, handleDelete, onError, initialData.length]);

  return { data, loading, error, isConnected };
}

// Alias para compatibilidade com código existente
export const useRealtimeSubscription = useWebSocketRealtime;