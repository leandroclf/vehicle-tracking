# 🤖 Prompt para Implementação Guiada: Sistema de Rastreamento de Veículos

> **Destinado a**: Gemini, ChatGPT, Claude ou qualquer assistente de IA capaz de programação  
> **Objetivo**: Implementar sistema completo do zero, fase por fase

---

## 📋 CONTEXTO DO PROJETO

Você é um desenvolvedor Full-Stack sênior especializado em Next.js e PostgreSQL. Sua missão é implementar um **Sistema de Rastreamento de Veículos em Tempo Real** do zero, seguindo as melhores práticas e arquitetura moderna.

### Stack Tecnológica Obrigatória:
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Node.js
- **Banco de Dados**: PostgreSQL 15+ (SEM Supabase)
- **ORM**: Drizzle ORM
- **Cache/Pub-Sub**: Redis 7+
- **Real-time**: WebSocket (`ws` library)
- **Auth**: JWT + bcrypt + OAuth (Google)
- **Maps**: Google Maps API

### Características do Sistema:
1. Autenticação robusta (email/senha + OAuth)
2. Rastreamento de veículos em tempo real
3. Dashboard com visualização de mapa
4. Sistema de alertas e notificações
5. Geocercas (geofences)
6. Histórico de trajetos
7. WebSocket para atualizações instantâneas

---

## 🎯 OBJETIVO DA NOSSA CONVERSA

Vamos implementar este projeto **juntos**, fase por fase. Você deve:

1. **Criar TODOS os arquivos necessários** (código completo, não snippets)
2. **Explicar cada decisão técnica** importante
3. **Seguir a estrutura definida** no guia base
4. **Implementar testes** quando aplicável
5. **Validar cada fase** antes de prosseguir

### Regras de Implementação:

✅ **SEMPRE**:
- Código TypeScript estritamente tipado
- Comentários em português para lógica complexa
- Tratamento de erros adequado
- Validação de dados (Zod)
- Segurança (SQL injection, XSS, CSRF)
- Seguir convenções Next.js 14

❌ **NUNCA**:
- Usar Supabase SDK
- Código sem tipagem
- Placeholders ou TODOs sem implementação
- Ignorar segurança
- Misturar português/inglês em código

---

## 📁 ESTRUTURA DO PROJETO

Antes de começar, confirme que vamos seguir esta estrutura:

```
vehicle-tracking-system/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   └── page.tsx                 # Landing page
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── map/page.tsx
│   │   │   │   ├── vehicles/page.tsx
│   │   │   │   ├── alerts/page.tsx
│   │   │   │   └── geofences/page.tsx
│   │   │   ├── tracking/page.tsx
│   │   │   └── layout.tsx               # Layout autenticado
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   └── oauth/
│   │   │   │       └── google/route.ts
│   │   │   ├── vehicles/
│   │   │   │   ├── route.ts             # GET, POST
│   │   │   │   └── [id]/route.ts        # GET, PUT, DELETE
│   │   │   ├── tracking/
│   │   │   │   ├── events/route.ts
│   │   │   │   └── history/route.ts
│   │   │   ├── geofences/route.ts
│   │   │   ├── alerts/route.ts
│   │   │   └── health/route.ts
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx                   # Root layout
│   ├── components/
│   │   ├── ui/                          # Componentes base
│   │   ├── dashboard/
│   │   ├── map/
│   │   ├── auth/
│   │   └── landing/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth-service.ts          # Lógica de autenticação
│   │   │   ├── auth-middleware.ts       # Middleware para APIs
│   │   │   └── oauth-providers.ts       # Google, Facebook, Apple
│   │   ├── realtime/
│   │   │   ├── websocket-server.ts      # Servidor WebSocket
│   │   │   └── websocket-client.tsx     # Cliente React
│   │   ├── database.ts                  # Conexão PostgreSQL + Drizzle
│   │   ├── schema.ts                    # Schema completo Drizzle
│   │   ├── redis.ts                     # Cliente Redis
│   │   ├── validators.ts                # Schemas Zod
│   │   └── utils.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   └── api.ts
│   └── styles/
│       └── globals.css
├── drizzle/
│   ├── migrations/
│   └── seed.ts                          # Dados iniciais
├── server/
│   └── websocket.ts                     # Servidor WebSocket standalone
├── .env.local
├── .env.example
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🚀 FASE 1: SETUP INICIAL E CONFIGURAÇÃO

### O que você deve fazer:

1. **Criar `package.json`** com todas as dependências:
```json
{
  "name": "vehicle-tracking-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "ws:dev": "tsx watch server/websocket.ts"
  },
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    
    "drizzle-orm": "^0.29.0",
    "pg": "^8.11.0",
    
    "ioredis": "^5.3.2",
    "ws": "^8.16.0",
    
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.10.0",
    "react-hook-form": "^7.49.0",
    
    "@react-google-maps/api": "^2.19.3",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.344.0",
    
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/pg": "^8.10.0",
    "@types/ws": "^8.5.10",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "drizzle-kit": "^0.24.0",
    "tsx": "^4.7.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

