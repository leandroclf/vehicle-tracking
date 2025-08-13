# Implementação Técnica - Migração Supabase para PostgreSQL

## 1. Modificações Específicas por Arquivo

### 1.1 Package.json - Dependências

**Remover:**
```json
{
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/auth-helpers-react": "^0.5.0",
  "@supabase/supabase-js": "^2.49.4"
}
```

**Adicionar:**
```json
{
  "pg": "^8.11.3",
  "@types/pg": "^8.10.9",
  "drizzle-orm": "^0.29.0",
  "drizzle-kit": "^0.20.4",
  "ws": "^8.14.2",
  "@types/ws": "^8.5.10",
  "ioredis": "^5.3.2",
  "@types/ioredis": "^5.0.8",
  "pg-connection-string": "^2.6.2"
}
```

### 1.2 Variáveis de Ambiente

**Arquivo: `.env.local` (novo)**
```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/vehicle_tracking
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# WebSocket
WS_PORT=8084
NEXT_PUBLIC_WS_URL=ws://localhost:8084

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.3 Configuração Drizzle

**Arquivo: `drizzle.config.ts` (novo)**
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 1.4 Substituição do Cliente Supabase

**Arquivo: `src/lib/database.ts` (substitui `src/lib/supabase.ts`)**
```typescript
import { Pool, PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import Redis from 'ioredis';

// Pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Cliente Drizzle ORM
export const db = drizzle(pool, { schema });

// Cliente Redis para cache e pub/sub
export const redis = new Redis(process.env.REDIS_URL!, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// Funções utilitárias
export async function getConnection(): Promise<PoolClient> {
  return await pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
  await redis.quit();
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await getConnection();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Função para notificar mudanças via Redis
export async function notifyChange(table: string, operation: string, data: any, userId?: string) {
  const change = {
    table,
    operation,
    data,
    userId,
    timestamp: new Date().toISOString(),
  };
  
  await redis.publish('db_changes', JSON.stringify(change));
}
```

### 1.5 Schema Completo

**Arquivo: `src/lib/schema.ts` (novo)**
```typescript
import { pgTable, serial, uuid, text, timestamp, boolean, real, integer, jsonb, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Usuários
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Perfis
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Veículos
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  plate: text('plate').notNull().unique(),
  model: text('model'),
  year: text('year'),
  color: text('color'),
  deviceImei: text('device_imei').unique(),
  deviceModel: text('device_model'),
  deviceSim: text('device_sim'),
  deviceLastMaintenance: timestamp('device_last_maintenance'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Status dos veículos
export const vehicleStatus = pgTable('vehicle_status', {
  vehicleId: integer('vehicle_id').primaryKey().references(() => vehicles.id, { onDelete: 'cascade' }),
  status: text('status').default('offline'),
  isMoving: boolean('is_moving').default(false),
  lastUpdate: timestamp('last_update'),
  lat: real('lat'),
  lng: real('lng'),
  address: text('address'),
  speed: real('speed').default(0),
  direction: text('direction'),
  ignition: boolean('ignition').default(false),
  battery: real('battery'),
  satellites: integer('satellites').default(0),
});

// Viagens
export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationSeconds: integer('duration_seconds'),
  distanceMeters: integer('distance_meters'),
  startLat: real('start_lat'),
  startLng: real('start_lng'),
  startAddress: text('start_address'),
  endLat: real('end_lat'),
  endLng: real('end_lng'),
  endAddress: text('end_address'),
  maxSpeed: real('max_speed'),
  avgSpeed: real('avg_speed'),
});

// Eventos
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  tripId: integer('trip_id').references(() => trips.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  lat: real('lat'),
  lng: real('lng'),
  address: text('address'),
  speed: real('speed'),
  ignition: boolean('ignition'),
  battery: real('battery'),
  details: jsonb('details'),
});

// Alertas
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').default('medium'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at'),
});

// Relações
export const usersRelations = relations(users, ({ many, one }) => ({
  profile: one(profiles),
  vehicles: many(vehicles),
  alerts: many(alerts),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  user: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
  status: one(vehicleStatus),
  trips: many(trips),
  events: many(events),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  events: many(events),
}));
```

### 1.6 Middleware de Autenticação

**Arquivo: `src/lib/auth/auth-middleware.ts` (substitui referências Supabase)**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth-service';

export async function authMiddleware(request: NextRequest) {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Verificar token
    const user = await AuthService.verifyToken(token);
    
    // Adicionar usuário ao request (para uso nas rotas)
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email);
    
    return response;
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}

// Helper para extrair usuário do request em rotas API
export function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  
  if (!userId || !userEmail) {
    throw new Error('Usuário não autenticado');
  }
  
  return { id: userId, email: userEmail };
}
```

