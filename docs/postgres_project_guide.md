# Guia Completo: Sistema de Rastreamento de Veículos com PostgreSQL

> **Stack**: Next.js 14 + TypeScript + PostgreSQL + Redis + WebSocket  
> **Arquitetura**: Sem Supabase - PostgreSQL Puro

---

## 📋 Índice

1. [Arquitetura do Sistema](#1-arquitetura-do-sistema)
2. [Requisitos e Tecnologias](#2-requisitos-e-tecnologias)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Banco de Dados PostgreSQL](#4-banco-de-dados-postgresql)
5. [Autenticação e Autorização](#5-autenticação-e-autorização)
6. [Sistema em Tempo Real](#6-sistema-em-tempo-real)
7. [Estrutura do Projeto](#7-estrutura-do-projeto)
8. [APIs e Endpoints](#8-apis-e-endpoints)
9. [Segurança](#9-segurança)
10. [Deploy em Produção](#10-deploy-em-produção)
11. [Monitoramento e Logs](#11-monitoramento-e-logs)

---

## 1. Arquitetura do Sistema

### 1.1 Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Dashboard  │  │   Tracking   │  │     Auth     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────┬───────────────┬────────────────┬──────────┘
             │               │                │
       ┌─────▼─────┐   ┌────▼────┐     ┌────▼────┐
       │ REST API  │   │ WebSocket│     │  OAuth  │
       │ (Next.js) │   │  Server  │     │ Providers│
       └─────┬─────┘   └────┬─────┘     └────┬────┘
             │              │                 │
       ┌─────▼──────────────▼─────────────────▼────┐
       │          PostgreSQL Database               │
       │    (Users, Vehicles, Events, Tracking)     │
       └────────────────────┬───────────────────────┘
                            │
                      ┌─────▼─────┐
                      │   Redis   │
                      │ (Pub/Sub) │
                      └───────────┘
```

### 1.2 Componentes Principais

| Componente | Tecnologia | Função |
|------------|-----------|--------|
| **Frontend** | Next.js 14 (App Router) | Interface do usuário |
| **API REST** | Next.js API Routes | CRUD e lógica de negócio |
| **WebSocket** | `ws` + Node.js | Conexões em tempo real |
| **Banco de Dados** | PostgreSQL 15+ | Persistência de dados |
| **Cache/Pub-Sub** | Redis 7+ | Cache e mensageria |
| **ORM** | Drizzle ORM | Type-safe SQL queries |
| **Autenticação** | JWT + bcrypt | Segurança e sessões |

---

## 2. Requisitos e Tecnologias

### 2.1 Requisitos de Sistema

```json
{
  "node": ">=18.0.0",
  "npm": ">=9.0.0",
  "postgresql": ">=15.0",
  "redis": ">=7.0"
}
```

### 2.2 Dependências Principais

```json
{
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    
    "pg": "^8.11.0",
    "drizzle-orm": "^0.29.0",
    "drizzle-kit": "^0.24.0",
    
    "ioredis": "^5.3.2",
    "ws": "^8.16.0",
    
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    
    "@react-google-maps/api": "^2.19.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/pg": "^8.10.0",
    "@types/ws": "^8.5.10",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.0"
  }
}
```

---

## 3. Configuração do Ambiente

### 3.1 Estrutura de Variáveis de Ambiente

Crie `.env.local`:

```bash
# === DATABASE ===
DATABASE_URL="postgresql://usuario:senha@localhost:5432/vehicle_tracking"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="vehicle_tracking"
DB_USER="seu_usuario"
DB_PASSWORD="sua_senha"
DB_SSL_MODE="prefer"          # "require" em produção

# === REDIS ===
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""             # Obrigatório em produção

# === JWT ===
JWT_SECRET="seu-secret-super-seguro-minimo-32-caracteres"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="outro-secret-diferente-para-refresh"
JWT_REFRESH_EXPIRES_IN="30d"

# === WEBSOCKET ===
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
WS_PORT="3001"

# === OAUTH (Google) ===
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# === MAPS ===
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="sua-api-key-maps"

# === EMAILS (opcional) ===
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASSWORD="sua-senha-app"

# === NEXT.JS ===
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3.2 Arquivo de Configuração Drizzle

`drizzle.config.ts`:

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

---

## 4. Banco de Dados PostgreSQL

### 4.1 Instalação PostgreSQL

#### Windows
```powershell
# Via winget
winget install PostgreSQL.PostgreSQL

# Ou baixar de: https://www.postgresql.org/download/windows/
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Docker (Recomendado para Dev)
```bash
docker run --name vehicle-tracking-db \
  -e POSTGRES_USER=seu_usuario \
  -e POSTGRES_PASSWORD=sua_senha \
  -e POSTGRES_DB=vehicle_tracking \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -d postgres:15-alpine
```

### 4.2 Schema do Banco de Dados

`src/lib/schema.ts`:

```typescript
import { pgTable, varchar, text, timestamp, boolean, integer, uuid, jsonb, decimal, index } from 'drizzle-orm/pg-core';

// === TABELA: USERS ===
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // null para OAuth
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('Usuário'),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: index('users_email_idx').on(table.email),
  };
});

// === TABELA: OAUTH_ACCOUNTS ===
export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // google, facebook, apple
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('oauth_accounts_user_id_idx').on(table.userId),
    providerIdx: index('oauth_accounts_provider_idx').on(table.provider, table.providerAccountId),
  };
});

// === TABELA: VEHICLES ===
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  plate: varchar('plate', { length: 20 }).notNull().unique(),
  model: varchar('model', { length: 255 }),
  color: varchar('color', { length: 50 }),
  year: integer('year'),
  vin: varchar('vin', { length: 50 }), // Vehicle Identification Number
  deviceId: varchar('device_id', { length: 100 }).unique(),
  status: varchar('status', { length: 50 }).default('offline'), // online, offline, moving, stopped
  lastLocation: jsonb('last_location').$type<{
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
    timestamp: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('vehicles_user_id_idx').on(table.userId),
    plateIdx: index('vehicles_plate_idx').on(table.plate),
    statusIdx: index('vehicles_status_idx').on(table.status),
  };
});

