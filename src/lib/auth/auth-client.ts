'use client';

// Tipos para autenticação no cliente
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error || body.message || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Serviço de autenticação para o lado cliente
 * Faz chamadas para as APIs de autenticação
 */
export class AuthClientService {
  private static apiUrl = '/api/auth';

  /**
   * Faz login do usuário
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Erro ao fazer login'));
    }

    return (await response.json()) as AuthResponse;
  }

  /**
   * Registra um novo usuário
   */
  static async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await fetch(`${this.apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Erro ao criar conta'));
    }

    return (await response.json()) as AuthResponse;
  }

  /**
   * Verifica se o token é válido e retorna os dados do usuário
   */
  static async verifyToken(token: string): Promise<AuthUser> {
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token inválido');
    }

    const data = (await response.json()) as { user: AuthUser };
    return data.user;
  }

  /**
   * Solicita reset de senha
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Erro ao solicitar reset de senha'));
    }
  }

  /**
   * Atualiza a senha do usuário
   */
  static async updatePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/update-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Erro ao atualizar senha'));
    }
  }
}