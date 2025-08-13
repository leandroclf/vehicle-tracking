"use client";

/**
 * Sistema de sincronização offline para o sistema de rastreamento de veículos
 * 
 * Este módulo implementa funcionalidades para garantir que dados críticos estejam
 * disponíveis mesmo sem conexão com a internet, utilizando IndexedDB para armazenamento
 * local e sincronização quando a conexão for restabelecida.
 */

// Tipos de entidades que podem ser sincronizadas offline
export type SyncableEntity = 'vehicles' | 'drivers' | 'geofences' | 'alerts' | 'reports';

// Interface para itens na fila de sincronização
interface SyncQueueItem {
  id: string;
  entity: SyncableEntity;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

// Configuração para cada entidade sincronizável
interface EntityConfig {
  apiEndpoint: string;
  requiredFields: string[];
  localStorageKey: string;
  syncInterval: number; // em milissegundos
  maxRetries: number;
}

// Configurações para cada tipo de entidade
const entityConfigs: Record<SyncableEntity, EntityConfig> = {
  vehicles: {
    apiEndpoint: '/api/vehicles',
    requiredFields: ['id', 'plate', 'model'],
    localStorageKey: 'offline_vehicles',
    syncInterval: 60000, // 1 minuto
    maxRetries: 5
  },
  drivers: {
    apiEndpoint: '/api/drivers',
    requiredFields: ['id', 'name'],
    localStorageKey: 'offline_drivers',
    syncInterval: 300000, // 5 minutos
    maxRetries: 3
  },
  geofences: {
    apiEndpoint: '/api/geofences',
    requiredFields: ['id', 'name', 'type'],
    localStorageKey: 'offline_geofences',
    syncInterval: 300000, // 5 minutos
    maxRetries: 3
  },
  alerts: {
    apiEndpoint: '/api/alerts',
    requiredFields: ['id', 'type', 'vehicle_id'],
    localStorageKey: 'offline_alerts',
    syncInterval: 30000, // 30 segundos (prioridade alta)
    maxRetries: 5
  },
  reports: {
    apiEndpoint: '/api/reports',
    requiredFields: ['id', 'type', 'parameters'],
    localStorageKey: 'offline_reports',
    syncInterval: 600000, // 10 minutos
    maxRetries: 2
  }
};

export class OfflineSyncManager {
  private syncQueue: SyncQueueItem[] = [];
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncIntervals: Record<SyncableEntity, NodeJS.Timeout | null> = {
    vehicles: null,
    drivers: null,
    geofences: null,
    alerts: null,
    reports: null
  };

  constructor() {
    this.initIndexedDB();
    this.setupEventListeners();
  }

  /**
   * Inicializa o banco de dados IndexedDB para armazenamento offline
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VehicleTrackingOfflineDB', 1);

      request.onerror = (event) => {
        console.error('Erro ao abrir IndexedDB:', event);
        reject(new Error('Falha ao inicializar banco de dados offline'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB inicializado com sucesso');
        this.loadSyncQueue();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar store para a fila de sincronização
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }

        // Criar stores para cada entidade
        Object.keys(entityConfigs).forEach(entity => {
          if (!db.objectStoreNames.contains(entity)) {
            db.createObjectStore(entity, { keyPath: 'id' });
          }
        });
      };
    });
  }

  /**
   * Configura os event listeners para monitorar o estado da conexão
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Manipula o evento de conexão online
   */
  private handleOnline(): void {
    console.log('Conexão restabelecida. Iniciando sincronização...');
    this.isOnline = true;
    this.startSyncProcess();
  }

  /**
   * Manipula o evento de desconexão
   */
  private handleOffline(): void {
    console.log('Conexão perdida. Operando em modo offline.');
    this.isOnline = false;
    this.stopSyncProcess();
  }

  /**
   * Carrega a fila de sincronização do IndexedDB
   */
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        console.log(`Fila de sincronização carregada: ${this.syncQueue.length} itens`);
        resolve();
      };

