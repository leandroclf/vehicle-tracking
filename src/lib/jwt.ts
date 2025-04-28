import jwt from 'jsonwebtoken';

// Use environment variable for JWT secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'yukz-secret-dev-key-please-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Token expiration time (e.g., 1 day)

// Log warning if using default secret in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('ATENÇÃO: JWT_SECRET não está definido no ambiente de produção!');
}

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded payload if the token is valid, otherwise null.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    // @ts-ignore - Ignorar problemas de tipo para esta operação
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

