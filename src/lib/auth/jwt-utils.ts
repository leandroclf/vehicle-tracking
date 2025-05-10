import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  sub: string;
  role?: string;
  exp?: number;
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Token inválido');
  }
}

export async function createJWT(payload: any, type: 'access' | 'refresh' = 'access'): Promise<string> {
  try {
    const expiresIn = type === 'access' ? '1h' : '7d';
    const jwtPayload: JWTPayload = {
      sub: payload.id || payload.userId || '',
      role: payload.role,
    };
    
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET || '', {
      expiresIn
    });
    return token;
  } catch (error) {
    throw new Error('Erro ao criar token');
  }
}