      request.onerror = (event) => {
        console.error('Erro ao carregar fila de sincronização:', event);
        reject(new Error('Falha ao carregar fila de sincronização'));
      };
    });
  }

  /**
   * Salva a fila de sincronização no IndexedDB
   */
  private async saveSyncQueue(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      // Limpar store existente
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Adicionar todos os itens atuais
        this.syncQueue.forEach(item => {
          store.add(item);
        });
        
        transaction.oncomplete = () => {
          console.log('Fila de sincronização salva com sucesso');
          resolve();
        };
      };

      transaction.onerror = (event) => {
        console.error('Erro ao salvar fila de sincronização:', event);
        reject(new Error('Falha ao salvar fila de sincronização'));
      };
    });
  }

  /**
   * Inicia o processo de sincronização para todas as entidades
   */
  private startSyncProcess(): void {
    if (!this.isOnline) return;

    // Iniciar sincronização para cada entidade
    Object.entries(entityConfigs).forEach(([entity, config]) => {
      const entityType = entity as SyncableEntity;
      
      // Limpar intervalo existente se houver
      if (this.syncIntervals[entityType]) {
        clearInterval(this.syncIntervals[entityType]!);
      }
      
      // Sincronizar imediatamente
      this.syncEntity(entityType);
      
      // Configurar intervalo de sincronização
      this.syncIntervals[entityType] = setInterval(() => {
        this.syncEntity(entityType);
      }, config.syncInterval);
    });

    // Processar a fila de sincronização
    this.processSyncQueue();
  }

  /**
   * Para todos os processos de sincronização
   */
  private stopSyncProcess(): void {
    Object.entries(this.syncIntervals).forEach(([entity, interval]) => {
      if (interval) {
        clearInterval(interval);
        this.syncIntervals[entity as SyncableEntity] = null;
      }
    });
  }

  /**
   * Sincroniza uma entidade específica
   */
  private async syncEntity(entity: SyncableEntity): Promise<void> {
    if (!this.isOnline || !this.db) return;

    const config = entityConfigs[entity];
    
    try {
      // Buscar dados atualizados da API REST
      const response = await fetch(config.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Atualizar cache local
      await this.updateLocalCache(entity, data || []);
      
      console.log(`Sincronização de ${entity} concluída: ${data?.length || 0} registros`);
    } catch (error) {
      console.error(`Erro ao sincronizar ${entity}:`, error);
    }
  }

  /**
   * Atualiza o cache local com os dados mais recentes
   */
  private async updateLocalCache(entity: SyncableEntity, data: any[]): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([entity], 'readwrite');
      const store = transaction.objectStore(entity);
      
      // Limpar store existente
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Adicionar todos os itens atualizados
        data.forEach(item => {
          store.add(item);
        });
        
        transaction.oncomplete = () => {
          // Atualizar localStorage para acesso rápido aos dados mais críticos
          const config = entityConfigs[entity];
          localStorage.setItem(config.localStorageKey, JSON.stringify(data));
          
          resolve();
        };
      };

      transaction.onerror = (event) => {
        console.error(`Erro ao atualizar cache local para ${entity}:`, event);
        reject(new Error(`Falha ao atualizar cache local para ${entity}`));
      };
    });
  }

  /**
   * Processa a fila de sincronização
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    // Ordenar fila por timestamp (mais antigos primeiro)
    this.syncQueue.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Processar cada item da fila
    for (const item of this.syncQueue) {
      if (item.status === 'processing') continue;

      item.status = 'processing';
      await this.saveSyncQueue();

      try {
        await this.processSyncItem(item);
        
        // Remover item da fila após processamento bem-sucedido
        this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        await this.saveSyncQueue();
      } catch (error) {
        console.error(`Erro ao processar item de sincronização:`, error);
        
        item.status = 'failed';
        item.error = error instanceof Error 
          ? error.message 
          : typeof error === 'string' 
            ? error 
            : 'Erro desconhecido';
        item.retryCount += 1;
        
        const config = entityConfigs[item.entity];
        if (item.retryCount >= config.maxRetries) {
          // Remover item após exceder número máximo de tentativas
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        } else {
          item.status = 'pending';
        }
        
        await this.saveSyncQueue();
      }
    }
  }

  /**
   * Processa um item específico da fila de sincronização
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { entity, operation, data } = item;
    const config = entityConfigs[entity];

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    };

    let response: Response;

    switch (operation) {
      case 'create':
        response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
        break;
      case 'update':
        response = await fetch(`${config.apiEndpoint}/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
        break;
      case 'delete':
        response = await fetch(`${config.apiEndpoint}/${data.id}`, {
          method: 'DELETE',
          headers,
        });
        break;
      default:
        throw new Error(`Operação não suportada: ${operation}`);
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
  }

  /**
   * Adiciona uma operação à fila de sincronização
   */
  public async addToSyncQueue(entity: SyncableEntity, operation: 'create' | 'update' | 'delete', data: any): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: SyncQueueItem = {
      id,
      entity,
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();

    // Se estiver online, iniciar processamento imediatamente
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return id;
  }

  /**
   * Obtém dados de uma entidade do cache local
   */
  public async getLocalData<T>(entity: SyncableEntity): Promise<T[]> {
    if (!this.db) {
      throw new Error('Banco de dados offline não inicializado');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([entity], 'readonly');
      const store = transaction.objectStore(entity);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = (event) => {
        console.error(`Erro ao obter dados locais para ${entity}:`, event);
        reject(new Error(`Falha ao obter dados locais para ${entity}`));
      };
    });
  }

  /**
   * Verifica se há dados pendentes para sincronização
   */
  public hasPendingSyncItems(): boolean {
    return this.syncQueue.length > 0;
  }

  /**
   * Força a sincronização de todas as entidades
   */
  public async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Não é possível sincronizar enquanto estiver offline');
    }

    for (const entity of Object.keys(entityConfigs) as SyncableEntity[]) {
      await this.syncEntity(entity);
    }

    await this.processSyncQueue();
  }
}

// Hook para usar o gerenciador de sincronização offline
export function useOfflineSync() {
  // Singleton para garantir apenas uma instância do gerenciador
  const getManager = () => {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      // Retornar uma implementação mock para o servidor
      return {
        addToSyncQueue: async () => '',
        getLocalData: async () => [],
        hasPendingSyncItems: () => false,
        forceSyncAll: async () => {}
      };
    }
    
    // Estamos no navegador, podemos acessar window
    if (!(window as any).__offlineSyncManager) {
      (window as any).__offlineSyncManager = new OfflineSyncManager();
    }
    return (window as any).__offlineSyncManager as OfflineSyncManager;
  };

  const manager = getManager();

  return {
    /**
     * Adiciona uma operação à fila de sincronização
     */
    addToSyncQueue: (entity: SyncableEntity, operation: 'create' | 'update' | 'delete', data: any) => {
      return manager.addToSyncQueue(entity, operation, data);
    },

    /**
     * Obtém dados de uma entidade do cache local
     */
    getLocalData: <T>(entity: SyncableEntity) => {
      return manager.getLocalData<T>(entity);
    },

    /**
     * Verifica se há dados pendentes para sincronização
     */
    hasPendingSyncItems: () => {
      return manager.hasPendingSyncItems();
    },

    /**
     * Força a sincronização de todas as entidades
     */
    forceSyncAll: () => {
      return manager.forceSyncAll();
    }
  };
}