2. **Criar `.env.example`** com todas as variáveis:
```bash
# DATABASE
DATABASE_URL="postgresql://usuario:senha@localhost:5432/vehicle_tracking"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="vehicle_tracking"
DB_USER="seu_usuario"
DB_PASSWORD="sua_senha"

# REDIS
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# JWT
JWT_SECRET="gere-um-secret-aleatorio-de-32-caracteres-aqui"
JWT_EXPIRES_IN="7d"

# WEBSOCKET
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
WS_PORT="3001"

# GOOGLE OAUTH
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/oauth/google/callback"

# GOOGLE MAPS
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="sua-google-maps-api-key"

# APP
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

3. **Criar `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

4. **Criar `drizzle.config.ts`**:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

5. **Criar `tailwind.config.ts`** (completo com tema dark)

6. **Criar `next.config.js`** (com configurações de imagem, etc)

### Perguntas para você responder antes de prosseguir:

1. ✅ Todos os arquivos de configuração estão criados?
2. ✅ Você explicou cada dependência importante?
3. ✅ `.env.example` está completo?

Aguardo confirmação para passar para **FASE 2: BANCO DE DADOS**.

---

## 🗄️ FASE 2: BANCO DE DADOS POSTGRESQL

### O que você deve fazer:

1. **Criar `src/lib/schema.ts`** com o schema COMPLETO:

Implementar as seguintes tabelas com Drizzle ORM:

- **users** - Usuários do sistema
  - id (uuid, PK)
  - email (varchar, unique)
  - password (varchar, nullable para OAuth)
  - name (varchar)
  - role (varchar: 'Admin', 'Usuário')
  - phone (varchar, nullable)
  - avatar (text, nullable)
  - emailVerified (boolean)
  - createdAt, updatedAt (timestamp)

- **oauth_accounts** - Contas OAuth vinculadas
  - id (uuid, PK)
  - userId (uuid, FK → users.id)
  - provider (varchar: 'google', 'facebook', 'apple')
  - providerAccountId (varchar)
  - accessToken, refreshToken (text)
  - expiresAt (timestamp)

- **vehicles** - Veículos cadastrados
  - id (uuid, PK)
  - userId (uuid, FK → users.id)
  - name, plate, model, color (varchar)
  - year (integer)
  - deviceId (varchar, unique)
  - status (varchar: 'online', 'offline', 'moving')
  - lastLocation (jsonb: {lat, lng, speed, heading, timestamp})
  - createdAt, updatedAt

- **tracking_events** - Eventos de rastreamento
  - id (uuid, PK)
  - vehicleId (uuid, FK → vehicles.id)
  - lat, lng (decimal)
  - speed, heading (decimal/integer)
  - eventType (varchar: 'position', 'ignition_on', 'sos')
  - metadata (jsonb)
  - timestamp (timestamp)

