# Servidor de Rastreamento (Tracker Server)

O Tracker Server é um componente crítico da solução Yukz de rastreamento veicular, responsável por receber, processar e armazenar dados transmitidos pelos dispositivos rastreadores instalados nos veículos.

## Visão Geral

O Tracker Server é um serviço Node.js dedicado que:
- Escuta conexões TCP/UDP de dispositivos rastreadores GPS
- Decodifica os dados recebidos de acordo com protocolos específicos
- Processa coordenadas e outros dados telemétricos
- Armazena informações no banco de dados Supabase
- Gera alertas com base em regras configuradas (velocidade, geocercas, etc.)

## Arquitetura

O servidor foi projetado com uma arquitetura modular para suportar diferentes protocolos de rastreamento:

```
+-------------------+
|   TCP/UDP Server  |
+---------|---------+
          |
+---------v---------+
| Protocol Decoders |
| - Teltonika       |
| - Queclink (*)    |
| - Concox (*)      |
+---------|---------+
          |
+---------v---------+
|  Data Processor   |
+---------|---------+
          |
+---------v---------+
| Supabase Cliente  |
+-------------------+
```

(*) Implementação futura

## Protocolos Suportados

Atualmente, o Tracker Server suporta os seguintes protocolos:

| Protocolo | Status | Observações |
|-----------|--------|-------------|
| Teltonika Codec8 | Implementado | Suporte completo para dados de posição e I/O |
| Queclink | Planejado | Em desenvolvimento |
| Concox | Planejado | Em desenvolvimento |

## Configuração e Execução

### Requisitos

- Node.js 18.x ou superior
- Conta no Supabase com chave de serviço (service role)
- Portas TCP/UDP acessíveis (padrão: 5027 e 5028)

### Variáveis de Ambiente

O servidor utiliza as seguintes variáveis de ambiente:

```
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Configuração dos servidores
TRACKER_TCP_PORT=5027
TRACKER_UDP_PORT=5028

# Logs
LOG_LEVEL=info  # debug, info, warn, error
```

### Inicialização

Para iniciar o servidor:

```bash
cd tracker-server
npm install
node server.js
```

Para executar como um serviço em produção, recomenda-se o uso de PM2 ou similar:

```bash
npm install -g pm2
pm2 start server.js --name tracker-server
```

## Processamento de Alertas

O Tracker Server inclui lógica para detectar e gerar diversos tipos de alertas:

1. **Alertas de Velocidade**: Quando um veículo excede o limite de velocidade configurado
2. **Alertas de Geocerca**: Quando um veículo entra ou sai de uma área geográfica predefinida
3. **Alertas de Ignição**: Detecção de ligação/desligamento do veículo
4. **Alertas de Bateria**: Monitoramento do nível de bateria do dispositivo/veículo
5. **Alertas de Parada Prolongada**: Detecção de veículos parados por tempo excessivo

Os alertas são armazenados na tabela `alerts` do Supabase e podem ser visualizados pela interface web.

## Extensibilidade

O servidor foi projetado para ser facilmente extensível:

- Adicionar suporte a novos protocolos criando decodificadores específicos
- Implementar novos tipos de alertas e regras de detecção
- Integrar com serviços de notificação adicionais (e-mail, SMS, webhooks)

## Logs e Depuração

O servidor utiliza Winston para registrar logs em diferentes níveis. Por padrão, os logs são enviados para o console e para um arquivo `tracker-server.log`.

Para habilitar logs mais detalhados:

```
LOG_LEVEL=debug
```

## Monitoramento

Recomenda-se monitorar o servidor em produção usando ferramentas como:

- PM2 para monitoramento básico de processos
- Grafana + Prometheus para métricas avançadas
- Sentry ou similar para rastreamento de erros

## Próximos Passos de Desenvolvimento

- Implementar suporte para protocolos adicionais (Queclink, Concox)
- Adicionar servidor UDP para dispositivos que usam esse protocolo
- Implementar cache local para reduzir consultas ao banco de dados
- Adicionar suporte a WebSockets para comunicação em tempo real com a aplicação web
- Implementar balanceamento de carga para suportar milhares de dispositivos 