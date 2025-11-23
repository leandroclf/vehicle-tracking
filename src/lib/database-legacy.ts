import { Pool } from 'pg';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';

// Configurações do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vehicle_tracking',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Configurações do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Instâncias globais
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

/**
 * Retorna uma instância compartilhada do pool de conexões PostgreSQL
 */
export const getDbPool = (): Pool => {
  if (!globalThis.__dbPool) {
    globalThis.__dbPool = new Pool(dbConfig);
    console.log('Pool de conexões PostgreSQL criado');
  }
  return globalThis.__dbPool;
};

/**
 * Retorna uma instância compartilhada do cliente Redis
 */
export const getRedisClient = (): Redis => {
  if (!globalThis.__redisClient) {
    globalThis.__redisClient = new Redis(redisConfig);
    console.log('Cliente Redis criado');
  }
  return globalThis.__redisClient;
};

/**
 * Verifica e decodifica um token JWT
 */
export const verifyToken = (token: string): any => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Token inválido');
  }
};

/**
 * Gera um token JWT
 */
export const generateToken = (payload: any, expiresIn: string = '24h'): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Executa uma query no banco de dados
 */
export const executeQuery = async (text: string, params?: any[]): Promise<any> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Publica uma mensagem no Redis para realtime
 */
export const publishRealtimeMessage = async (channel: string, message: any): Promise<void> => {
  const redis = getRedisClient();
  await redis.publish(channel, JSON.stringify(message));
};

// Exportações para retrocompatibilidade
export const db = getDbPool();
export const redis = getRedisClient();

// Função para fechar conexões (útil para testes)
export const closeConnections = async (): Promise<void> => {
  if (globalThis.__dbPool) {
    await globalThis.__dbPool.end();
    globalThis.__dbPool = undefined;
  }
  if (globalThis.__redisClient) {
    globalThis.__redisClient.disconnect();
    globalThis.__redisClient = undefined;
  }
};