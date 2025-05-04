# Documentação de Integração de APIs

## Visão Geral

Este documento descreve a integração entre as APIs do sistema de rastreamento veicular e o frontend, incluindo o sistema de notificações em tempo real, hooks personalizados e o formato de resposta padronizado.

## Sistema de Notificações em Tempo Real

O sistema de notificações em tempo real foi implementado utilizando o Supabase Realtime, permitindo que os usuários recebam atualizações instantâneas sobre eventos importantes, como alertas de veículos, atualizações de posição e eventos de geocercas.

### Componentes Principais

1. **NotificationsProvider**: Provedor de contexto que gerencia o estado das notificações e fornece métodos para interagir com elas.
2. **RealtimeNotifications**: Componente que se inscreve nos canais do Supabase Realtime e exibe notificações toast.
3. **NotificationsBell**: Componente de interface que exibe o ícone de sino com contador de notificações não lidas e um dropdown com a lista de notificações.

### Hooks Personalizados

1. **useRealtimeSubscription**: Hook genérico para se inscrever em canais do Supabase Realtime.
2. **useTableSubscription**: Hook para se inscrever em atualizações de tabelas específicas.
3. **useVehiclesSubscription**: Hook específico para atualizações de veículos.
4. **useAlertsSubscription**: Hook específico para novos alertas.
5. **useGeofencesSubscription**: Hook específico para atualizações de geocercas.

## Cliente API Padronizado

O cliente API padronizado fornece uma interface consistente para todas as chamadas de API, incluindo cache de dados, tratamento de erros uniforme e formato de resposta padronizado.

### Formato de Resposta Padronizado

Todas as APIs retornam respostas no seguinte formato:

```typescript
interface ApiResponse<T> {
  data: T | null;        // Dados retornados pela API ou null em caso de erro
  error: Error | null;   // Objeto de erro ou null em caso de sucesso
  status: number;        // Código de status HTTP
  message: string;       // Mensagem descritiva
  timestamp: string;     // Timestamp da resposta
}
```

### Exemplo de Uso do Cliente API

```typescript
import { apiClient } from '@/lib/apiClient';

// Exemplo de GET com cache
const getVehicles = async () => {
  const response = await apiClient.get('/api/vehicles', {}, true);
  if (response.error) {
    console.error('Erro ao buscar veículos:', response.error);
    return [];
  }
  return response.data;
};

// Exemplo de POST com invalidação de cache
const createVehicle = async (vehicleData) => {
  const response = await apiClient.post('/api/vehicles', vehicleData, true);
  return response;
};
```

### Hook useApi

O hook `useApi` fornece uma interface mais amigável para o cliente API, incluindo estados de carregamento, tratamento de erros e integração com o sistema de notificações.

```typescript
import { useApi } from '@/lib/hooks/useApi';

function VehiclesList() {
  const { get, loading, error } = useApi();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const response = await get('/api/vehicles');
      if (response.data) {
        setVehicles(response.data);
      }
    };
    fetchVehicles();
  }, [get]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error.message}</p>;

  return (
    <div>
      {vehicles.map(vehicle => (
        <div key={vehicle.id}>{vehicle.name}</div>
      ))}
    </div>
  );
}
```

## Rotas de API Disponíveis

### Veículos

- `GET /api/vehicles` - Lista todos os veículos
- `GET /api/vehicles/:id` - Obtém detalhes de um veículo específico
- `POST /api/vehicles` - Cria um novo veículo
- `PUT /api/vehicles/:id` - Atualiza um veículo existente
- `DELETE /api/vehicles/:id` - Remove um veículo
- `GET /api/vehicles/positions` - Obtém as posições atuais de todos os veículos
- `GET /api/vehicles/:id/history` - Obtém o histórico de posições de um veículo
- `POST /api/vehicles/:id/command` - Envia um comando para um veículo

### Alertas

