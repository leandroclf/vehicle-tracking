/**
 * API Health Check Endpoint
 * @description Endpoint para verificação de saúde da aplicação
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, getRedisClient } from '@/lib/database';

// Interface para resposta de health check
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
    api: 'operational' | 'degraded' | 'down';
  };
  uptime: number;
  environment: string;
}

// Tempo de início da aplicação
const startTime = Date.now();

/**
 * GET /api/health
 * Retorna status de saúde da aplicação
 */
export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  try {
    // Verificar conexão com banco de dados PostgreSQL
    let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    
    try {
      const pool = getDbPool();
      
      // Teste simples de conectividade com PostgreSQL
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      databaseStatus = 'connected';
    } catch (error) {
      console.error('Erro ao verificar conexão com PostgreSQL:', error);
      databaseStatus = 'error';
    }
    
    // Verificar conexão com Redis
    let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    
    try {
      const redis = getRedisClient();
      await redis.ping();
      redisStatus = 'connected';
    } catch (error) {
      console.error('Erro ao verificar conexão com Redis:', error);
      redisStatus = 'error';
    }

    // Calcular uptime
    const uptime = Date.now() - startTime;

    // Determinar status geral
    const isHealthy = databaseStatus === 'connected' && redisStatus === 'connected';

    const healthResponse: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: databaseStatus,
        redis: redisStatus,
        api: 'operational'
      },
      uptime,
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(healthResponse, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Erro no health check:', error);
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'error',
        redis: 'error',
        api: 'degraded'
      },
      uptime: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

/**
 * HEAD /api/health
 * Versão simplificada para verificação rápida
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificação básica sem detalhes
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}