'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, AuthClientService } from './auth-client';
import { socialAuthService } from './social-auth-service';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  socialLogin: (provider: string, accessToken: string, idToken?: string) => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar token ao carregar
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await AuthClientService.verifyToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user: userData, token } = await AuthClientService.signIn(email, password);
      
      localStorage.setItem(TOKEN_KEY, token);
      setUser(userData);
      
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { user: userData, token } = await AuthClientService.signUp(email, password, name);
      
      localStorage.setItem(TOKEN_KEY, token);
      setUser(userData);
      
      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    toast.success('Logout realizado com sucesso!');
  };

  const socialLogin = async (provider: string, accessToken: string, idToken?: string) => {
    try {
      setLoading(true);
      const response = await socialAuthService.login({
        provider: provider as 'google' | 'facebook' | 'apple',
        accessToken,
        idToken
      });
      
      if (response.accessToken && response.email) {
        // Criar objeto AuthUser compatível com o formato esperado
        const userData: AuthUser = {
          id: response.providerId,
          email: response.email,
          name: response.name || '',
          role: 'user' as const,
          avatar: response.avatar,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        setUser(userData);
        toast.success('Login social realizado com sucesso!');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login social');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { name?: string; phone?: string }) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar perfil');
      }

      // Atualizar estado local
      setUser(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar senha');
      }

      toast.success('Senha atualizada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar senha');
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const userData = await AuthClientService.verifyToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      signOut();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    socialLogin,
    updateProfile,
    updatePassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook para verificar se o usuário está autenticado
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  return { user, loading };
}

// Função utilitária para fazer requisições autenticadas
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  return response;
}