- `GET /api/alerts` - Lista todos os alertas
- `GET /api/alerts/:id` - Obtém detalhes de um alerta específico
- `PATCH /api/alerts` - Marca alertas como lidos
- `PUT /api/alerts/read-all` - Marca todos os alertas como lidos

### Relatórios

- `GET /api/reports` - Lista todos os relatórios
- `GET /api/reports/:id` - Obtém um relatório específico
- `POST /api/reports/generate` - Gera um novo relatório
- `DELETE /api/reports/:id` - Remove um relatório

### Monitoramento

- `GET /api/monitoring/events` - Lista eventos de monitoramento
- `GET /api/monitoring/export` - Exporta dados de monitoramento

### Geocercas

- `GET /api/geofences` - Lista todas as geocercas
- `GET /api/geofences/:id` - Obtém detalhes de uma geocerca específica
- `POST /api/geofences` - Cria uma nova geocerca
- `PUT /api/geofences/:id` - Atualiza uma geocerca existente
- `DELETE /api/geofences/:id` - Remove uma geocerca
- `POST /api/geofences/check` - Verifica se um veículo está dentro de uma geocerca

### Motoristas

- `GET /api/drivers` - Lista todos os motoristas
- `GET /api/drivers/:id` - Obtém detalhes de um motorista específico
- `POST /api/drivers` - Cadastra um novo motorista
- `PUT /api/drivers/:id` - Atualiza um motorista existente
- `DELETE /api/drivers/:id` - Remove um motorista
- `POST /api/drivers/assign` - Atribui um motorista a um veículo

### Configurações

- `GET /api/settings/notifications` - Obtém configurações de notificações
- `PUT /api/settings/notifications` - Atualiza configurações de notificações
- `GET /api/settings/preferences` - Obtém preferências do usuário
- `PUT /api/settings/preferences` - Atualiza preferências do usuário

## Tratamento de Erros

O sistema implementa um tratamento de erros uniforme em todas as APIs, com os seguintes recursos:

1. **Formato de erro padronizado**: Todas as APIs retornam erros no mesmo formato.
2. **Notificações automáticas**: Erros são automaticamente exibidos como notificações para o usuário.
3. **Logging centralizado**: Todos os erros são registrados de forma centralizada para facilitar o diagnóstico.
4. **Códigos de erro específicos**: Cada tipo de erro possui um código específico para facilitar o tratamento.

## Cache de Dados

O sistema implementa cache de dados para melhorar a performance do frontend, com as seguintes características:

1. **Cache em memória**: Respostas de API são armazenadas em cache na memória do navegador.
2. **Tempo de expiração configurável**: Cada endpoint pode ter um tempo de expiração de cache diferente.
3. **Invalidação automática**: O cache é automaticamente invalidado quando dados são modificados.
4. **Controle manual**: É possível controlar manualmente quando usar ou não o cache.

## Integração com Supabase Realtime

A integração com o Supabase Realtime permite atualizações em tempo real, com os seguintes recursos:

1. **Inscrição em canais**: O frontend se inscreve em canais específicos para receber atualizações.
2. **Atualização automática da UI**: A interface é automaticamente atualizada quando novos dados são recebidos.
3. **Notificações em tempo real**: Notificações são exibidas quando eventos importantes ocorrem.
4. **Sincronização entre dispositivos**: Os dados são sincronizados entre diferentes dispositivos do mesmo usuário.

## Próximos Passos

1. **Implementar Edge Functions**: Utilizar funções serverless do Supabase para lógica complexa.
2. **Expandir Realtime para mais entidades**: Adicionar suporte a mais entidades no sistema de tempo real.
3. **Implementar sincronização offline**: Permitir que o aplicativo funcione offline e sincronize quando online.
4. **Adicionar métricas de performance**: Monitorar e otimizar o desempenho das APIs.
5. **Expandir documentação**: Adicionar mais exemplos e casos de uso para cada API.