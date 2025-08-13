# Migração do Supabase para PostgreSQL - Yukz Vehicle Tracking

## 1. Resumo Executivo

Este documento detalha o processo completo de migração do projeto Yukz Vehicle Tracking do Supabase para PostgreSQL nativo, incluindo substituição de todas as dependências, configurações e funcionalidades para manter o sistema operacional.

**Objetivo**: Remover completamente a dependência do Supabase e implementar uma solução PostgreSQL nativa com autenticação JWT e sistema de realtime alternativo.

**Impacto**: Migração completa da arquitetura de backend, requerendo modificações em 45+ arquivos e implementação de novos serviços.

## 2. Análise das Dependências Atuais

### 2.1 Dependências do Supabase Identificadas

**Pacotes NPM a serem removidos:**
- `@supabase/supabase-js`: ^2.49.4
- `@supabase/auth-helpers-nextjs`: ^0.10.0
- `@supabase/auth-helpers-react`: ^0.5.0

**Funcionalidades do Supabase em uso:**
- Autenticação e autorização
- Realtime subscriptions
- Database queries e mutations
- Row Level Security (RLS)
- Edge Functions
- Storage (se aplicável)

### 2.2 Arquivos com Referências ao Supabase

**Arquivos principais (45 identificados):**
- `src/lib/supabase.ts` - Cliente principal
- `src/lib/databaseConfig.ts` - Configuração de DB
- `src/lib/auth/auth-context.tsx` - Contexto de autenticação
- `src/components/notifications/RealtimeNotifications.tsx` - Notificações em tempo real
- `src/lib/realtime-connection-manager.ts` - Gerenciador de conexões
- Múltiplas rotas de API em `src/app/api/`
- Hooks personalizados para realtime
- Serviços de analytics e tracking

## 3. Plano de Migração Detalhado

### 3.1 Fase 1: Preparação da Infraestrutura

#### 3.1.1 Novas Dependências PostgreSQL

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "@types/pg": "^8.10.9",
    "drizzle-orm": "^0.29.0",
    "drizzle-kit": "^0.20.4",
    "ws": "^8.14.2",
    "@types/ws": "^8.5.10",
    "ioredis": "^5.3.2",
    "@types/ioredis": "^5.0.8"
  }
}
```

#### 3.1.2 Configuração do Docker Compose

**Novo docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: yukz-postgres
    environment:
      POSTGRES_DB: vehicle_tracking
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    networks:
      - yukz-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d vehicle_tracking"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: yukz-redis
    ports:
      - "6379:6379"
    networks:
      - yukz-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: yukz-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/vehicle_tracking
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - yukz-network

  tracker-server:
    build:
      context: ./tracker-server
      dockerfile: Dockerfile
    container_name: yukz-tracker-server
    ports:
      - "8080:8080"
      - "8081:8081"
      - "8082:8082"
      - "8083:8083"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/vehicle_tracking
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - yukz-network

volumes:
  postgres_data:

networks:
  yukz-network:
    driver: bridge
```

### 3.2 Fase 2: Substituição da Camada de Dados

#### 3.2.1 Novo Cliente de Banco de Dados

**Arquivo: `src/lib/database.ts`**
```typescript
import { Pool, PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export async function getConnection(): Promise<PoolClient> {
  return await pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
}

// Health check
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
```

#### 3.2.2 Schema Drizzle ORM

**Arquivo: `src/lib/schema.ts`**
```typescript
import { pgTable, serial, uuid, text, timestamp, boolean, real, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabela de usuários (substitui auth.users do Supabase)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de perfis
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de veículos
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'car', 'motorcycle', 'truck', 'boat', 'jetski'
  plate: text('plate').notNull().unique(),
  model: text('model'),
  year: text('year'),
  color: text('color'),
  deviceImei: text('device_imei').unique(),
  deviceModel: text('device_model'),
  deviceSim: text('device_sim'),
  deviceLastMaintenance: timestamp('device_last_maintenance'),
  status: text('status').default('active'), // 'active', 'inactive'
  createdAt: timestamp('created_at').defaultNow(),
});

// Demais tabelas seguem o mesmo padrão...
// (vehicle_status, trips, events, alerts, etc.)
```

### 3.3 Fase 3: Sistema de Autenticação JWT

#### 3.3.1 Serviço de Autenticação

