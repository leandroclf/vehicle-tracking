'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as UserType } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { socialAuthService } from './social-auth-service';
import { SocialLoginRequest, SocialSignupRequest } from '@/types/social-auth';

interface AuthContextType {
  user: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: string, accessToken: string, idToken?: string) => Promise<void>;
  socialSignup: (data: SocialSignupRequest) => Promise<void>;
  getLinkedAccounts: () => Promise<any[]>;
  linkSocialAccount: (provider: string, accessToken: string, idToken?: string) => Promise<boolean>;
  unlinkSocialAccount: (provider: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Persistência de sessão
  useEffect(() => {
    setIsLoading(true);
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          phone: data.session.user.user_metadata?.phone || '',
          password: '',
          role: data.session.user.user_metadata?.role || 'user',
        });
        setToken(data.session.access_token);
      }
      setIsLoading(false);
    });
    // Listener para mudanças de sessão
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          phone: session.user.user_metadata?.phone || '',
          password: '',
          role: session.user.user_metadata?.role || 'user',
        });
        setToken(session.access_token);
      } else {
        setUser(null);
        setToken(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setIsLoading(false);
      throw new Error(error?.message || 'Erro ao autenticar');
    }
    setUser({
      id: data.session.user.id,
      email: data.session.user.email || '',
      name: data.session.user.user_metadata?.name || '',
      phone: data.session.user.user_metadata?.phone || '',
      password: '',
      role: data.session.user.user_metadata?.role || 'user',
    });
    setToken(data.session.access_token);
    setIsLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name: name || '',
            phone: phone || ''
          }
        }
      });
      
      setIsLoading(false);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Se o usuário foi criado com sucesso
      if (data.user) {
        // Criar perfil na tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            name: name,
            phone: phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Não falha o registro se o perfil não for criado
        }
      }
      
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Erro ao registrar usuário' };
    }
  };

  // Métodos de autenticação social
  const socialLogin = async (provider: string, accessToken: string, idToken?: string) => {
    setIsLoading(true);
    try {
      const response = await socialAuthService.login({
        provider: provider as any,
        accessToken,
        idToken,
      });
      
      // A sessão será atualizada automaticamente pelo listener do Supabase
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const socialSignup = async (data: SocialSignupRequest) => {
    setIsLoading(true);
    try {
      const response = await socialAuthService.signup(data);
      // A sessão será atualizada automaticamente pelo listener do Supabase
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const getLinkedAccounts = async () => {
    if (!user) return [];
    return socialAuthService.getLinkedAccounts(user.id);
  };

  const linkSocialAccount = async (provider: string, accessToken: string, idToken?: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    return socialAuthService.linkAccount(user.id, {
      provider: provider as any,
      accessToken,
      idToken,
    });
  };

  const unlinkSocialAccount = async (provider: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    return socialAuthService.unlinkAccount(user.id, provider);
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        token,
        login,
        logout,
        register,
        socialLogin,
        socialSignup,
        getLinkedAccounts,
        linkSocialAccount,
        unlinkSocialAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export { AuthContext };