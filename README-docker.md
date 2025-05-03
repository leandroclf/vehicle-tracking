# Instruções para Implantação com Docker

## Visão Geral

Este documento fornece instruções para implantar o sistema de rastreamento veicular Yukz usando Docker. O sistema é composto por dois serviços principais:

1. **Aplicação Web (Next.js)** - Interface do usuário e API backend
2. **Servidor de Rastreamento** - Serviço que recebe e processa dados dos dispositivos GPS

## Pré-requisitos

- Docker e Docker Compose instalados no servidor de implantação
- Credenciais do Supabase configuradas
- Chave de API do Google Maps (para funcionalidades de mapa)

## Arquivos de Configuração Docker

### Dockerfile (Aplicação Principal)
O Dockerfile principal foi configurado para construir a aplicação Next.js em dois estágios:
1. **Estágio de Build**: Compila a aplicação Next.js
2. **Estágio de Runtime**: Executa a aplicação compilada com permissões de usuário não-root

### tracker-server/Dockerfile
O Dockerfile do servidor de rastreamento também utiliza multi-stage build:
1. **Estágio de Build**: Instala as dependências necessárias
2. **Estágio de Runtime**: Executa o servidor com configurações de segurança

### docker-compose.yml
Este arquivo orquestra a execução dos dois serviços em conjunto, configurando redes, variáveis de ambiente e healthchecks.

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Variáveis públicas (acessíveis no frontend)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_api_google_maps

# Variáveis privadas (somente para uso no backend)
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase
JWT_SECRET=sua_chave_secreta_jwt
GOOGLE_MAPS_API_KEY=sua_chave_api_google_maps
```

## Instruções de Implantação

### Opção 1: Usando Docker Compose (Recomendado)

1. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais
   ```

2. **Construir e iniciar os serviços**:
   ```bash
   docker-compose up -d
   ```

3. **Verificar logs dos serviços**:
   ```bash
   docker-compose logs -f
   ```

### Opção 2: Usando Docker diretamente

#### Para a aplicação principal:

1. **Construir a imagem**:
   ```bash
   docker build -t yukz-app \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase \
     --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_api_google_maps \
     .
   ```

2. **Executar o contêiner**:
   ```bash
   docker run -d -p 3000:3000 \
     -e SUPABASE_URL=sua_url_supabase \
     -e SUPABASE_ANON_KEY=sua_chave_anon_supabase \
     -e SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase \
     -e JWT_SECRET=sua_chave_secreta_jwt \
     -e GOOGLE_MAPS_API_KEY=sua_chave_api_google_maps \
     --name yukz-app \
     yukz-app
   ```

#### Para o servidor de rastreamento:

1. **Construir a imagem**:
   ```bash
   cd tracker-server
   docker build -t yukz-tracker-server .
   ```

2. **Executar o contêiner**:
   ```bash
   docker run -d -p 8090:8090 \
     -e SUPABASE_URL=sua_url_supabase \
     -e SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase \
     --name yukz-tracker-server \
     yukz-tracker-server
   ```

## Acessando a Aplicação

- Aplicação Web: `http://seu-servidor:3000`
- Servidor de Rastreamento: `tcp://seu-servidor:8090`

## Solução de Problemas

- **Erro de dependências**: Verifique os logs dos contêineres com `docker logs yukz-app` ou `docker logs yukz-tracker-server`
- **Erro de conexão com Supabase**: Confirme se as credenciais do Supabase estão configuradas corretamente
- **Erro no servidor de rastreamento**: Verifique os logs com `docker logs yukz-tracker-server`
- **Problemas de permissão**: As imagens estão configuradas para executar como usuários não-root; confirme que os caminhos de volume têm permissões adequadas