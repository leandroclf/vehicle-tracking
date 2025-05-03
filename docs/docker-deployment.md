# Deploy com Docker - Sistema Yukz

## Visão Geral

Este documento detalha o processo de implantação do sistema Yukz de rastreamento veicular utilizando Docker. O sistema foi estruturado para ser implantado de forma modular e segura, utilizando práticas recomendadas de containerização.

## Arquitetura de Containerização

A implantação do sistema Yukz é dividida em dois contêineres principais:

1. **Aplicação Web (Next.js)** - Contém a interface do usuário e a API backend
2. **Servidor de Rastreamento** - Processa dados brutos dos dispositivos GPS

### Características Principais

- **Multi-stage builds** para redução do tamanho das imagens
- **Usuários não-root** para maior segurança
- **Healthchecks** para monitoramento de disponibilidade
- **Configuração via variáveis de ambiente** para flexibilidade

## Estrutura dos Arquivos Docker

### Dockerfile Principal (Aplicação Web)

O Dockerfile da aplicação principal implementa:

- **Estágio de Build**: Compila a aplicação Next.js
- **Estágio de Runtime**: Contêiner otimizado apenas com os arquivos necessários
- **Configuração de Usuário**: Execução como usuário `nextjs` não-root
- **Gestão de Variáveis**: Processamento de variáveis públicas e privadas

```dockerfile
# Estágio de build
FROM node:18-alpine AS builder

# Definir variáveis de ambiente para build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Definir variáveis de ambiente públicas
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

# [...]

# Estágio de execução
FROM node:18-alpine AS runner

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# [...]

# Mudar para usuário não-root
USER nextjs
```

### Dockerfile do Servidor de Rastreamento

O Dockerfile do servidor de rastreamento implementa:

- **Estágio de Build**: Instala dependências e prepara o código
- **Estágio de Runtime**: Contêiner mínimo com apenas o necessário
- **Configuração de Usuário**: Execução como usuário `nodeapp` não-root
- **Estratégias de Segurança**: Permissões de diretório restritas

```dockerfile
# Estágio de build
FROM node:18-alpine AS builder

# [...]

# Estágio de execução
FROM node:18-alpine AS runner

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp && \
    chown -R nodeapp:nodejs /app

# [...]

# Mudar para usuário não-root
USER nodeapp
```

### Docker Compose

O arquivo `docker-compose.yml` orquestra os serviços:

- **Definição de Rede**: Cria uma rede isolada `yukz-network`
- **Configuração de Dependências**: Define ordem de inicialização
- **Healthchecks**: Monitora a disponibilidade dos serviços
- **Gestão de Variáveis**: Injeta variáveis de ambiente do arquivo `.env`

## Processo de Implantação

### Pré-requisitos

- Docker Engine 20.10+ e Docker Compose 2.0+
- Arquivo `.env` configurado com todas as variáveis necessárias
- Portas 3000 (aplicação web) e 8090 (servidor de rastreamento) disponíveis

### Passos para Implantação

1. **Preparar arquivo `.env`**:
   ```bash
   cp .env.example .env
   # Editar .env com as credenciais e configurações adequadas
   ```

2. **Construir e iniciar os serviços com Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Verificar o status dos contêineres**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Variáveis de Ambiente Obrigatórias

| Variável | Descrição | Escopo |
|----------|-----------|--------|
| NEXT_PUBLIC_SUPABASE_URL | URL do projeto Supabase | Frontend/Backend |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Chave anônima do Supabase | Frontend/Backend |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Chave da API Google Maps | Frontend |
| SUPABASE_SERVICE_ROLE_KEY | Chave de serviço do Supabase | Backend |
| JWT_SECRET | Segredo para assinatura de tokens JWT | Backend |

## Manutenção e Operação

### Atualização da Aplicação

Para atualizar a aplicação após alterações no código:

```bash
# Reconstruir as imagens
docker-compose build

# Reiniciar os serviços
docker-compose up -d
```

### Backup dos Dados

O sistema Yukz não armazena dados nos contêineres. Todos os dados são persistidos no Supabase, que deve ter sua própria estratégia de backup configurada.

### Monitoramento

Os healthchecks configurados podem ser integrados com sistemas de monitoramento como Prometheus ou Grafana para acompanhamento contínuo da saúde dos serviços.

## Considerações de Segurança

- **Contêineres não-root**: Reduz o risco de escalação de privilégios
- **Multi-stage builds**: Minimiza a superfície de ataque
- **Variáveis de ambiente**: Separa configurações de código
- **Rede isolada**: Limita a exposição dos serviços

## Solução de Problemas

### Problemas Comuns

1. **Falha no healthcheck da aplicação**:
   - Verifique se as variáveis de ambiente estão configuradas corretamente
   - Consulte os logs da aplicação: `docker-compose logs app`

2. **Servidor de rastreamento não responde**:
   - Verifique a conectividade com o Supabase
   - Consulte os logs do servidor: `docker-compose logs tracker-server`

3. **Erro de permissão em volumes**:
   - Ajuste as permissões dos diretórios mapeados: `chmod -R 755 ./volume-dir`

## Otimização de Recursos

- As imagens utilizam Alpine Linux para minimizar o tamanho
- Multi-stage builds reduzem substancialmente o tamanho final das imagens
- Configuração de reinicialização automática (`restart: unless-stopped`) garante alta disponibilidade 