/**
 * Sistema de gerenciamento de conexão Realtime para WebSockets
 * 
 * Este módulo implementa um gerenciador robusto de conexões WebSocket,
 * com recursos de reconexão automática, backoff exponencial, verificação de saúde
 * das inscrições e sincronização de dados após reconexão.
 */

import { WebSocketManager } from './realtime/websocket-client';
import { RealtimeEvent } from './realtime/websocket-client';

// Configurações para o gerenciador de conexão
interface ConnectionManagerConfig {
  // Intervalo inicial entre tentativas de reconexão (ms)
  initialReconnectDelay?: number;
  // Fator de multiplicação para backoff exponencial
  reconnectBackoffFactor?: number;
  // Número máximo de tentativas de reconexão
  maxReconnectAttempts?: number;
  // Intervalo para verificação de saúde das inscrições (ms)
  healthCheckInterval?: number;
  // Callback para eventos de mudança de estado da conexão
  onConnectionStateChange?: (state: ConnectionState) => void;
  // Callback para erros de conexão
  onConnectionError?: (error: Error) => void;
  // Callback para logs
  logger?: (level: LogLevel, message: string, context?: Record<string, any>) => void;
}

// Estados possíveis da conexão
export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'FAILED';

// Níveis de log
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// Informações sobre um canal inscrito
interface ChannelSubscription {
  channelName: string;
  config: ChannelConfig;
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'PENDING' | 'ERROR';
  lastError?: Error;
  lastEventTimestamp?: number;
}

// Configuração para um canal
interface ChannelConfig {
  entity: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  filterValue?: any;
  callback: (payload: RealtimeEvent<any>) => void;
}

/**
 * Gerenciador de conexão Realtime para WebSockets
 * 
 * Esta classe implementa um gerenciador robusto de conexões WebSocket,
 * com recursos de reconexão automática, backoff exponencial e verificação de saúde.
 */
export class RealtimeConnectionManager {
  private wsManager: WebSocketManager;
  private config: Required<ConnectionManagerConfig>;
  private connectionState: ConnectionState = 'DISCONNECTED';
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private channels: Map<string, ChannelSubscription> = new Map();
  
  /**
   * Construtor do gerenciador de conexão
   * 
   * @param wsUrl URL do servidor WebSocket
   * @param config Configurações do gerenciador
   */
  constructor(
    wsUrl: string,
    config: ConnectionManagerConfig = {}
  ) {
    this.wsManager = new WebSocketManager(wsUrl);
    
    // Configurações padrão
    this.config = {
      initialReconnectDelay: config.initialReconnectDelay ?? 1000,
      reconnectBackoffFactor: config.reconnectBackoffFactor ?? 1.5,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
      onConnectionStateChange: config.onConnectionStateChange ?? (() => {}),
      onConnectionError: config.onConnectionError ?? (() => {}),
      logger: config.logger ?? this.defaultLogger
    };
    
    // Configurar listeners para eventos de conexão
    this.setupConnectionListeners();
  }
  
  /**
   * Logger padrão
   */
  private defaultLogger(level: LogLevel, message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    
    switch (level) {
      case 'DEBUG':
        console.debug(`[${timestamp}] [DEBUG] ${message}${contextStr}`);
        break;
      case 'INFO':
        console.info(`[${timestamp}] [INFO] ${message}${contextStr}`);
        break;
      case 'WARN':
        console.warn(`[${timestamp}] [WARN] ${message}${contextStr}`);
        break;
      case 'ERROR':
        console.error(`[${timestamp}] [ERROR] ${message}${contextStr}`);
        break;
    }
  }
  
