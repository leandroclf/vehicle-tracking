import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

type TokenType = 'access' | 'refresh';

interface TokenPayload {
  id: string;
  role?: string;
  type: TokenType;
  [key: string]: any;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function comparePasswords(plainText: string, hashed: string): Promise<boolean> {
  return compare(plainText, hashed);
}

export function createJWT(payload: Omit<TokenPayload, 'type'>, type: TokenType = 'access'): string {
  const expiresIn = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
  return sign({ ...payload, type }, JWT_SECRET, { expiresIn });
}

export async function verifyToken(token: string, type?: TokenType): Promise<TokenPayload | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as TokenPayload;
    if (type && decoded.type !== type) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
} 