- **geofences** - Geocercas
  - id (uuid, PK)
  - userId (uuid, FK)
  - name, description, type ('circle' ou 'polygon')
  - center (jsonb: {lat, lng})
  - radius (decimal)
  - polygon (jsonb: array de {lat, lng})
  - active (boolean)

- **alerts** - Alertas do sistema
  - id (uuid, PK)
  - userId, vehicleId (uuid, FK)
  - type, severity, title, message
  - read (boolean)
  - metadata (jsonb)
  - createdAt

- **sessions** - Sessões de autenticação
  - id (uuid, PK)
  - userId (uuid, FK)
  - token (text, unique)
  - expiresAt (timestamp)
  - userAgent, ipAddress

**IMPORTANTE**:
- Adicionar **índices** em todas as FKs
- Adicionar **relações** do Drizzle para todas as tabelas
- Exportar **tipos TypeScript** inferidos

2. **Criar `src/lib/database.ts`**:
```typescript
// Pool PostgreSQL + Cliente Drizzle + funções helpers
```

3. **Gerar migrations**:
```bash
npm run db:generate
npm run db:push
```

4. **Criar `drizzle/seed.ts`** - Script para dados iniciais:
- Usuário admin padrão
- 3-5 veículos de exemplo
- Algumas geocercas

### Critérios de Validação:

- [ ] Schema tem TODAS as tabelas mencionadas
- [ ] Todos os campos estão corretos (nome, tipo, constraints)
- [ ] Índices criados para performance
- [ ] Relações Drizzle configuradas
- [ ] Tipos TypeScript exportados
- [ ] Migration gerada com sucesso

Aguardo confirmação para **FASE 3: AUTENTICAÇÃO**.

---

## 🔐 FASE 3: AUTENTICAÇÃO E AUTORIZAÇÃO

### O que você deve fazer:

1. **Criar `src/lib/auth/auth-service.ts`**

Implementar classe `AuthService` com métodos:

```typescript
class AuthService {
  // Registro com email/senha
  static async register(email: string, password: string, name: string)
  
  // Login com email/senha
  static async login(email: string, password: string)
  
  // OAuth (Google)
  static async handleOAuthLogin(provider: string, profile, tokens)
  
  // Verificar token JWT
  static async verifyToken(token: string)
  
  // Gerar token JWT
  static generateToken(payload: {userId, email})
  
  // Criar sessão
  static async createSession(userId: string, token: string)
  
  // Logout
  static async logout(token: string)
  
  // Helpers
  static sanitizeUser(user: any) // remove password
  static extractTokenFromHeader(authHeader: string)
}
```

**Requisitos**:
- Usar bcrypt para hash (salt rounds = 10)
- JWT secret do .env
- Validar com Zod
- Tratamento de erros detalhado

2. **Criar `src/lib/auth/auth-middleware.ts`**

```typescript
export async function requireAuth(req: NextRequest)
export function withAuth(handler: Function)
```

3. **Criar rotas de API**:

- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/oauth/google/route.ts` (GET - redirect, POST - callback)

4. **Criar `src/lib/auth/oauth-providers.ts`**:
```typescript
export class GoogleOAuthProvider {
  static getAuthUrl(): string
  static exchangeCodeForTokens(code: string)
  static getUserProfile(accessToken: string)
}
```

5. **Criar context/hook de autenticação**:

`src/lib/auth/auth-context.tsx`:
```typescript
export function AuthProvider({ children })
export function useAuth()
```

6. **Criar páginas**:
- `src/app/login/page.tsx` - Form de login
- `src/app/register/page.tsx` - Form de registro

### Critérios de Validação:

- [ ] AuthService completo e testável
- [ ] Todas as rotas de API funcionais
- [ ] OAuth Google funcionando
- [ ] Middleware protegendo rotas
- [ ] Context React disponível
- [ ] Páginas de UI criadas

Aguardo confirmação para **FASE 4: WEBSOCKET E TEMPO REAL**.

---

## ⚡ FASE 4: SISTEMA EM TEMPO REAL

### O que você deve fazer:

1. **Criar `src/lib/redis.ts`**:
```typescript
// Cliente Redis com Pub/Sub
export class RedisClient {
  static async publish(channel: string, message: any)
  static async subscribe(channels: string[], callback)
}
```

2. **Criar `server/websocket.ts`** - Servidor WebSocket standalone:

```typescript
export class RealtimeServer {
  private wss: WebSocketServer
  private redis: Redis
  private subscriber: Redis
  private clients: Map<string, Set<AuthenticatedWebSocket>>
  
  constructor(port: number)
  
  private setupWebSocketServer() // Autenticação via token
  private setupRedisSubscriptions() // Subscrever em db:*
  private setupHeartbeat() // Ping/pong a cada 30s
  
  private handleMessage(ws, data)
  private handleSubscribe(ws, table, filter)
  private handleUnsubscribe(ws, table)
  private handleDisconnect(ws)
  
  private broadcastToSubscribers(channel, data)
  
  async publishChange(table, type, record) // Chamado após DB changes
}
```

**Funcionalidades**:
- Autenticação via token na query string
- Heartbeat para detectar conexões mortas
- Subscribe/unsubscribe em tabelas específicas
- Broadcast via Redis Pub/Sub
- Gerenciamento de múltiplos clientes por usuário

3. **Criar `src/lib/realtime/websocket-client.tsx`**:

```typescript
export function RealtimeProvider({ children })

export function useRealtime() {
  return {
    subscribe: (table, callback, filter?) => unsubscribe,
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
  }
}
```

4. **Criar helper para publicar mudanças**:

`src/lib/realtime/publish-db-change.ts`:
```typescript
export async function publishDbChange(
  table: string,
  type: 'INSERT' | 'UPDATE' | 'DELETE',
  record: any
)
```

5. **Integrar nas APIs**:

Exemplo em `src/app/api/vehicles/route.ts`:
```typescript
export const POST = withAuth(async (req, { user }) => {
  const [vehicle] = await db.insert(vehicles).values(...).returning()
  
  // Publicar mudança para WebSocket clients
  await publishDbChange('vehicles', 'INSERT', vehicle)
  
  return NextResponse.json({ vehicle })
})
```

### Critérios de Validação:

- [ ] Servidor WebSocket funcional
- [ ] Cliente React conectando
- [ ] Redis Pub/Sub funcionando
- [ ] Subscribe/unsubscribe funcional
- [ ] Heartbeat implementado
- [ ] Mudanças no DB notificando clientes em tempo real

Aguardo confirmação para **FASE 5: FEATURES CORE**.

---

## 🚗 FASE 5: FEATURES CORE DO SISTEMA

### O que você deve fazer:

Implementar APIs completas com validação e real-time:

### 5.1 Veículos

`src/app/api/vehicles/route.ts`:
```typescript
GET  - Listar veículos do usuário
POST - Criar novo veículo (+ publish WS)
```

`src/app/api/vehicles/[id]/route.ts`:
```typescript
GET    - Obter veículo específico
PUT    - Atualizar veículo (+ publish WS)
DELETE - Deletar veículo (+ publish WS)
```

`src/app/api/vehicles/[id]/location/route.ts`:
```typescript
GET - Localização atual
```

### 5.2 Rastreamento

`src/app/api/tracking/events/route.ts`:
```typescript
POST - Criar evento de rastreamento
       - Atualizar lastLocation do veículo
       - Publicar para WS
       - Verificar geocercas
       - Gerar alertas se necessário
