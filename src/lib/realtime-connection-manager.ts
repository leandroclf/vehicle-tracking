/**
 * Sistema de gerenciamento de conexão Realtime para o Supabase
 * 
 * Este módulo implementa um gerenciador robusto de conexões para o Supabase Realtime,
 * com recursos de reconexão automática, backoff exponencial, verificação de saúde
 * das inscrições e sincronização de dados após reconexão.
 */

import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

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
  channel: RealtimeChannel;
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
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
}

/**
 * Gerenciador de conexão Realtime para o Supabase
 * 
 * Esta classe implementa um gerenciador robusto de conexões para o Supabase Realtime,
 * com recursos de reconexão automática, backoff exponencial e verificação de saúde.
 */
export class RealtimeConnectionManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private config: Required<ConnectionManagerConfig>;
  private connectionState: ConnectionState = 'DISCONNECTED';
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private channels: Map<string, ChannelSubscription> = new Map();
  
  /**
   * Construtor do gerenciador de conexão
   * 
   * @param supabaseClient Cliente Supabase inicializado
   * @param config Configurações do gerenciador
   */
  constructor(
    supabaseClient: ReturnType<typeof createClient<Database>>,
    config: ConnectionManagerConfig = {}
  ) {
    this.supabase = supabaseClient;
    
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
    // Implementar listeners para eventos de conexão do Supabase
    // Nota: A API atual do Supabase não expõe diretamente eventos de conexão WebSocket
    // Então vamos usar verificações periódicas de saúde
    
    // Iniciar verificação periódica de saúde
    this.startHealthCheck();
    
    // Configurar listeners para eventos online/offline do navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }
  
  /**
   * Manipula evento online do navegador
   */
  private handleOnline(): void {
    this.log('INFO', 'Conexão de rede restaurada', { previousState: this.connectionState });
    
    if (this.connectionState === 'DISCONNECTED' || this.connectionState === 'FAILED') {
      this.reconnect();
    }
  }
  
  /**
   * Manipula evento offline do navegador
   */
  private handleOffline(): void {
    this.log('WARN', 'Conexão de rede perdida', { previousState: this.connectionState });
    this.updateConnectionState('DISCONNECTED');
  }
  
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
      
      // Verificar estado de cada canal
      let allChannelsHealthy = true;
      
      for (const [channelName, subscription] of this.channels.entries()) {
        // Verificar se o canal está inscrito
        if (subscription.status !== 'SUBSCRIBED') {
          allChannelsHealthy = false;
          this.log('WARN', `Canal ${channelName} não está inscrito`, {
            status: subscription.status,
            lastError: subscription.lastError?.message
          });
          
          // Tentar reinscrever o canal
          await this.resubscribeChannel(channelName);
        }
      }
      
      // Atualizar estado da conexão com base na saúde dos canais
      if (allChannelsHealthy && this.connectionState !== 'CONNECTED') {
        this.updateConnectionState('CONNECTED');
      } else if (!allChannelsHealthy && this.connectionState === 'CONNECTED') {
        this.updateConnectionState('RECONNECTING');
        this.reconnect();
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
   * Tenta reconectar ao Supabase Realtime
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
      // Remover inscrição anterior se existir
      if (subscription.channel) {
        await this.supabase.removeChannel(subscription.channel);
      }
      
      // Atualizar status
      subscription.status = 'PENDING';
      
      // Criar nova inscrição
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: subscription.config.event || '*',
            schema: subscription.config.schema || 'public',
            table: subscription.config.entity,
            ...(subscription.config.filter && subscription.config.filterValue ? 
              { filter: `${subscription.config.filter}=eq.${subscription.config.filterValue}` } : {})
          },
          (payload) => {
            try {
              // Atualizar timestamp do último evento
              subscription.lastEventTimestamp = Date.now();
              
              // Chamar callback com tratamento de erros
              subscription.config.callback(payload);
            } catch (error) {
              this.log('ERROR', `Erro ao processar evento no canal ${channelName}`, {
                error: error instanceof Error ? error.message : String(error),
                payload
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            subscription.status = 'SUBSCRIBED';
            this.log('INFO', `Canal ${channelName} inscrito com sucesso`);
          } else if (status === 'CHANNEL_ERROR') {
            subscription.status = 'ERROR';
            subscription.lastError = new Error(`Erro ao inscrever no canal ${channelName}`);
            this.log('ERROR', `Erro ao inscrever no canal ${channelName}`);
          }
        });
      
      // Atualizar referência do canal
      subscription.channel = channel;
      
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
      channel: null as unknown as RealtimeChannel, // Será definido durante a inscrição
      config,
      status: 'PENDING'
    };
    
    this.channels.set(channelName, subscription);
    
    try {
      // Criar inscrição
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.entity,
            ...(config.filter && config.filterValue ? 
              { filter: `${config.filter}=eq.${config.filterValue}` } : {})
          },
          (payload) => {
            try {
              // Atualizar timestamp do último evento
              subscription.lastEventTimestamp = Date.now();
              
              // Chamar callback com tratamento de erros
              config.callback(payload);
            } catch (error) {
              this.log('ERROR', `Erro ao processar evento no canal ${channelName}`, {
                error: error instanceof Error ? error.message : String(error),
                payload
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            subscription.status = 'SUBSCRIBED';
            this.log('INFO', `Canal ${channelName} inscrito com sucesso`);
            
            // Se este é o primeiro canal, atualizar estado da conexão
            if (this.connectionState !== 'CONNECTED') {
              this.updateConnectionState('CONNECTED');
            }
          } else if (status === 'CHANNEL_ERROR') {
            subscription.status = 'ERROR';
            subscription.lastError = new Error(`Erro ao inscrever no canal ${channelName}`);
            this.log('ERROR', `Erro ao inscrever no canal ${channelName}`);
          }
        });
      
      // Atualizar referência do canal
      subscription.channel = channel;
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
      await this.supabase.removeChannel(subscription.channel);
      
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
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    
    // Cancelar todas as inscrições
    this.unsubscribeAll().catch(error => {
      this.log('ERROR', 'Erro ao limpar inscrições', {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }
}