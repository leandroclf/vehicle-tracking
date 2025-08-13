'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtimeConnection, RealtimeConnectionResult, UseRealtimeConnectionOptions, SubscriptionConfig } from '../hooks/useRealtimeConnection';
import { ConnectionState } from '../realtime-connection-manager';
import { RealtimeEvent } from '../realtime/websocket-client';

// Contexto para o provedor Realtime
interface RealtimeContextType<T> extends RealtimeConnectionResult<T> {
  isConnected: boolean;
  isReconnecting: boolean;
}

// Criando o contexto com um valor padrão undefined
const RealtimeContext = createContext<RealtimeContextType<any> | undefined>(undefined);

// Props para o provedor Realtime
interface RealtimeProviderProps {
  wsUrl: string;
  options?: UseRealtimeConnectionOptions;
  children: ReactNode;
}

/**
 * Provedor de contexto para conexões Realtime
 * 
 * Este componente fornece um contexto para gerenciar conexões Realtime
 * em toda a aplicação, utilizando o RealtimeConnectionManager para
 * garantir reconexão automática e sincronização de dados.
 */
export function RealtimeProvider<T>({
  wsUrl,
  options = {},
  children
}: RealtimeProviderProps) {
  // Configurar logger personalizado que inclui informações adicionais
  const customLogger = options.logger || ((level, message, context) => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    
    switch (level) {
      case 'DEBUG':
        console.debug(`[Realtime][${timestamp}] ${message}${contextStr}`);
        break;
      case 'INFO':
        console.info(`[Realtime][${timestamp}] ${message}${contextStr}`);
        break;
      case 'WARN':
        console.warn(`[Realtime][${timestamp}] ${message}${contextStr}`);
        break;
      case 'ERROR':
        console.error(`[Realtime][${timestamp}] ${message}${contextStr}`);
        break;
    }
  });
  
  // Configurar callback para mudanças de estado da conexão
  const handleConnectionStateChange = options.onConnectionStateChange || ((state: ConnectionState) => {
    customLogger('INFO', `Estado da conexão alterado para ${state}`);
  });
  
  // Configurar callback para erros de conexão
  const handleConnectionError = options.onConnectionError || ((error: Error) => {
    customLogger('ERROR', `Erro de conexão: ${error.message}`, { stack: error.stack });
  });
  
  // Usar o hook de conexão Realtime com as opções configuradas
  const connection = useRealtimeConnection<T>(wsUrl, {
    ...options,
    logger: customLogger,
    onConnectionStateChange: handleConnectionStateChange,
    onConnectionError: handleConnectionError
  });
  
  // Valores adicionais para o contexto
  const contextValue: RealtimeContextType<T> = {
    ...connection,
    isConnected: connection.connectionState === 'CONNECTED',
    isReconnecting: connection.connectionState === 'RECONNECTING'
  };
  
  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook para acessar o contexto Realtime
 * 
 * @returns Contexto Realtime com funções para gerenciar assinaturas
 */
export function useRealtimeContext<T>() {
  const context = useContext(RealtimeContext);
  
  if (context === undefined) {
    throw new Error('useRealtimeContext deve ser usado dentro de um RealtimeProvider');
  }
  
  return context as RealtimeContextType<T>;
}

/**
 * Componente para gerenciar assinaturas globais em tempo real
 * 
 * Este componente pode ser usado para centralizar assinaturas globais
 * que devem estar sempre ativas na aplicação.
 */
export function GlobalSubscriptions({
  subscriptions
}: {
  subscriptions: Array<{
    config: SubscriptionConfig;
    callback: (payload: RealtimeEvent) => void;
  }>;
}) {
  const { subscribe, unsubscribe, connectionState } = useRealtimeContext();
  
  // Configurar assinaturas globais
  React.useEffect(() => {
    const channelNames: string[] = [];
    
    // Função para configurar todas as assinaturas
    const setupSubscriptions = async () => {
      for (const subscription of subscriptions) {
        try {
          const channelName = await subscribe(subscription.config, subscription.callback);
          channelNames.push(channelName);
        } catch (error) {
          console.error(`Erro ao configurar assinatura global para ${subscription.config.entity}:`, error);
        }
      }
    };
    
    // Configurar assinaturas quando estiver conectado
    if (connectionState === 'CONNECTED') {
      setupSubscriptions();
    }
    
    // Limpar assinaturas ao desmontar
    return () => {
      channelNames.forEach(channelName => {
        unsubscribe(channelName).catch(error => {
          console.error(`Erro ao cancelar assinatura global ${channelName}:`, error);
        });
      });
    };
  }, [subscribe, unsubscribe, connectionState, subscriptions]);
  
  // Este componente não renderiza nada
  return null;
}

/**
 * Componente para exibir o estado da conexão Realtime
 * 
 * Este componente pode ser usado para exibir o estado atual da conexão
 * Realtime na interface do usuário.
 */
export function RealtimeConnectionStatus() {
  const { connectionState, connectionStats, error } = useRealtimeContext();
  
  // Mapear estados de conexão para mensagens amigáveis
  const statusMessages = {
    CONNECTING: 'Conectando...',
    CONNECTED: 'Conectado',
    DISCONNECTED: 'Desconectado',
    RECONNECTING: 'Reconectando...',
    FAILED: 'Falha na conexão'
  };
  
  // Mapear estados de conexão para cores
  const statusColors = {
    CONNECTING: 'text-yellow-500',
    CONNECTED: 'text-green-500',
    DISCONNECTED: 'text-gray-500',
    RECONNECTING: 'text-yellow-500',
    FAILED: 'text-red-500'
  };
  
  return (
    <div className="realtime-status">
      <div className={`status-indicator ${statusColors[connectionState]}`}>
        {statusMessages[connectionState]}
      </div>
      {error && (
        <div className="error-message text-red-500">
          {error.message}
        </div>
      )}
      <div className="connection-stats text-xs text-gray-500">
        Canais: {connectionStats.channelsCount || 0}
      </div>
    </div>
  );
}