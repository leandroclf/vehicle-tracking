'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from '../auth/auth-context';
import { toast } from 'sonner';

interface WebSocketMessage {
  type: string;
  table?: string;
  operation?: string;
  data?: any;
  timestamp?: string;
  [key: string]: any;
}

interface Subscription {
  table: string;
  filter?: any;
  callback: (data: any) => void;
}

interface RealtimeContextType {
  isConnected: boolean;
  subscribe: (table: string, callback: (data: any) => void, filter?: any) => () => void;
  unsubscribe: (table: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8084';
const RECONNECT_INTERVAL = 5000; // 5 segundos
const MAX_RECONNECT_ATTEMPTS = 10;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  const connect = () => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('Token de autenticação não encontrado');
        setConnectionStatus('error');
        return;
      }

      const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setConnectionStatus('connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Reinscrever em todas as assinaturas existentes
        subscriptionsRef.current.forEach((subscription, key) => {
          sendMessage({
            type: 'subscribe',
            table: subscription.table,
            filter: subscription.filter,
          });
        });

        // Iniciar heartbeat
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket desconectado:', event.code, event.reason);
        setConnectionStatus('disconnected');
        setIsConnected(false);
        stopHeartbeat();
        
        // Tentar reconectar se não foi um fechamento intencional
        if (event.code !== 1000 && user) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Disconnecting');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    setIsConnected(false);
  };

  const scheduleReconnect = () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Máximo de tentativas de reconexão atingido');
      toast.error('Conexão perdida. Recarregue a página para tentar novamente.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current); // Backoff exponencial
    reconnectAttemptsRef.current++;
    
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${reconnectAttemptsRef.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (user) {
        connect();
      }
    }, delay);
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // 30 segundos
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('Conexão WebSocket confirmada para usuário:', message.userId);
        break;
        
      case 'db_change':
        handleDatabaseChange(message);
        break;
        
      case 'subscription_success':
        console.log('Inscrição confirmada:', message.table);
        break;
        
      case 'error':
        console.error('Erro do servidor WebSocket:', message.message);
        toast.error(message.message || 'Erro na conexão em tempo real');
        break;
        
      case 'pong':
        // Resposta ao ping - conexão está ativa
        break;
        
      default:
        console.log('Mensagem WebSocket não tratada:', message);
    }
  };

  const handleDatabaseChange = (message: WebSocketMessage) => {
    const { table, operation, data } = message;
    
    if (!table || !operation || !data) {
      console.warn('Mudança de banco incompleta:', message);
      return;
    }

    // Notificar todas as assinaturas da tabela
    subscriptionsRef.current.forEach((subscription, key) => {
      if (subscription.table === table) {
        try {
          subscription.callback({
            table,
            operation,
            data,
            timestamp: message.timestamp,
          });
        } catch (error) {
          console.error('Erro no callback de assinatura:', error);
        }
      }
    });
  };

  const subscribe = (table: string, callback: (data: any) => void, filter?: any): (() => void) => {
    const subscriptionKey = `${table}:${JSON.stringify(filter || {})}`;
    
    // Adicionar assinatura
    subscriptionsRef.current.set(subscriptionKey, {
      table,
      filter,
      callback,
    });

    // Enviar comando de assinatura se conectado
    if (isConnected) {
      sendMessage({
        type: 'subscribe',
        table,
        filter,
      });
    }

    // Retornar função de cancelamento
    return () => {
      subscriptionsRef.current.delete(subscriptionKey);
      
      // Se não há mais assinaturas para esta tabela, cancelar no servidor
      const hasOtherSubscriptions = Array.from(subscriptionsRef.current.keys())
        .some(key => key.startsWith(`${table}:`));
      
      if (!hasOtherSubscriptions && isConnected) {
        sendMessage({
          type: 'unsubscribe',
          table,
        });
      }
    };
  };

  const unsubscribe = (table: string) => {
    // Remover todas as assinaturas da tabela
    const keysToRemove = Array.from(subscriptionsRef.current.keys())
      .filter(key => key.startsWith(`${table}:`));
    
    keysToRemove.forEach(key => {
      subscriptionsRef.current.delete(key);
    });

    // Cancelar no servidor se conectado
    if (isConnected) {
      sendMessage({
        type: 'unsubscribe',
        table,
      });
    }
  };

  const value: RealtimeContextType = {
    isConnected,
    subscribe,
    unsubscribe,
    connectionStatus,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime deve ser usado dentro de um RealtimeProvider');
  }
  return context;
}

// Hook para assinatura simples de tabela
export function useRealtimeSubscription(
  table: string,
  callback: (data: any) => void,
  filter?: any,
  enabled: boolean = true
) {
  const { subscribe } = useRealtime();
  
  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe(table, callback, filter);
    return unsubscribe;
  }, [table, callback, filter, enabled, subscribe]);
}

// Tipos e classes para compatibilidade com realtime-connection-manager
export interface RealtimeEvent<T = any> {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: T;
  timestamp?: string;
}

// Classe WebSocketManager para compatibilidade
export class WebSocketManager {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners: { [key: string]: Function[] } = {};

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    // Implementação básica - usar RealtimeProvider para funcionalidade completa
    console.warn('WebSocketManager.connect() - Use RealtimeProvider para funcionalidade completa');
    
    // Simular conexão bem-sucedida para compatibilidade
    setTimeout(() => {
      this.triggerEvent('connect');
      this.triggerEvent('open');
    }, 100);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.triggerEvent('disconnect');
    this.triggerEvent('close');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  onConnect(callback: () => void) {
    this.addEventListener('connect', callback);
  }

  onDisconnect(callback: () => void) {
    this.addEventListener('disconnect', callback);
  }

  onOpen(callback: () => void) {
    this.addEventListener('open', callback);
  }

  onClose(callback: () => void) {
    this.addEventListener('close', callback);
  }

  onError(callback: (error: Error) => void) {
    this.addEventListener('error', callback);
  }

  // Método genérico 'on' para compatibilidade
  on(event: string, callback: Function) {
    this.addEventListener(event, callback);
  }

  // Método genérico 'off' para compatibilidade
  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  private addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private triggerEvent(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Erro no callback do evento ${event}:`, error);
        }
      });
    }
  }
}