```

`src/app/api/tracking/history/route.ts`:
```typescript
GET - Histórico de eventos
      - Filtros: vehicleId, startDate, endDate
      - Paginação
```

### 5.3 Geocercas

`src/app/api/geofences/route.ts`:
```typescript
GET  - Listar geocercas do usuário
POST - Criar geocerca (+ publish WS)
```

`src/app/api/geofences/[id]/route.ts`:
```typescript
PUT    - Atualizar (+ publish WS)
DELETE - Deletar (+ publish WS)
```

### 5.4 Alertas

`src/app/api/alerts/route.ts`:
```typescript
GET - Listar alertas do usuário
      - Filtros: read, vehicleId, type
      - Ordenação: mais recentes primeiro
```

`src/app/api/alerts/[id]/read/route.ts`:
```typescript
POST - Marcar como lido
```

### 5.5 Helpers e Validators

`src/lib/validators.ts`:
```typescript
export const vehicleSchema = z.object({...})
export const trackingEventSchema = z.object({...})
export const geofenceSchema = z.object({...})
```

`src/lib/geofence-checker.ts`:
```typescript
export function isPointInGeofence(
  point: {lat, lng},
  geofence: Geofence
): boolean
```

### Critérios de Validação:

- [ ] Todas as APIs implementadas
- [ ] Validação Zod em todas as rotas
- [ ] Real-time publicando mudanças
- [ ] Checagem de geocercas funcional
- [ ] Alertas sendo gerados automaticamente

Aguardo confirmação para **FASE 6: INTERFACE DO USUÁRIO**.

---

## 🎨 FASE 6: INTERFACE DO USUÁRIO

### O que você deve fazer:

### 6.1 Componentes Base

Criar componentes UI reutilizáveis em `src/components/ui/`:
- `Button.tsx`
- `Input.tsx`
- `Card.tsx`
- `Table.tsx`
- `Modal.tsx`
- `Dropdown.tsx`
- `Badge.tsx`
- `Alert.tsx`

### 6.2 Dashboard Principal

`src/app/(app)/dashboard/page.tsx`:
- Grid de cards com estatísticas
- Veículos online/offline/em movimento
- Alertas recentes (3-5)
- Mapa com todos os veículos
- Usar `useRealtime()` para atualizações

### 6.3 Mapa de Rastreamento

`src/app/(app)/dashboard/map/page.tsx`:
- Google Maps com todos os veículos
- Marcadores customizados (cor por status)
- InfoWindow com detalhes do veículo
- Geocercas desenhadas
- Controles de filtro
- Real-time: veículos se movem no mapa

`src/components/map/VehicleMap.tsx`:
- Componente reutilizável do mapa

### 6.4 Gerenciamento de Veículos

`src/app/(app)/dashboard/vehicles/page.tsx`:
- Tabela com todos os veículos
- Ações: Editar, Deletar, Ver no mapa
- Botão "Adicionar Veículo"
- Status em tempo real

`src/components/dashboard/VehicleForm.tsx`:
- Form para criar/editar veículo

### 6.5 Alertas

`src/app/(app)/dashboard/alerts/page.tsx`:
- Lista de alertas
- Filtros: Tipo, Lido/Não lido
- Ação: Marcar como lido
- Real-time: novos alertas aparecem automaticamente

### 6.6 Geocercas

`src/app/(app)/dashboard/geofences/page.tsx`:
- Lista de geocercas
- Mapa para desenhar novas geocercas
- Editar/deletar existentes

### 6.7 Layouts

`src/app/(app)/layout.tsx`:
- Sidebar com navegação
- Header com user menu
- Wrapper do RealtimeProvider

`src/app/layout.tsx`:
- Root layout global
- AuthProvider

### Critérios de Validação:

- [ ] Todas as páginas criadas e funcionais
- [ ] Design responsivo (mobile-friendly)
- [ ] Componentes UI reutilizáveis
- [ ] Mapa funcionando com marcadores
- [ ] Real-time funcionando em todas as telas
- [ ] Forms validados com react-hook-form + Zod

Aguardo confirmação para **FASE 7: TESTES E DEPLOY**.

---

## ✅ VALIDAÇÃO FINAL

Antes de considerarmos o projeto completo, valide:

### Checklist Funcional:
- [ ] Usuário pode se registrar
- [ ] Usuário pode fazer login (email/senha)
- [ ] Usuário pode fazer login com Google
- [ ] Usuário pode criar veículo
- [ ] Eventos de rastreamento atualizam mapa em tempo real
- [ ] Geocercas podem ser criadas e visualizadas
- [ ] Alertas são gerados automaticamente
- [ ] Dashboard mostra estatísticas corretas
- [ ] WebSocket conecta e funciona
- [ ] Todas as operações CRUD funcionam

### Checklist Técnico:
- [ ] PostgreSQL conectado
- [ ] Redis conectado
- [ ] Migrations aplicadas
- [ ] Seed data criado
- [ ] JWT funcionando
- [ ] OAuth funcionando
- [ ] WebSocket autenticado
- [ ] Pub/Sub Redis funcionando
- [ ] TypeScript sem erros
- [ ] Build Next.js sem erros

### Checklist de Segurança:
- [ ] Senhas hasheadas com bcrypt
- [ ] JWT secret forte (.env)
- [ ] Todas as APIs protegidas com auth
- [ ] Validação Zod em todas as rotas
- [ ] SQL injection prevenido (Drizzle ORM)
- [ ] CORS configurado
- [ ] Rate limiting (implementar se necessário)

---

## 📝 INSTRUÇÕES DE USO DESTE PROMPT

### Como usar com assistente de IA:

1. **Inicie a conversa** copiando:
```
Olá! Vou implementar um Sistema de Rastreamento de Veículos usando Next.js 14, PostgreSQL e WebSocket.

