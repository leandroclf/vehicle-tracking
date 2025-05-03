# 4. Dependências e Configuração

## 4.1 Bibliotecas e Frameworks

O sistema Yukz utiliza diversas bibliotecas e frameworks para implementar suas funcionalidades. Abaixo estão as principais dependências organizadas por categoria.

### 4.1.1 Frontend

#### Core
- **Next.js**: `v15.1.4` - Framework React com renderização híbrida
- **React**: `v18.2.0` - Biblioteca para construção de interfaces
- **React DOM**: `v18.2.0` - Renderização de componentes React no navegador
- **TypeScript**: `v5.x` - Superset tipado de JavaScript

#### UI e Componentes
- **Radix UI**: Biblioteca de componentes acessíveis e sem estilo
  - `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, e outros componentes
- **Tailwind CSS**: `v3.4.1` - Framework CSS utilitário
- **class-variance-authority**: `v0.7.1` - Gerenciamento de variantes de componentes
- **clsx**: `v2.1.1` - Utilitário para composição condicional de classes CSS
- **tailwind-merge**: `v2.6.0` - Mesclagem inteligente de classes Tailwind
- **tailwindcss-animate**: `v1.0.7` - Animações para Tailwind

#### Mapas e Visualização
- **@react-google-maps/api**: `v2.19.3` - Wrapper React para Google Maps API
- **recharts**: `v2.12.4` - Biblioteca de gráficos baseada em React e D3

#### Formulários e Validação
- **react-hook-form**: `v7.54.2` - Gerenciamento de formulários
- **@hookform/resolvers**: `v3.10.0` - Integrações para validação de formulários
- **zod**: `v3.24.3` - Biblioteca de validação de esquemas

#### Data e Utilitários
- **date-fns**: `v3.6.0` - Manipulação de datas
- **uuid**: `v11.1.0` - Geração de identificadores únicos

#### Estado e Feedback
- **Sonner**: `v1.7.2` - Sistema de toast notifications
- **next-themes**: `v0.4.4` - Suporte a temas para Next.js

### 4.1.2 Backend

#### Autenticação e Segurança
- **jsonwebtoken**: `v9.0.2` - Implementação de JSON Web Tokens
- **bcryptjs**: `v3.0.2` - Hashing de senhas

#### Banco de Dados
- **@supabase/supabase-js**: `v2.49.4` - Cliente JavaScript para Supabase

### 4.1.3 DevOps e Ferramentas

#### Testes
- **Jest**: `v29.7.0` - Framework de testes
- **@testing-library/react**: `v16.3.0` - Utilitários para testar componentes React
- **@testing-library/jest-dom**: `v6.6.3` - Custom matchers para Jest

#### Deploy
- **wrangler**: `v3.102.0` - CLI para Cloudflare Workers
- **@opennextjs/cloudflare**: `v0.3.8` - Adaptador para deploy no Cloudflare

## 4.2 Variáveis de Ambiente

O sistema requer a configuração das seguintes variáveis de ambiente para funcionar corretamente:

### 4.2.1 Aplicação Principal (yukz-app)

```env
# Conexão com Supabase
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1... # Apenas para operações privilegiadas no backend

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyB...

# JWT (para autenticação personalizada)
JWT_SECRET=sua_chave_secreta_super_segura

# Configurações da Aplicação
APP_NAME=Yukz Vehicle Tracking
APP_URL=https://yukz.example.com
NODE_ENV=production
```

### 4.2.2 Servidor de Rastreamento (tracker-server)

```env
# Conexão com Supabase (pode ser o mesmo do frontend)
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1... # Essencial para operações no banco

# Configuração do Servidor
TRACKER_TCP_PORT=5027  # Porta para dispositivos Teltonika
TRACKER_UDP_PORT=5028  # Porta para protocolos UDP (opcional)

# Configurações de Log
LOG_LEVEL=info # Níveis: debug, info, warn, error
```

## 4.3 Passos de Instalação

### 4.3.1 Pré-requisitos

- Node.js (v18.0.0 ou superior)
- npm, yarn ou pnpm (gerenciador de pacotes)
- Conta no Supabase (com banco de dados PostgreSQL)
- Chave de API do Google Maps

### 4.3.2 Instalação da Aplicação Principal

1. **Clone o repositório**:
   ```bash
   git clone <url-do-repositorio>
   cd yukz/vehicle-tracking
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configure as variáveis de ambiente**:
   - Crie um arquivo `.env.local` na raiz do projeto
   - Preencha com as variáveis necessárias (veja seção 4.2.1)

4. **Execute em modo de desenvolvimento**:
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

### 4.3.3 Instalação do Servidor de Rastreamento

1. **Navegue até o diretório do servidor**:
   ```bash
   cd tracker-server
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   - Crie um arquivo `.env` na raiz do diretório `tracker-server`
   - Preencha com as variáveis necessárias (veja seção 4.2.2)

4. **Execute o servidor**:
   ```bash
   node server.js
   # ou
   npm start
   ```

### 4.3.4 Deploy com Docker

Para implantar o sistema usando containers Docker:

1. **Construa a imagem Docker**:
   ```bash
   docker build -t yukz-vehicle-tracking .
   ```

2. **Execute o container**:
   ```bash
   docker run -p 3000:3000 \
     -e SUPABASE_URL=<sua-url> \
     -e SUPABASE_ANON_KEY=<sua-chave> \
     -e GOOGLE_MAPS_API_KEY=<sua-chave> \
     -e JWT_SECRET=<sua-chave-secreta> \
     yukz-vehicle-tracking
   ```

Para uma implantação mais completa, utilize os scripts fornecidos:
- Windows: `deploy-docker.ps1`
- Linux/Mac: `deploy-docker.sh`

## 4.4 Banco de Dados

O sistema utiliza Supabase como plataforma de backend, que é baseada em PostgreSQL. A estrutura do banco de dados inclui as seguintes tabelas principais:

- **users**: Usuários do sistema
- **vehicles**: Veículos cadastrados
- **tracker_devices**: Dispositivos rastreadores físicos
- **vehicle_positions**: Histórico de posições dos veículos
- **geofences**: Áreas de monitoramento (geocercas)
- **alerts**: Alertas gerados pelo sistema
- **settings**: Configurações de usuários

O esquema completo do banco de dados está disponível no arquivo de migração em `migrations/0001_initial_schema.sql`. 