### 1.7 Context de Autenticação Atualizado

**Arquivo: `src/lib/auth/auth-context.tsx` (substitui Supabase)**
```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, AuthUser } from './auth-service';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'yukz_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Verificar token salvo no localStorage
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      AuthService.verifyToken(savedToken)
        .then((user) => {
          setUser(user);
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user, token } = await AuthService.signIn(email, password);
      setUser(user);
      setToken(token);
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user, token } = await AuthService.signUp(email, password, name);
      setUser(user);
      setToken(token);
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      token,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 1.8 Cliente WebSocket para Frontend

**Arquivo: `src/lib/realtime/websocket-client.ts` (novo)**
```typescript
'use client';

interface WebSocketMessage {
  type: string;
  table?: string;
  operation?: string;
  data?: any;
  filter?: any;
}

interface Subscription {
  table: string;
  filter?: any;
  callback: (data: any) => void;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect() {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${this.token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Reinscrever em todas as subscriptions
        this.subscriptions.forEach((subscription, key) => {
          this.subscribe(subscription.table, subscription.callback, subscription.filter);
        });
      };
      
      this.ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket authentication successful');
        break;
        
      case 'db_change':
        this.handleDatabaseChange(message);
        break;
        
      case 'subscription_success':
        console.log(`Subscribed to ${message.table}`);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleDatabaseChange(message: WebSocketMessage) {
    const { table, operation, data } = message;
    
    // Encontrar subscriptions que correspondem
    this.subscriptions.forEach((subscription, key) => {
      if (subscription.table === table) {
        // Verificar se o filtro corresponde (implementação simplificada)
        subscription.callback({ operation, data });
      }
    });
  }

  public subscribe(table: string, callback: (data: any) => void, filter?: any): string {
    const subscriptionKey = `${table}:${JSON.stringify(filter || {})}`;
    
    this.subscriptions.set(subscriptionKey, {
      table,
      filter,
      callback,
    });
    
    // Enviar subscription para o servidor
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        table,
        filter,
      }));
    }
    
    return subscriptionKey;
  }

  public unsubscribe(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      this.subscriptions.delete(subscriptionKey);
      
      // Enviar unsubscribe para o servidor
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'unsubscribe',
          table: subscription.table,
        }));
      }
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }
}
```

### 1.9 Hook para Realtime

**Arquivo: `src/lib/hooks/useRealtime.ts` (substitui useSupabaseRealtime)**
```typescript
'use client';

import { useEffect, useState, useRef } from 'react';
import { RealtimeClient } from '../realtime/websocket-client';
import { useAuth } from '../auth/auth-context';

interface UseRealtimeOptions {
  table: string;
  filter?: any;
  enabled?: boolean;
}

export function useRealtime<T>({ table, filter, enabled = true }: UseRealtimeOptions) {
  const { token } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !token) {
      setLoading(false);
      return;
    }

    // Criar cliente WebSocket
    clientRef.current = new RealtimeClient(token);
    
    // Subscrever às mudanças
    subscriptionRef.current = clientRef.current.subscribe(
      table,
      (change) => {
        const { operation, data: changeData } = change;
        
        setData(prevData => {
          switch (operation) {
            case 'INSERT':
              return [...prevData, changeData];
              
            case 'UPDATE':
              return prevData.map(item => 
                (item as any).id === changeData.id ? { ...item, ...changeData } : item
              );
              
            case 'DELETE':
              return prevData.filter(item => (item as any).id !== changeData.id);
              
            default:
              return prevData;
          }
        });
      },
      filter
    );
    
    setLoading(false);
    
    return () => {
      if (subscriptionRef.current && clientRef.current) {
        clientRef.current.unsubscribe(subscriptionRef.current);
      }
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [table, filter, enabled, token]);

  return { data, loading, error };
}
```

## 2. Rotas API Atualizadas

### 2.1 Rota de Autenticação

**Arquivo: `src/app/api/auth/login/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    const result = await AuthService.signIn(email, password);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 401 }
    );
  }
}
```

### 2.2 Rota de Veículos Atualizada

**Arquivo: `src/app/api/vehicles/route.ts` (atualizada)**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db, notifyChange } from '@/lib/database';
import { vehicles } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    const userVehicles = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, user.id));
    
    return NextResponse.json(userVehicles);
    
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar veículos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const vehicleData = await request.json();
    
    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        ...vehicleData,
        userId: user.id,
      })
      .returning();
    
    // Notificar mudança via WebSocket
    await notifyChange('vehicles', 'INSERT', newVehicle, user.id);
    
    return NextResponse.json(newVehicle, { status: 201 });
    
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Erro ao criar veículo' },
      { status: 500 }
    );
  }
}
```

