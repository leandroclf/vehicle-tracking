import jwt from 'jsonwebtoken';
import type { User } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Cria um token JWT para o usuário
 * @param user Dados do usuário
 * @returns Token JWT
 */
export function createJWT(user: Omit<User, 'password'>): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'yukz-vehicle-tracking',
    audience: 'yukz-users',
  });
}

/**
 * Verifica e decodifica um token JWT
 * @param token Token JWT
 * @returns Dados do usuário ou null se inválido
 */
export function verifyToken(token: string): Omit<User, 'password'> | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'yukz-vehicle-tracking',
      audience: 'yukz-users',
    }) as any;

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      phone: decoded.phone || '',
      role: decoded.role || 'user',
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

/**
 * Extrai o token do header Authorization
 * @param authHeader Header de autorização
 * @returns Token ou null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer '
}

/**
 * Verifica se o token está expirado
 * @param token Token JWT
 * @returns Boolean indicando se está expirado
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Renova um token JWT se estiver próximo do vencimento
 * @param token Token atual
 * @param user Dados do usuário
 * @returns Novo token ou o token atual
 */
export function refreshTokenIfNeeded(token: string, user: Omit<User, 'password'>): string {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return createJWT(user);
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    
    // Renova se faltam menos de 24 horas para expirar
    if (timeUntilExpiry < 24 * 60 * 60) {
      return createJWT(user);
    }
    
    return token;
  } catch (error) {
    return createJWT(user);
  }
}