// Importações
import { verifyAuth } from './verify-auth';
import { verifyToken, createJWT } from './jwt-utils';
import { hashPassword, comparePasswords } from './password-utils';

// Exportações
export { verifyAuth };
export { verifyToken, createJWT };
export { hashPassword, comparePasswords };
export { AuthProvider, useAuth } from './auth-context';