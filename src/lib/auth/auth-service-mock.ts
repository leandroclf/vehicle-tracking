import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MockDatabase } from '../database-mock';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export class AuthService {
  static async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    // Verificar se usuário já existe
    const existingUser = await MockDatabase.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Validar entrada
    if (!email || !password || !name) {
      throw new Error('Email, senha e nome são obrigatórios');
    }

    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário
    const newUser = await MockDatabase.createUser({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      emailVerified: false,
    });

    // Gerar token
    const token = this.generateToken(newUser);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        emailVerified: newUser.emailVerified || false,
      },
      token,
    };
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    // Validar entrada
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    // Buscar usuário
    const user = await MockDatabase.findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified || false,
      },
      token,
    };
  }

  static async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Buscar usuário atualizado
      const user = await MockDatabase.findUserById(decoded.id);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified || false,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      throw error;
    }
  }

  static async refreshToken(token: string): Promise<string> {
    const user = await this.verifyToken(token);
    const currentUser = await MockDatabase.findUserById(user.id);
    
    if (!currentUser) {
      throw new Error('Usuário não encontrado');
    }

    return this.generateToken(currentUser);
  }

  static async updatePassword(email: string, newPassword: string): Promise<void> {
    // Buscar usuário por email
    const user = await MockDatabase.findUserByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      throw new Error('Nova senha deve ter pelo menos 6 caracteres');
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await MockDatabase.updateUser(user.id, {
      passwordHash: newPasswordHash,
    });
  }

  static async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await MockDatabase.findUserById(userId);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified || false,
    };
  }

  static async updateProfile(userId: string, updates: { name?: string; phone?: string; avatar_url?: string }): Promise<{ profile: any }> {
    const updatedUser = await MockDatabase.updateUser(userId, updates);
    
    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }
    
    return {
      profile: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        avatar_url: updates.avatar_url, // Mock - não temos esse campo no banco mock
      }
    };
  }

  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  private static generateToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
}