// === TABELA: TRACKING_EVENTS ===
export const trackingEvents = pgTable('tracking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
  lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
  speed: decimal('speed', { precision: 5, scale: 2 }).default('0'),
  heading: integer('heading').default(0),
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }),
  altitude: decimal('altitude', { precision: 7, scale: 2 }),
  eventType: varchar('event_type', { length: 50 }).default('position'), // position, ignition_on, ignition_off, sos
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    vehicleIdIdx: index('tracking_events_vehicle_id_idx').on(table.vehicleId),
    timestampIdx: index('tracking_events_timestamp_idx').on(table.timestamp),
  };
});

// === TABELA: GEOFENCES ===
export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('circle'), // circle, polygon
  center: jsonb('center').$type<{ lat: number; lng: number }>(),
  radius: decimal('radius', { precision: 10, scale: 2 }), // metros
  polygon: jsonb('polygon').$type<Array<{ lat: number; lng: number }>>(),
  color: varchar('color', { length: 50 }).default('#3b82f6'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('geofences_user_id_idx').on(table.userId),
  };
});

// === TABELA: ALERTS ===
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // speed, geofence, ignition, sos, maintenance
  severity: varchar('severity', { length: 20 }).default('info'), // info, warning, critical
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('alerts_user_id_idx').on(table.userId),
    readIdx: index('alerts_read_idx').on(table.read),
    createdAtIdx: index('alerts_created_at_idx').on(table.createdAt),
  };
});

// === TABELA: SESSIONS ===
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tokenIdx: index('sessions_token_idx').on(table.token),
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
  };
});
```

### 4.3 Migrations

Gerar migrations:

```bash
npx drizzle-kit generate:pg
```

Aplicar migrations:

```bash
npx drizzle-kit push:pg
```

### 4.4 Conexão com PostgreSQL

`src/lib/database.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL_MODE === 'require' ? {
    rejectUnauthorized: false
  } : undefined,
});

// Cliente Drizzle
export const db = drizzle(pool, { schema });