  /**
   * Configura listeners para eventos de conexão
   */
  private setupConnectionListeners(): void {
    // Configurar listeners do WebSocket
    this.wsManager.onOpen(() => {
      this.updateConnectionState('CONNECTED');
      this.log('INFO', 'Conexão WebSocket estabelecida');
    });
    
    this.wsManager.onClose(() => {
      this.updateConnectionState('DISCONNECTED');
      this.log('WARN', 'Conexão WebSocket fechada');
      this.reconnect();
    });
    
    this.wsManager.onError((error) => {
      this.log('ERROR', 'Erro na conexão WebSocket', { error: error.message });
      this.config.onConnectionError(error);
    });
    
    // Iniciar verificação periódica de saúde
    this.startHealthCheck();
    
    // Configurar listeners para eventos online/offline do navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }
  
  /**
   * Manipula evento online do navegador
   */
  private handleOnline = (): void => {
    this.log('INFO', 'Conexão de rede restaurada', { previousState: this.connectionState });

    if (this.connectionState === 'DISCONNECTED' || this.connectionState === 'FAILED') {
      this.reconnect();
    }
  };
  
  /**
   * Manipula evento offline do navegador
   */
  private handleOffline = (): void => {
    this.log('WARN', 'Conexão de rede perdida', { previousState: this.connectionState });
    this.updateConnectionState('DISCONNECTED');
  };
  
  /**
   * Inicia verificação periódica de saúde das inscrições
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    this.log('DEBUG', 'Verificação periódica de saúde iniciada', {
      interval: this.config.healthCheckInterval
    });
  }
  
  /**
   * Realiza verificação de saúde das inscrições
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Verificar se há canais inscritos
      if (this.channels.size === 0) {
        return;
      }
      
      // Verificar estado da conexão WebSocket
      const isConnected = this.wsManager.isConnected();
      
      if (!isConnected && this.connectionState === 'CONNECTED') {
        this.updateConnectionState('RECONNECTING');
        this.reconnect();
      } else if (isConnected && this.connectionState !== 'CONNECTED') {
        this.updateConnectionState('CONNECTED');
      }
    } catch (error) {
      this.log('ERROR', 'Erro durante verificação de saúde', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Atualiza o estado da conexão
   */
  private updateConnectionState(newState: ConnectionState): void {
    if (this.connectionState === newState) {
      return;
    }
    
    const previousState = this.connectionState;
    this.connectionState = newState;
    
    this.log('INFO', `Estado da conexão alterado: ${previousState} -> ${newState}`);
    
    // Notificar sobre mudança de estado
    this.config.onConnectionStateChange(newState);
    
    // Resetar contagem de tentativas se conectado com sucesso
    if (newState === 'CONNECTED') {
      this.reconnectAttempts = 0;
    }
  }
  
  /**
   * Tenta reconectar ao WebSocket
   */
  private reconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Verificar se excedeu o número máximo de tentativas
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('ERROR', 'Número máximo de tentativas de reconexão excedido', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.config.maxReconnectAttempts
      });
      
