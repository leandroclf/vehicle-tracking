# 🚗 Yukz - Sistema de Rastreamento Veicular

## 📋 Status do Projeto

**Versão:** 2.0  
**Status:** MVP 85% Implementado  
**Última Atualização:** Janeiro 2025

### 🎯 Situação Real do Desenvolvimento

- ✅ **Infraestrutura Base** (100%) - Next.js 14, Supabase, TypeScript
- ✅ **API Health Check** (100%) - Endpoint de saúde implementado
- ✅ **Dashboard Analytics** (90%) - Componentes completos, métricas, filtros, exportação
- ✅ **Autenticação** (85%) - Login, registro, autenticação social, middleware
- ✅ **Sistema de Rastreamento** (80%) - Mapas tempo real, GPS, geocercas, eventos
- 🔄 **Clean Architecture** (40%) - Estrutura modular implementada

## 📚 Documentação

- [Estrutura do Projeto](./docs/ESTRUTURA_PROJETO.md) - Arquitetura e organização
- [Roadmap Realista](./docs/ROADMAP_REALISTA.md) - Plano de execução
- [Checklist de Deploy](./docs/CHECKLIST_DEPLOY_PRODUCAO.md) - Deploy em produção
- [Guia de Configuração Docker](./docs/DOCKER_SETUP_GUIDE.md) - Setup local

## ✅ Funcionalidades Implementadas

### 🔐 **Sistema de Autenticação Completo**
- **Login/Registro**: Interface moderna com validação
- **Autenticação Social**: Google, Facebook, Apple integrados
- **Middleware de Proteção**: Rotas protegidas e verificação de sessão
- **Recuperação de Senha**: Fluxo completo implementado

### 📊 **Dashboard Analytics Avançado**
- **Métricas da Frota**: Veículos ativos, utilização, performance
- **Gráficos Interativos**: Charts de uso, tendências, comparativos
- **Métricas de Segurança**: Score de risco, violações, alertas
- **Sistema de Filtros**: Filtros avançados por período, veículo, região
- **Exportação de Dados**: PDF, Excel, CSV, JSON

### 📍 **Sistema de Rastreamento em Tempo Real**
- **Mapas Interativos**: Google Maps com marcadores dinâmicos
- **Rastreamento GPS**: Posições em tempo real com histórico
- **Geocercas**: Criação e monitoramento de áreas
- **Eventos e Alertas**: Detecção automática de violações
- **Dashboard de Controle**: Interface completa de monitoramento

### 🏗️ **Infraestrutura Robusta**
- **Next.js 14**: App Router, Server Components, TypeScript
- **Supabase**: Banco de dados, autenticação, real-time
- **Componentes UI**: Sistema de design consistente
- **API Health Check**: Monitoramento de saúde do sistema

## 🏗️ Arquitetura Atual

Consulte os diretórios `src/app`, `src/lib`, `src/components`, `drizzle`, `migrations`, `tracker-server` e `docker-compose*.yml` para a arquitetura executável atual.

## Operação e prontidão de produção

### Classificação atual

O projeto está **parcialmente funcional e não pronto para produção** até que as validações críticas abaixo sejam aprovadas sem o uso de `ignoreBuildErrors`/`ignoreDuringBuilds` no `next.config.js`.

Evidências da revisão atual:

- O build de Next.js pode gerar artefatos porque a configuração atual ignora erros de TypeScript e ESLint durante o build.
- A verificação de tipos (`pnpm run typecheck`) ainda encontra inconsistências de contratos entre componentes, providers, rotas e testes.
- A suíte Jest (`pnpm run test`) ainda possui falhas por mocks/arquivos ausentes e expectativas desalinhadas no serviço de veículos.
- A aplicação depende de PostgreSQL, Redis, WebSocket tracker e Google Maps para validação funcional completa.

### Variáveis obrigatórias

Configure as variáveis abaixo fora do repositório, por arquivo `.env` local não versionado, secrets do orquestrador ou `wrangler secret put` no Cloudflare:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Conexão PostgreSQL usada pela aplicação e migrações. |
| `JWT_SECRET` | Sim em produção | Segredo JWT com pelo menos 32 caracteres. Valores de demonstração são bloqueados em produção. |
| `JWT_EXPIRES_IN` | Não | Expiração de JWT; padrão `7d`. |
| `REDIS_URL` | Sim para realtime/cache | Redis usado por health checks, cache e pub/sub. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Sim para mapas | Chave pública do Google Maps. |
| `NEXT_PUBLIC_WS_URL` | Sim para realtime web | URL WebSocket exposta ao cliente. |
| `NEXT_PUBLIC_APP_URL` | Recomendado | URL pública da aplicação. |

Para Cloudflare Workers, não salve segredos em `wrangler.toml`; use:

```bash
wrangler secret put JWT_SECRET --env production
```

### Comandos de validação

```bash
pnpm install
pnpm run test
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run migrate
pnpm run start
```

### Instalação congelada e regeneração do lockfile

Use o pnpm fixado em `packageManager` (atualmente `pnpm@10.0.0-rc.2`).

```bash
# Instalação normal e reprodutível
pnpm install --frozen-lockfile

# Regeneração deliberada do lockfile (somente ao alterar dependências)
pnpm install --lockfile-only --ignore-scripts
git diff pnpm-lock.yaml   # revise o diff antes de commitar
pnpm install --frozen-lockfile
```

Se a instalação congelada falhar, diagnostique a mensagem de erro: ela pode indicar lockfile divergente do `package.json`, mas também rede, integridade de pacote ou permissões. Não contorne a falha removendo `--frozen-lockfile`.

### Deploy e rollback

1. Gere e aplique migrações em ambiente de homologação antes da produção.
2. Execute `pnpm run test`, `pnpm run typecheck`, `pnpm run lint` e `pnpm run build`.
3. Publique a imagem/container ou worker somente após validações verdes.
4. Para rollback, reverta para a última imagem/tag aprovada e reaplique somente migrações reversíveis previamente testadas. Migrações destrutivas exigem plano manual de restauração de backup.

### Bloqueios conhecidos

- Contratos de UI e providers divergem dos tipos atuais em várias páginas do dashboard.
- Alguns testes referenciam módulos inexistentes (`sms-service`, `types/mfa`) ou mocks incompatíveis com a implementação atual.
- A validação funcional completa requer PostgreSQL/Redis e dados de teste compatíveis com as migrações.