// Health check do banco
export async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL conectado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error);
    return false;
  }
}

// Executar query raw (quando necessário)
export async function executeQuery(query: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

export { pool };
```

---

## 5. Autenticação e Autorização

### 5.1 Serviço de Autenticação

`src/lib/auth/auth-service.ts`:

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { users, sessions, oauthAccounts } from '../schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  // === REGISTRO COM EMAIL/SENHA ===
  static async register(email: string, password: string, name: string) {
    // Verificar se usuário já existe
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'Usuário',
    }).returning();

    // Gerar token
    const token = this.generateToken({ userId: user.id, email: user.email });

    return { user: this.sanitizeUser(user), token };
  }

  // === LOGIN COM EMAIL/SENHA ===
  static async login(email: string, password: string) {
    // Buscar usuário
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.password) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = this.generateToken({ userId: user.id, email: user.email });

    // Criar sessão
    await this.createSession(user.id, token);

    return { user: this.sanitizeUser(user), token };
  }

  // === OAUTH (Google, Facebook, Apple) ===
  static async handleOAuthLogin(provider: string, profile: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  }, tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }) {
    // Verificar se conta OAuth já existe
    const [existingOAuth] = await db.select()
      .from(oauthAccounts)
      .where(and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, profile.id)
      ))
      .limit(1);

    let userId: string;

    if (existingOAuth) {
      // Atualizar tokens
      await db.update(oauthAccounts)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        })
        .where(eq(oauthAccounts.id, existingOAuth.id));

      userId = existingOAuth.userId;
    } else {
      // Verificar se usuário com mesmo email já existe
      const [existingUser] = await db.select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Criar novo usuário
        const [newUser] = await db.insert(users).values({
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          emailVerified: true,
          role: 'Usuário',
        }).returning();

        userId = newUser.id;
      }

      // Criar conta OAuth
      await db.insert(oauthAccounts).values({
        userId,
        provider,
        providerAccountId: profile.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });
    }

    // Buscar usuário completo
    const [ user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    // Gerar JWT
    const token = this.generateToken({ userId: user.id, email: user.email });

    await this.createSession(user.id, token);

    return { user: this.sanitizeUser(user), token };
  }

  // === VERIFICAR TOKEN JWT ===
  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      
      // Buscar usuário
      const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // === GERAR TOKEN JWT ===
  static generateToken(payload: { userId: string; email: string }) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // === CRIAR SESSÃO ===
  static async createSession(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
    });
  }

  // === LOGOUT ===
  static async logout(token: string) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // === SANITIZAR USUÁRIO (remover senha) ===
  static sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  // === EXTRAIR TOKEN DO HEADER ===
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
```

### 5.2 Middleware de Autenticação

`src/lib/auth/auth-middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth-service';

export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = AuthService.extractTokenFromHeader(authHeader || '');

  if (!token) {
    return NextResponse.json(
      { error: 'Token de autenticação necessário' },
      { status: 401 }
    );
  }

  try {
    const user = await AuthService.verifyToken(token);
    return { user };
  } catch (error) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}

// Helper para proteger rotas de API
export function withAuth(handler: Function) {
  return async (req: NextRequest) => {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    return handler(req, authResult);
  };
}
```

### 5.3 Exemplo de API com Auth

`src/app/api/vehicles/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-middleware';
import { db } from '@/lib/database';
import { vehicles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  const userVehicles = await db.select()
    .from(vehicles)
    .where(eq(vehicles.userId, user.id));

  return NextResponse.json({ vehicles: userVehicles });
});

export const POST = withAuth(async (req: NextRequest, { user }: any) => {
  const body = await req.json();

  const [vehicle] = await db.insert(vehicles).values({
    userId: user.id,
    name: body.name,
    plate: body.plate,
    model: body.model,
    color: body.color,
    year: body.year,
  }).returning();

  return NextResponse.json({ vehicle }, { status: 201 });
});
```

---

## 6. Sistema em Tempo Real

### 6.1 Servidor WebSocket

`src/server/websocket-server.ts`:

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { AuthService } from '@/lib/auth/auth-service';
import Redis from 'ioredis';
import { IncomingMessage } from 'http';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  subscriptions?: Set<string>;
  isAlive?: boolean;
}