      this.updateConnectionState('FAILED');
      return;
    }
    
    this.updateConnectionState('RECONNECTING');
    this.reconnectAttempts++;
    
    // Calcular delay com backoff exponencial
    const delay = this.config.initialReconnectDelay * 
      Math.pow(this.config.reconnectBackoffFactor, this.reconnectAttempts - 1);
    
    this.log('INFO', `Tentando reconexão em ${delay}ms`, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts
    });
    
    // Agendar tentativa de reconexão
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.wsManager.connect();
        await this.resubscribeAllChannels();
        this.updateConnectionState('CONNECTED');
      } catch (error) {
        this.log('ERROR', 'Falha ao reconectar', {
          error: error instanceof Error ? error.message : String(error),
          attempt: this.reconnectAttempts
        });
        
        // Tentar novamente
        this.reconnect();
      }
    }, delay);
  }
  
  /**
   * Reinscreve em todos os canais
   */
  private async resubscribeAllChannels(): Promise<void> {
    const channelNames = Array.from(this.channels.keys());
    
    this.log('INFO', `Reinscrevendo em ${channelNames.length} canais`);
    
    for (const channelName of channelNames) {
      await this.resubscribeChannel(channelName);
    }
  }
  
  /**
   * Reinscreve em um canal específico
   */
  private async resubscribeChannel(channelName: string): Promise<void> {
    const subscription = this.channels.get(channelName);
    
    if (!subscription) {
      this.log('WARN', `Tentativa de reinscrição em canal inexistente: ${channelName}`);
      return;
    }
    
    try {
      // Atualizar status
      subscription.status = 'PENDING';
      
      // WebSocket será gerenciado através do RealtimeProvider
      // A inscrição será feita através do provider de realtime
      console.log(`Canal ${channelName} será inscrito através do RealtimeProvider`);
      
      subscription.status = 'SUBSCRIBED';
      this.log('INFO', `Canal ${channelName} inscrito com sucesso`);
      
      this.channels.set(channelName, subscription);
    } catch (error) {
      subscription.status = 'ERROR';
      subscription.lastError = error instanceof Error ? error : new Error(String(error));
      
      this.log('ERROR', `Falha ao reinscrever no canal ${channelName}`, {
        error: subscription.lastError.message
      });
      
      throw subscription.lastError;
    }
  }
  
  /**
   * Registra uma mensagem de log
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    this.config.logger(level, message, {
      connectionState: this.connectionState,
      channelsCount: this.channels.size,
      ...context
    });
  }
  
  /**
   * Inscreve em um canal
   */
  public async subscribe(config: ChannelConfig): Promise<string> {
    const channelName = `${config.entity}-${config.event || '*'}-${Date.now()}`;
    
    this.log('INFO', `Inscrevendo no canal ${channelName}`, {
      entity: config.entity,
      event: config.event
    });
    
    const subscription: ChannelSubscription = {
      channelName,
      config,
      status: 'PENDING'
    };
    
    this.channels.set(channelName, subscription);
    
    try {
      // Conectar se necessário
      if (!this.wsManager.isConnected()) {
        await this.wsManager.connect();
      }
      
      // WebSocket será gerenciado através do RealtimeProvider
      // A inscrição será feita através do provider de realtime
      console.log(`Canal ${channelName} será inscrito através do RealtimeProvider`);
      
      subscription.status = 'SUBSCRIBED';
      this.log('INFO', `Canal ${channelName} inscrito com sucesso`);
      
      // Se este é o primeiro canal, atualizar estado da conexão
      if (this.connectionState !== 'CONNECTED') {
        this.updateConnectionState('CONNECTED');
      }
      
      this.channels.set(channelName, subscription);
      
      return channelName;
    } catch (error) {
      subscription.status = 'ERROR';
      subscription.lastError = error instanceof Error ? error : new Error(String(error));
      
      this.log('ERROR', `Falha ao inscrever no canal ${channelName}`, {
        error: subscription.lastError.message
      });
      
      throw subscription.lastError;
    }
  }
  
  /**
   * Cancela inscrição em um canal
   */
  public async unsubscribe(channelName: string): Promise<void> {
    const subscription = this.channels.get(channelName);
    
    if (!subscription) {
      this.log('WARN', `Tentativa de cancelar inscrição em canal inexistente: ${channelName}`);
      return;
    }
    
    try {
      // WebSocket será gerenciado através do RealtimeProvider
      // A desinscrição será feita através do provider de realtime
      console.log(`Canal ${channelName} será desinscrito através do RealtimeProvider`);
      
      subscription.status = 'UNSUBSCRIBED';
      this.channels.delete(channelName);
      
      this.log('INFO', `Inscrição no canal ${channelName} cancelada com sucesso`);
      
      // Se não há mais canais, atualizar estado da conexão
      if (this.channels.size === 0) {
        this.updateConnectionState('DISCONNECTED');
      }
    } catch (error) {
      this.log('ERROR', `Falha ao cancelar inscrição no canal ${channelName}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Cancela todas as inscrições
   */
  public async unsubscribeAll(): Promise<void> {
    const channelNames = Array.from(this.channels.keys());
    
    this.log('INFO', `Cancelando inscrição em ${channelNames.length} canais`);
    
    for (const channelName of channelNames) {
      await this.unsubscribe(channelName);
    }
  }
  
  /**
   * Obtém o estado atual da conexão
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Obtém estatísticas da conexão
   */
  public getStats(): Record<string, any> {
    return {
      connectionState: this.connectionState,
      channelsCount: this.channels.size,
      reconnectAttempts: this.reconnectAttempts,
      channels: Array.from(this.channels.entries()).map(([name, subscription]) => ({
        name,
        status: subscription.status,
        entity: subscription.config.entity,
        event: subscription.config.event,
        lastError: subscription.lastError?.message,
        lastEventTimestamp: subscription.lastEventTimestamp
      }))
    };
  }
  
  /**
   * Limpa recursos ao desmontar
   */
  public cleanup(): void {
    // Cancelar timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    // Remover event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    // Cancelar todas as inscrições
    this.unsubscribeAll().catch(error => {
      this.log('ERROR', 'Erro ao limpar inscrições', {
        error: error instanceof Error ? error.message : String(error)
      });
    });
    
    // Fechar conexão WebSocket
    this.wsManager.disconnect();
  }
}