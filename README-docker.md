# Instruções para Implantação com Docker

## Visão Geral

Este documento fornece instruções para implantar o sistema de rastreamento veicular Yukz usando Docker. O sistema é composto por dois serviços principais:

1. **Aplicação Web (Next.js)** - Interface do usuário e API backend
2. **Servidor de Rastreamento** - Serviço que recebe e processa dados dos dispositivos GPS

## Pré-requisitos

- Docker Engine 20.10+ e Docker Compose 2.0+
- Credenciais do Supabase configuradas
- Chave de API do Google Maps (para funcionalidades de mapa)
- Portas 3000 e 8090 disponíveis no servidor

## Implantação Rápida

Para uma implantação rápida do sistema, siga estes passos:

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/yukz/vehicle-tracking.git
   cd vehicle-tracking
   ```

2. **Crie um arquivo .env com as variáveis necessárias**:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais
   ```

3. **Inicie os serviços com Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Verifique o status dos serviços**:
   ```bash
   docker-compose ps
   ```

5. **Acesse a aplicação em**:
   - Aplicação Web: `http://localhost:3000`
   - Servidor de Rastreamento: `tcp://localhost:8090`

## Características da Solução Docker

- **Multi-stage builds** para redução do tamanho das imagens
- **Usuários não-root** para maior segurança
- **Healthchecks** para monitoramento de disponibilidade
- **Rede isolada** para comunicação segura entre serviços
- **Configuração simplificada** via variáveis de ambiente
- **Containers autossuficientes** sem necessidade de volumes persistentes

## Comandos Úteis para Gerenciamento

### Visualização de Logs
```bash
# Todos os serviços
docker-compose logs -f

# Aplicação web
docker-compose logs -f app

# Servidor de rastreamento
docker-compose logs -f tracker-server
```

### Reiniciar Serviços
```bash
# Reiniciar todos os serviços
docker-compose restart

# Reiniciar apenas a aplicação web
docker-compose restart app

# Reiniciar apenas o servidor de rastreamento
docker-compose restart tracker-server
```

### Atualizar após Alterações
```bash
# Reconstruir imagens e reiniciar serviços
docker-compose up -d --build
```

### Parar Serviços
```bash
# Parar todos os serviços
docker-compose down
```

## Variáveis de Ambiente

O sistema requer as seguintes variáveis de ambiente:

| Variável | Descrição | Serviço |
|----------|-----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | URL do projeto Supabase | App |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Chave anônima do Supabase | App |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Chave da API Google Maps | App |
| SUPABASE_URL | URL do projeto Supabase | App + Tracker |
| SUPABASE_ANON_KEY | Chave anônima do Supabase | App |
| SUPABASE_SERVICE_ROLE_KEY | Chave de serviço do Supabase | App + Tracker |
| JWT_SECRET | Segredo para assinatura de tokens JWT | App |
| GOOGLE_MAPS_API_KEY | Chave da API Google Maps | App |

## Documentação Detalhada

Para informações mais detalhadas sobre a implementação Docker, consulte o documento completo em:

- [docs/docker-deployment.md](docs/docker-deployment.md)
- [docs/6-instalacao.md](docs/6-instalacao.md) (Seção 6.5)