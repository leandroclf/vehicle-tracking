# Sistema Robusto de Reconexão para Supabase Realtime

## Visão Geral

Este documento descreve o sistema robusto de reconexão implementado para o Supabase Realtime no projeto de rastreamento de veículos. O sistema foi projetado para lidar com problemas comuns em conexões WebSocket, como:

- Desconexões inesperadas devido a problemas de rede
- Perda de eventos durante períodos offline
- Falta de observabilidade do estado da conexão
- Inconsistências nos dados após reconexão

## Componentes Principais

### 1. RealtimeConnectionManager

Classe principal que gerencia conexões Realtime com o Supabase, implementando:

- Reconexão automática com backoff exponencial
- Verificação periódica de saúde das inscrições
- Sistema de logging estruturado
- Reinscrição automática em canais após reconexão

```typescript
// Exemplo de uso direto da classe
import { RealtimeConnectionManager } from '@/lib/realtime-connection-manager';

const manager = new RealtimeConnectionManager(supabaseClient, {
  initialReconnectDelay: 1000,
  reconnectBackoffFactor: 1.5,
  maxReconnectAttempts: 10,
  healthCheckInterval: 30000,
  onConnectionStateChange: (state) => console.log(`Conexão: ${state}`),
  onConnectionError: (error) => console.error(error),
  logger: (level, message, context) => console.log(`[${level}] ${message}`, context)
});

// Inscrever-se em um canal
const channelName = await manager.subscribe({
  entity: 'vehicles',
  event: 'UPDATE',
  callback: (payload) => console.log('Veículo atualizado:', payload)
});

// Cancelar inscrição
await manager.unsubscribe(channelName);

// Limpar recursos
manager.cleanup();
```

### 2. Hooks React

#### useRealtimeConnection

Hook personalizado que encapsula o RealtimeConnectionManager para uso em componentes React:

```typescript
import { useRealtimeConnection } from '@/lib/hooks/useRealtimeConnection';

function MyComponent() {
  const { 
    subscribe, 
    unsubscribe, 
    connectionState, 
    connectionStats, 
    error 
  } = useRealtimeConnection(supabaseClient);
  
  // Usar as funções para gerenciar assinaturas
}
```

#### useRealtimeSubscription

Hook simplificado para assinatura em uma única entidade:

```typescript
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeConnection';

function MyComponent() {
  const { 
    connectionState, 
    isConnected, 
    isReconnecting, 
    hasError 
  } = useRealtimeSubscription(
    supabaseClient,
    {
      entity: 'vehicles',
      event: 'UPDATE',
      filter: 'status',
      filterValue: 'ACTIVE'
    },
    (payload) => {
      console.log('Veículo atualizado:', payload);
    }
  );
  
  // Usar o estado da conexão para feedback na UI
}
```

#### useSyncAfterReconnection

Hook para sincronizar dados perdidos durante desconexões:

```typescript
import { useSyncAfterReconnection } from '@/lib/hooks/useSyncAfterReconnection';

function MyComponent() {
  const { 
    isSyncing, 
    lastSyncTimestamp, 
    syncError, 
    forceSyncData 
  } = useSyncAfterReconnection(supabaseClient, {
    table: 'vehicles',
    timestampColumn: 'updated_at',
    fetchUpdatedData: async (lastSync) => {
      const { data } = await supabaseClient
        .from('vehicles')
        .select('*')
        .gt('updated_at', lastSync.toISOString());
      return data || [];
    },
    onDataSynced: (data) => {
      console.log(`Sincronizados ${data.length} veículos`);
    }
  });
  
  // Usar o estado da sincronização para feedback na UI
}
```

#### useTableSyncAfterReconnection

Versão simplificada para sincronizar uma tabela específica:

```typescript
import { useTableSyncAfterReconnection } from '@/lib/hooks/useSyncAfterReconnection';

function MyComponent() {
  const { 
    isSyncing, 
    lastSyncTimestamp, 
    syncError, 
    forceSyncData 
  } = useTableSyncAfterReconnection(
    supabaseClient,
    'vehicles',
    'updated_at',
    (syncedData) => {
      console.log(`Sincronizados ${syncedData.length} veículos`);
    }
  );
  
  // Usar o estado da sincronização para feedback na UI
}
```

### 3. Componentes de Contexto