export class RealtimeServer {
  private wss: WebSocketServer;
  private redis: Redis;
  private subscriber: Redis;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.redis = new Redis(process.env.REDIS_URL!);
    this.subscriber = new Redis(process.env.REDIS_URL!);
    
    this.setupWebSocketServer();
    this.setupRedisSubscriptions();
    this.setupHeartbeat();
    
    console.log(`🔌 WebSocket Server rodando na porta ${port}`);
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        // Autenticar via token na query string
        const token = this.extractToken(req);
        const user = await AuthService.verifyToken(token);
        
        ws.userId = user.id;
        ws.subscriptions = new Set();
        ws.isAlive = true;
        
        // Adicionar cliente
        if (!this.clients.has(user.id)) {
          this.clients.set(user.id, new Set());
        }
        this.clients.get(user.id)!.add(ws);
        
        console.log(`✅ Cliente conectado: ${user.email}`);
        
        // Handlers
        ws.on('message', (data) => this.handleMessage(ws, data));
        ws.on('close', () => this.handleDisconnect(ws));
        ws.on('pong', () => { ws.isAlive = true; });
        
        // Confirmar conexão
        this.send(ws, { type: 'connected', userId: user.id });
        
      } catch (error) {
        console.error('❌ Erro na autenticação WebSocket:', error);
        ws.close(1008, 'Authentication failed');
      }
    });
  }

  private setupRedisSubscriptions() {
    // Subscrever em canais de mudanças do banco
    this.subscriber.subscribe(
      'db:vehicles',
      'db:tracking_events',
      'db:alerts',
    );

    this.subscriber.on('message', (channel, message) => {
      const data = JSON.parse(message);
      this.broadcastToSubscribers(channel, data);
    });
  }

  private setupHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30s

    this.wss.on('close', () => clearInterval(interval));
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: any) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(ws, message.table, message.filter);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message.table);
          break;
        default:
          console.warn('Tipo de mensagem desconhecido:', message.type);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  private handleSubscribe(ws: AuthenticatedWebSocket, table: string, filter?: any) {
    const key = `${table}:${JSON.stringify(filter || {})}`;
    ws.subscriptions!.add(key);
    console.log(`🔔 Cliente ${ws.userId} inscrito em ${table}`);
  }

  private handleUnsubscribe(ws: AuthenticatedWebSocket, table: string) {
    const keysToRemove = Array.from(ws.subscriptions!)
      .filter(key => key.startsWith(`${table}:`));
    
    keysToRemove.forEach(key => ws.subscriptions!.delete(key));
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
      console.log(`🔌 Cliente desconectado: ${ws.userId}`);
    }
  }

  private broadcastToSubscribers(channel: string, data: any) {
    const table = channel.replace('db:', '');
    
    this.clients.forEach((clientsSet, userId) => {
      clientsSet.forEach(client => {
        // Verificar se cliente está inscrito nesta tabela
        const hasSubscription = Array.from(client.subscriptions! || [])
          .some(sub => sub.startsWith(`${table}:`));
        
        if (hasSubscription && client.readyState === WebSocket.OPEN) {
          this.send(client, {
            type: 'db_change',
            table,
            ...data,
          });
        }
      });
    });
  }

  private send(ws: WebSocket, message: any) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }

  private extractToken(req: IncomingMessage): string {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) throw new Error('Token não fornecido');
    return token;
  }

  // Publicar mudanças no Redis (chamado após insert/update/delete)
  async publishChange(table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', record: any) {
    await this.redis.publish(`db:${table}`, JSON.stringify({
      type,
      record,
      timestamp: new Date().toISOString(),
    }));
  }
}

// Iniciar servidor
if (require.main === module) {
  const port = parseInt(process.env.WS_PORT || '3001');
  new RealtimeServer(port);
}
```

### 6.2 Cliente WebSocket (React)

`src/lib/realtime/websocket-client.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

interface RealtimeContextType {
  subscribe: (table: string, callback: (data: any) => void, filter?: any) => () => void;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Map<string, Function>>(new Map());

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      setConnectionState('connected');
      
