import jwt from 'jsonwebtoken';

// TODO: Use environment variable for JWT secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-secret-key-for-yukz'; // Replace with a strong secret, ideally from env
const JWT_EXPIRES_IN = '1d'; // Token expiration time (e.g., 1 day)

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

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return token;
}

/**
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded payload if the token is valid, otherwise null.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

