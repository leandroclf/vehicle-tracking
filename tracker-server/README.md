# Servidor de Rastreamento Yukz

Este servidor é responsável pela comunicação com dispositivos de rastreamento GPS e armazenamento dos dados no PostgreSQL.

## Recursos

- Suporte a conexões TCP e UDP
- Compatível com o protocolo Teltonika Codec8/Codec8 Extended
- Processamento de alertas de velocidade, geocercas e parada
- Reconexão automática ao banco de dados em caso de falhas
- Logging avançado com Winston

## Requisitos

- Node.js v14+
- Banco de dados PostgreSQL configurado

## Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env` na raiz do projeto:

```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/vehicle_tracking
TRACKER_TCP_PORT=5027
TRACKER_UDP_PORT=5028
LOG_LEVEL=info
```

## Instalação

```bash
cd tracker-server
npm install
```

## Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run start:prod
```

## Configuração para Produção

Para executar o servidor em produção, recomenda-se usar um gerenciador de processos como PM2:

```bash
npm install -g pm2
pm2 start server.js --name "yukz-tracker"
```

## Protocolos Suportados

Atualmente, o servidor suporta:

- Teltonika Codec8 e Codec8 Extended (TCP/UDP)

Planejamos adicionar suporte para outros protocolos como Concox, Coban, etc.

## Logs

Os logs são armazenados em:
- Console (para desenvolvimento)
- Arquivo `tracker-server.log` (para produção)

Você pode ajustar o nível de log usando a variável de ambiente `LOG_LEVEL` (valores: error, warn, info, debug).