      // Re-subscrever
      subscriptionsRef.current.forEach((callback, key) => {
        const [table, filterStr] = key.split(':');
        const filter = filterStr ? JSON.parse(filterStr) : undefined;
        ws.send(JSON.stringify({ type: 'subscribe', table, filter }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'db_change') {
          // Notificar callbacks inscritos
          subscriptionsRef.current.forEach((callback, key) => {
            if (key.startsWith(`${message.table}:`)) {
              callback(message);
            }
          });
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      setConnectionState('disconnected');
    };

    ws.onerror = () => {
      setConnectionState('error');
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const subscribe = (table: string, callback: (data: any) => void, filter?: any): (() => void) => {
    const key = `${table}:${JSON.stringify(filter || {})}`;
    subscriptionsRef.current.set(key, callback);

    // Enviar subscribe se conectado
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', table, filter }));
    }

    // Retornar unsubscribe
    return () => {
      subscriptionsRef.current.delete(key);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe', table }));
      }
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribe, connectionState }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}
```

---

## 7. Estrutura do Projeto

```
vehicle-tracking/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (marketing)/  # Landing page pública
│   │   │   └── page.tsx
│   │   ├── (app)/        # App autenticado
│   │   │   ├── dashboard/
│   │   │   ├── tracking/
│   │   │   ├── vehicles/
│   │   │   └── layout.tsx
│   │   ├── api/          # API Routes
│   │   │   ├── auth/
│   │   │   ├── vehicles/
│   │   │   ├── tracking/
│   │   │   └── alerts/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── map/
│   │   └── landing/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth-service.ts
│   │   │   └── auth-middleware.ts
│   │   ├── realtime/
│   │   │   ├── websocket-client.tsx
│   │   │   └── websocket-server.ts
│   │   ├── database.ts
│   │   ├── schema.ts
│   │   └── redis.ts
│   ├── types/
│   └── styles/
├── drizzle/
│   └── migrations/
├── server/               # Servidor WebSocket standalone
│   └── index.ts
├── public/
├── .env.local
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## 8. APIs e Endpoints

### 8.1 Autenticação

```
POST   /api/auth/register      - Registro com email/senha
POST   /api/auth/login         - Login com email/senha
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Obter usuário atual
POST   /api/auth/oauth/google  - OAuth com Google
POST   /api/auth/oauth/facebook - OAuth com Facebook
POST   /api/auth/oauth/apple   - OAuth com Apple
```

### 8.2 Veículos

```
GET    /api/vehicles           - Listar veículos do usuário
POST   /api/vehicles           - Criar novo veículo
GET    /api/vehicles/:id       - Obter veículo específico
PUT    /api/vehicles/:id       - Atualizar veículo
DELETE /api/vehicles/:id       - Deletar veículo
GET    /api/vehicles/:id/location - Localização atual
GET    /api/vehicles/:id/history  - Histórico de trajetos
```

### 8.3 Rastreamento

```
POST   /api/tracking/events    - Criar evento de rastreamento
GET    /api/tracking/live      - Stream de eventos em tempo real
GET    /api/tracking/history   - Histórico de eventos
```

### 8.4 Geocercas

```
GET    /api/geofences          - Listar geocercas
POST   /api/geofences          - Criar geocerca
PUT    /api/geofences/:id      - Atualizar geocerca
DELETE /api/geofences/:id      - Deletar geocerca
```

### 8.5 Alertas

```
GET    /api/alerts             - Listar alertas
POST   /api/alerts/read        - Marcar como lido
DELETE /api/alerts/:id         - Deletar alerta
```

---

## 9. Segurança

### 9.1 Checklist de Segurança

- [ ] **Variáveis de Ambiente**: Nunca commitar `.env` no Git
- [ ] **JWT Secret**: Mínimo 32 caracteres, gerado aleatoriamente
- [ ] **HTTPS**: Sempre em produção
- [ ] **CORS**: Configurar origins permitidos
- [ ] **Rate Limiting**: Implementar em APIs críticas
- [ ] **SQL Injection**: Usar Drizzle ORM (queries parametrizadas)
- [ ] **XSS**: Sanitizar inputs do usuário
- [ ] **CSRF**: Tokens CSRF em formulários
- [ ] **Password Hashing**: bcrypt com salt rounds >= 10
- [ ] **Database SSL**: Ativar em produção
- [ ] **Redis Password**: Sempre configurar senha

### 9.2 Exemplo de Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number;
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Uso:
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    await limiter.check(10, ip); // 10 requisições por minuto
  } catch {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }
  
  // ... resto da lógica
}
```

---

## 10. Deploy em Produção

### 10.1 Opções de Hosting

#### A. Vercel (Frontend + API)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configurações Vercel**:
- Environment Variables: Adicionar todas do `.env.local`
- PostgreSQL: Usar Supabase Database (sim, só o DB!) ou Neon ou Railway
- Redis: Usar Upstash Redis

#### B. Railway (Full-Stack)
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

#### C. DigitalOcean App Platform
- Conectar repositório GitHub
- Configurar build commands
- Adicionar PostgreSQL e Redis managed databases

### 10.2 PostgreSQL em Produção

**Opções**:
1. **Supabase** (apenas como PostgreSQL host, sem usar SDK)
2. **Neon** (Serverless Postgres)
3. **Railway** (PostgreSQL managed)
4. **AWS RDS** (Production-grade)
5. **DigitalOcean Managed Database**

### 10.3 Redis em Produção

**Opções**:
1. **Upstash** (Serverless Redis)
2. **Redis Cloud**
3. **Railway Redis**
4. **AWS ElastiCache**

### 10.4 Dockerfile (Opcional)

```dockerfile
FROM node:18-alpine AS base

# Dependências
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

---

## 11. Monitoramento e Logs

### 11.1 Logging Structure

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
};
```

### 11.2 Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database';

export async function GET() {
  const dbHealthy = await checkDatabaseConnection();
  
  return NextResponse.json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      redis: 'up', // TODO: implementar check
    },
  }, {
    status: dbHealthy ? 200 : 503,
  });
}
```