## 3. Scripts de Build e Deploy

### 3.1 Script de Build

**Arquivo: `scripts/build.sh`**
```bash
#!/bin/bash

echo "🚀 Iniciando build do projeto Yukz..."

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não está definida"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ JWT_SECRET não está definida"
  exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
pnpm install

# Executar migrations
echo "🗄️ Executando migrations..."
node scripts/migrate-to-postgresql.js

# Gerar tipos do Drizzle
echo "🔧 Gerando tipos..."
pnpm drizzle-kit generate:pg

# Build da aplicação
echo "🏗️ Fazendo build da aplicação..."
pnpm build

echo "✅ Build concluído com sucesso!"
```

### 3.2 Script de Deploy

**Arquivo: `scripts/deploy.sh`**
```bash
#!/bin/bash

echo "🚀 Iniciando deploy do projeto Yukz..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Fazer backup do banco (se existir)
echo "💾 Fazendo backup do banco..."
if [ "$(docker ps -aq -f name=yukz-postgres)" ]; then
  docker exec yukz-postgres pg_dump -U postgres vehicle_tracking > backup_$(date +%Y%m%d_%H%M%S).sql
fi

# Build das imagens
echo "🏗️ Fazendo build das imagens Docker..."
docker-compose build --no-cache

# Iniciar serviços
echo "▶️ Iniciando serviços..."
docker-compose up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar saúde dos serviços
echo "🔍 Verificando saúde dos serviços..."
docker-compose ps

# Executar testes de saúde
echo "🩺 Executando testes de saúde..."
curl -f http://localhost:3000/api/health || exit 1

echo "✅ Deploy concluído com sucesso!"
```

## 4. Testes de Validação

### 4.1 Teste de Conexão com Banco

**Arquivo: `tests/database.test.js`**
```javascript
const { Pool } = require('pg');
const Redis = require('ioredis');

describe('Database Connection Tests', () => {
  let pool;
  let redis;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    redis = new Redis(process.env.REDIS_URL);
  });

  afterAll(async () => {
    await pool.end();
    await redis.quit();
  });

  test('PostgreSQL connection', async () => {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
    client.release();
  });

  test('Redis connection', async () => {
    const result = await redis.ping();
    expect(result).toBe('PONG');
  });

  test('Tables exist', async () => {
    const client = await pool.connect();
    
    const tables = ['users', 'profiles', 'vehicles', 'vehicle_status', 'trips', 'events', 'alerts'];
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      expect(result.rows[0].exists).toBe(true);
    }
    
    client.release();
  });
});
```

### 4.2 Teste de Autenticação

**Arquivo: `tests/auth.test.js`**
```javascript
const { AuthService } = require('../src/lib/auth/auth-service');

describe('Authentication Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User',
  };

  test('User registration', async () => {
    const result = await AuthService.signUp(
      testUser.email,
      testUser.password,
      testUser.name
    );
    
    expect(result.user.email).toBe(testUser.email);
    expect(result.user.name).toBe(testUser.name);
    expect(result.token).toBeDefined();
  });

  test('User login', async () => {
    const result = await AuthService.signIn(
      testUser.email,
      testUser.password
    );
    
    expect(result.user.email).toBe(testUser.email);
    expect(result.token).toBeDefined();
  });

  test('Token verification', async () => {
    const { token } = await AuthService.signIn(
      testUser.email,
      testUser.password
    );
    
    const user = await AuthService.verifyToken(token);
    expect(user.email).toBe(testUser.email);
  });
});
```

---

**Documento criado em**: $(date)
**Versão**: 1.0
**Responsável**: Equipe de Desenvolvimento Yukz