#### RealtimeProvider

Provedor de contexto para fornecer conexão Realtime para toda a aplicação:

```tsx
import { RealtimeProvider } from '@/lib/providers/RealtimeProvider';

function MyApp() {
  return (
    <RealtimeProvider 
      supabaseClient={supabase}
      options={{
        initialReconnectDelay: 1000,
        reconnectBackoffFactor: 1.5,
        maxReconnectAttempts: 10,
        healthCheckInterval: 15000,
      }}
    >
      {/* Componentes da aplicação */}
    </RealtimeProvider>
  );
}
```

#### useRealtimeContext

Hook para acessar o contexto Realtime em qualquer componente:

```tsx
import { useRealtimeContext } from '@/lib/providers/RealtimeProvider';

function MyComponent() {
  const { 
    subscribe, 
    unsubscribe, 
    connectionState, 
    isConnected, 
    isReconnecting 
  } = useRealtimeContext();
  
  // Usar as funções e estados do contexto
}
```

#### GlobalSubscriptions

Componente para gerenciar assinaturas globais:

```tsx
import { GlobalSubscriptions } from '@/lib/providers/RealtimeProvider';

function MyApp() {
  return (
    <RealtimeProvider supabaseClient={supabase}>
      <GlobalSubscriptions 
        subscriptions={[
          {
            config: {
              entity: 'notifications',
              event: '*'
            },
            callback: (payload) => {
              // Processar notificações globais
            }
          }
        ]}
      />
      
      {/* Resto da aplicação */}
    </RealtimeProvider>
  );
}
```

#### RealtimeConnectionStatus

Componente para exibir o estado da conexão:

```tsx
import { RealtimeConnectionStatus } from '@/lib/providers/RealtimeProvider';

function MyComponent() {
  return (
    <div>
      <h2>Status da Conexão</h2>
      <RealtimeConnectionStatus />
    </div>
  );
}
```

## Fluxo de Trabalho Recomendado

1. **Configuração Inicial**:
   - Adicione o `RealtimeProvider` no nível mais alto da aplicação
   - Configure assinaturas globais com `GlobalSubscriptions` se necessário

2. **Em Componentes Específicos**:
   - Use `useRealtimeSubscription` para assinaturas simples
   - Use `useTableSyncAfterReconnection` para garantir sincronização após reconexão
   - Adicione `RealtimeConnectionStatus` para feedback visual ao usuário

3. **Para Casos Avançados**:
   - Use `useRealtimeContext` para acesso direto às funções de gerenciamento
   - Implemente lógica personalizada com `useSyncAfterReconnection`

## Benefícios do Sistema

- **Resiliência**: Reconexão automática com backoff exponencial
- **Consistência**: Sincronização de dados perdidos durante desconexões
- **Observabilidade**: Logs estruturados e componentes de status
- **Flexibilidade**: API simples para casos comuns, mas extensível para casos avançados
- **Desempenho**: Gerenciamento eficiente de canais e recursos

## Exemplos Práticos

Consulte os exemplos implementados em:

- `/app/examples/realtime-connection/page.tsx`: Demonstração básica do sistema de reconexão
- `/app/examples/sync-after-reconnection/page.tsx`: Exemplo de sincronização após reconexão
- `/app/examples/realtime-integration-test/page.tsx`: Teste completo de integração

## Considerações de Desempenho

- Evite criar múltiplas instâncias do `RealtimeConnectionManager`
- Use o `RealtimeProvider` no nível mais alto possível da aplicação
- Cancele assinaturas não utilizadas com `unsubscribe`
- Configure o `healthCheckInterval` adequadamente (valores muito baixos podem sobrecarregar a rede)

## Solução de Problemas

### Conexão não estabelecida

- Verifique se as credenciais do Supabase estão corretas
- Confirme se o serviço Realtime está ativado no projeto Supabase
- Verifique se há bloqueios de firewall ou proxy

### Eventos não recebidos

- Verifique o estado da conexão com `connectionState`
- Confirme se a tabela tem o gatilho de Realtime ativado
- Verifique se os filtros estão configurados corretamente

### Problemas de sincronização

- Confirme se a coluna de timestamp está sendo atualizada corretamente
- Verifique se há erros no callback `onDataSynced`
- Use `forceSyncData` para testar a sincronização manualmente