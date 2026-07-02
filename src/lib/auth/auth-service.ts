import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { users, profiles } from '../schema';
import { eq } from 'drizzle-orm';
import { getJwtExpiresIn, getJwtSecret } from '../env';


export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export class AuthService {
  static async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    // Verificar se usuário já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
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
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      emailVerified: false,
    }).returning();

    // Criar perfil
    await db.insert(profiles).values({
      id: newUser.id,
      name: name.trim(),
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
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
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
      const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
      
      // Buscar usuário atualizado
      const [user] = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified || false,
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
    const [currentUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    
    if (!currentUser) {
      throw new Error('Usuário não encontrado');
    }

    return this.generateToken(currentUser);
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Buscar usuário
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      throw new Error('Nova senha deve ter pelo menos 6 caracteres');
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await db.update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  static async getUserById(userId: string): Promise<AuthUser | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
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

  static async updateProfile(userId: string, updates: { name?: string; phone?: string }): Promise<void> {
    if (updates.name) {
      await db.update(users)
        .set({ 
          name: updates.name.trim(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    if (updates.name || updates.phone) {
      await db.update(profiles)
        .set({ 
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.phone && { phone: updates.phone.trim() }),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));
    }
  }

  private static generateToken(user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean | null;
  }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified || false,
      },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'] }
    );
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}