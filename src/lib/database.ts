import { Pool, PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import Redis from 'ioredis';

// Pool de conexões PostgreSQL
// TLS: em produção a conexão verifica o certificado do servidor.
// Forneça a CA via DATABASE_CA_CERT (conteúdo PEM) ou desative TLS
// explicitamente com DATABASE_SSL=disable (ex.: rede privada).
function resolveSsl(): false | { rejectUnauthorized: true; ca?: string } {
  if (process.env.DATABASE_SSL === 'disable') return false;
  if (process.env.NODE_ENV !== 'production') return false;
  return {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT || undefined,
  };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: resolveSsl(),
});

// Exportar o pool para compatibilidade
export function getDbPool() {
  return pool;
}

// Cliente Drizzle ORM
export const db = drizzle(pool, { schema });

// Cliente Redis para cache e pub/sub
let redis: Redis | null = null;

if (process.env.REDIS_URL && typeof window === 'undefined') {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  } catch (error) {
    console.warn('Redis connection failed during initialization:', error);
  }
}

export { redis };

// Funções utilitárias
export async function getConnection(): Promise<PoolClient> {
  return await pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
  if (redis) {
    await redis.quit();
  }
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
    if (!redis) return false;
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Função para notificar mudanças via Redis
export async function notifyChange(table: string, operation: string, data: any, userId?: string) {
  if (!redis) return;
  
  const change = {
    table,
    operation,
    data,
    userId,
    timestamp: new Date().toISOString(),
  };
  
  try {
    await redis.publish('db_changes', JSON.stringify(change));
  } catch (error) {
    console.error('Failed to publish change notification:', error);
  }
}

// Função para verificar estrutura do banco
export async function ensureDatabaseStructure(): Promise<void> {
  try {
    const client = await getConnection();
    
    // Verificar se as tabelas principais existem
    const tables = ['users', 'profiles', 'vehicles', 'vehicle_status', 'trips', 'events', 'alerts', 'geofences'];
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table]
      );
      
      if (!result.rows[0].exists) {
        console.warn(`Tabela ${table} não existe. Execute as migrations primeiro.`);
      }
    }
    
    client.release();
    console.log('Verificação da estrutura do banco concluída.');
  } catch (error) {
    console.error('Erro ao verificar estrutura do banco:', error);
    throw error;
  }
}

// Função para executar transações
export async function withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(callback);
}

// Função para cache com Redis
export async function getFromCache(key: string): Promise<any> {
  try {
    if (!redis) return null;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  try {
    if (!redis) return;
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Erro ao definir cache:', error);
  }
}

export async function deleteFromCache(key: string): Promise<void> {
  try {
    if (!redis) return;
    await redis.del(key);
  } catch (error) {
    console.error('Erro ao deletar cache:', error);
  }
}

// Função para invalidar cache por padrão
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Erro ao invalidar cache por padrão:', error);
  }
}