import jwt from 'jsonwebtoken';
import { getJwtExpiresIn, getJwtSecret } from './env';

export const JWT_SECRET = process.env.JWT_SECRET || 'yukz-local-development-secret-minimum-32-chars';

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Generates a JWT token for a user.
 * @param user - The user object containing id, email, and name.
 * @returns The generated JWT token.
 */
export function generateToken(user: { id: string; email: string; name: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  // @ts-ignore - Ignorar problemas de tipo para esta operação
  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });
}

/**
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded payload if the token is valid, otherwise null.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    // @ts-ignore - Ignorar problemas de tipo para esta operação
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