---

## 🎯 Checklist de Implementação

### Fase 1: Setup Inicial
- [ ] Criar projeto Next.js 14
- [ ] Instalar dependências (pg, drizzle, jwt, bcrypt, ws, ioredis)
- [ ] Configurar `.env.local`
- [ ] Configurar Drizzle (`drizzle.config.ts`)

### Fase 2: Banco de Dados
- [ ] Instalar PostgreSQL (Docker recomendado)
- [ ] Criar schema (`schema.ts`)
- [ ] Gerar e aplicar migrations
- [ ] Testar conexão

### Fase 3: Autenticação
- [ ] Implementar `AuthService`
- [ ] Criar rotas de API auth (`/api/auth/*`)
- [ ] Implementar middleware de auth
- [ ] Criar páginas de login/registro

### Fase 4: Features Core
- [ ] CRUD de Veículos
- [ ] Sistema de rastreamento (eventos)
- [ ] Geocercas
- [ ] Alertas

### Fase 5: Tempo Real
- [ ] Configurar Redis
- [ ] Implementar servidor WebSocket
- [ ] Criar provider React para WebSocket
- [ ] Testar atualizações em tempo real

### Fase 6: Deploy
- [ ] Escolher plataforma (Vercel/Railway/etc)
- [ ] Configurar PostgreSQL em produção
- [ ] Configurar Redis em produção
- [ ] Adicionar variáveis de ambiente
- [ ] Deploy!

---

## 📚 Recursos Adicionais

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## ✅ Conclusão

Este guia fornece uma base sólida para construir um sistema de rastreamento de veículos **do zero** usando **PostgreSQL puro** (sem Supabase). A arquitetura é escalável, segura e pronta para produção.

**Principais vantagens dessa abordagem**:
- ✅ Controle total sobre o banco de dados
- ✅ Sem vendor lock-in
- ✅ Flexibilidade para customizações
- ✅ Custo otimizado (PostgreSQL gratuito em muitas plataformas)
- ✅ Performance superior com queries otimizadas

**Boa sorte no seu projeto!** 🚀