Vamos trabalhar fase por fase, seguindo o guia detalhado que tenho.

Estou pronto para começar pela FASE 1: SETUP INICIAL.

Por favor, crie TODOS os arquivos de configuração necessários com código completo.
```

2. **Para cada fase**, após o assistente completar:
```
Obrigado! Validei a FASE X. 

Por favor, prossiga para a FASE Y: [NOME DA FASE].

Lembre-se de criar código completo, não snippets.
```

3. **Se precisar de correções**:
```
Encontrei um problema no arquivo [NOME]:
[DESCREVA O PROBLEMA]

Por favor, corrija e forneça o arquivo completo atualizado.
```

4. **Para validar real-time**:
```
Vamos testar o WebSocket:
1. Inicie o servidor WS
2. Conecte um cliente
3. Insira um veículo via API
4. Confirme que o evento foi recebido via WS

Forneça instruções passo a passo.
```

---

## 🎯 RESULTADO ESPERADO

Ao final, você terá:

✅ Sistema completo funcionando localmente  
✅ Autenticação robusta (email + OAuth)  
✅ Rastreamento em tempo real via WebSocket  
✅ Dashboard interativo com mapa  
✅ Geocercas e alertas  
✅ Banco PostgreSQL estruturado  
✅ APIs REST completas  
✅ TypeScript estritamente tipado  
✅ Código production-ready  

---

## 📚 REFERÊNCIAS COMPLEMENTARES

Durante a implementação, consulte:

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [WebSocket API (ws)](https://github.com/websockets/ws)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [Google Maps React](https://visgl.github.io/react-google-maps/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

## ✨ DICAS FINAIS

1. **Seja específico**: Peça código completo, não snippets
2. **Valide cada fase**: Teste antes de avançar
3. **Pergunte**: Se algo não estiver claro
4. **Itere**: Melhore o código conforme avança
5. **Documente**: Peça comentários para lógica complexa

---

**Boa sorte na implementação! 🚀**