**Arquivo: `src/lib/auth/auth-service.ts`**
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { users, profiles } from '../schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  static async signUp(email: string, password: string, name: string): Promise<{ user: AuthUser; token: string }> {
    // Verificar se usuário já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('Usuário já existe');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      name,
    }).returning();

    // Criar perfil
    await db.insert(profiles).values({
      id: newUser.id,
      name,
    });

    // Gerar token
    const token = this.generateToken(newUser);

    return {
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token,
    };
  }

  static async signIn(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    // Buscar usuário
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = this.generateToken(user);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  static async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Buscar usuário atualizado
      const [user] = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return { id: user.id, email: user.email, name: user.name };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  private static generateToken(user: any): string {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
}
```

### 3.4 Fase 4: Sistema Realtime com WebSockets

#### 3.4.1 Servidor WebSocket

**Arquivo: `src/lib/realtime/websocket-server.ts`**
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { AuthService } from '../auth/auth-service';
import Redis from 'ioredis';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  subscriptions?: Set<string>;
}

export class RealtimeServer {
  private wss: WebSocketServer;
  private redis: Redis;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.redis = new Redis(process.env.REDIS_URL!);
    this.setupWebSocketServer();
    this.setupRedisSubscriptions();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        // Autenticar conexão
        const token = this.extractTokenFromRequest(req);
        const user = await AuthService.verifyToken(token);
        
        ws.userId = user.id;
        ws.subscriptions = new Set();
        
        // Adicionar cliente à lista
        if (!this.clients.has(user.id)) {
          this.clients.set(user.id, new Set());
        }
        this.clients.get(user.id)!.add(ws);

        // Configurar handlers
        ws.on('message', (data) => this.handleMessage(ws, data));
        ws.on('close', () => this.handleDisconnection(ws));
        
        // Confirmar conexão
        ws.send(JSON.stringify({ type: 'connected', userId: user.id }));
        
      } catch (error) {
        ws.close(1008, 'Authentication failed');
      }
    });
  }

  private setupRedisSubscriptions() {
    // Subscriber para mudanças no banco
    const subscriber = new Redis(process.env.REDIS_URL!);
    
    subscriber.subscribe('db_changes');
    subscriber.on('message', (channel, message) => {
      if (channel === 'db_changes') {
        const change = JSON.parse(message);
        this.broadcastChange(change);
      }
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(ws, message.table, message.filter);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(ws, message.table);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private handleSubscription(ws: AuthenticatedWebSocket, table: string, filter?: any) {
    const subscriptionKey = `${table}:${JSON.stringify(filter || {})}`;
    ws.subscriptions!.add(subscriptionKey);
    
    ws.send(JSON.stringify({
      type: 'subscription_success',
      table,
      filter
    }));
  }

  private broadcastChange(change: any) {
    const { table, operation, data, userId } = change;
    
    // Enviar para clientes específicos baseado no userId
    if (userId && this.clients.has(userId)) {
      const userClients = this.clients.get(userId)!;
      
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'db_change',
            table,
            operation,
            data
          }));
        }
      });
    }
  }

  private extractTokenFromRequest(req: IncomingMessage): string {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      throw new Error('Token not provided');
    }
    
    return token;
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }
  }
}
```

## 4. Scripts de Migração Atualizados

### 4.1 Script de Migração Principal

**Arquivo: `scripts/migrate-to-postgresql.js`**
```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando ao PostgreSQL...');
    
    // Executar migrations em ordem
    const migrationFiles = [
      '01-create-extensions.sql',
      '02-create-users-table.sql',
      '03-create-profiles-table.sql',
      '04-create-vehicles-table.sql',
      '05-create-vehicle-status-table.sql',
      '06-create-trips-table.sql',
      '07-create-events-table.sql',
      '08-create-alerts-table.sql',
      '09-create-indexes.sql',
      '10-create-functions.sql',
      '99-insert-initial-data.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`Executando migration: ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
      await pool.query(sql);
      console.log(`✓ ${file} executado com sucesso`);
    }

    console.log('Todas as migrations foram executadas com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

### 4.2 Migrations SQL Atualizadas

**Arquivo: `migrations/02-create-users-table.sql`**
```sql
-- Tabela de usuários (substitui auth.users do Supabase)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 5. Checklist de Validação Pós-Migração

### 5.1 Infraestrutura
- [ ] PostgreSQL rodando e acessível
- [ ] Redis rodando e acessível
- [ ] Todas as migrations executadas
- [ ] Índices criados corretamente
- [ ] Triggers funcionando

### 5.2 Aplicação
- [ ] Autenticação JWT funcionando
- [ ] Registro de novos usuários
- [ ] Login de usuários existentes
- [ ] Middleware de autenticação nas rotas protegidas
- [ ] CRUD de veículos funcionando
- [ ] Sistema realtime operacional
- [ ] Notificações em tempo real

### 5.3 Performance
- [ ] Queries otimizadas
- [ ] Conexões de banco gerenciadas corretamente
- [ ] Cache Redis funcionando
- [ ] WebSocket connections estáveis

### 5.4 Segurança
- [ ] Senhas hasheadas corretamente
- [ ] Tokens JWT seguros
- [ ] Validação de entrada de dados
- [ ] Rate limiting implementado

## 6. Comandos de Execução

### 6.1 Desenvolvimento
```bash
# Instalar novas dependências
pnpm install

# Executar migrations
node scripts/migrate-to-postgresql.js

# Iniciar desenvolvimento
pnpm dev
```

### 6.2 Produção
```bash
# Build da aplicação
pnpm build

# Iniciar com Docker
docker-compose up -d

# Verificar saúde dos serviços
docker-compose ps
```

## 7. Considerações Finais

### 7.1 Riscos Identificados
- **Downtime durante migração**: Planejar janela de manutenção
- **Perda de dados**: Backup completo antes da migração
- **Incompatibilidades**: Testes extensivos em ambiente de staging

### 7.2 Benefícios Esperados
- Maior controle sobre a infraestrutura
- Redução de custos operacionais
- Flexibilidade para customizações
- Melhor performance com otimizações específicas

### 7.3 Próximos Passos
1. Backup completo do banco Supabase atual
2. Configuração do ambiente de staging
3. Execução da migração em staging
4.