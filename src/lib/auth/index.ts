// Exportações apenas para o frontend (sem dependências do database)
export { AuthProvider, useAuth } from './auth-context';

// Funções server-side (apenas para APIs)
// export { verifyAuth } from './verify-auth';
// export { verifyToken, createJWT } from './jwt-utils';
// export { hashPassword, comparePasswords } from './password-utils';