
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { verifyToken } from './jwt'; // Assuming jwt.ts is in the same lib folder

// Definição do tipo de usuário (pode ser estendido com base no payload do JWT)
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// Definição do contexto de autenticação
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Função auxiliar para buscar dados do localStorage de forma segura no cliente
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

// Função auxiliar para definir dados no localStorage de forma segura no cliente
const setLocalStorageItem = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Função auxiliar para remover dados do localStorage de forma segura no cliente
const removeLocalStorageItem = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

// Provedor de autenticação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = getLocalStorageItem('yukz_token');
        if (storedToken) {
          const decodedUser = verifyToken(storedToken);
          if (decodedUser) {
            setUser({ 
              id: decodedUser.userId, 
              name: decodedUser.name, 
              email: decodedUser.email 
              // phone: pode ser buscado separadamente se necessário
            });
            setToken(storedToken);
          } else {
            // Token inválido ou expirado, limpar localStorage
            removeLocalStorageItem('yukz_token');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        removeLocalStorageItem('yukz_token'); // Limpar em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Falha no login' };
      }

      // Login bem-sucedido, armazenar token e dados do usuário
      const { user: userData, token: userToken } = data;
      setLocalStorageItem('yukz_token', userToken);
      setUser(userData);
      setToken(userToken);
      return { success: true };

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: 'Erro de rede ou servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    removeLocalStorageItem('yukz_token');
    setUser(null);
    setToken(null);
    // Opcional: redirecionar para a página de login
    // window.location.href = '/login';
  };

  // Função de registro
  const register = async (name: string, email: string, phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Falha no registro' };
      }
      
      // Registro bem-sucedido, fazer login automaticamente?
      // Por enquanto, apenas retorna sucesso. O usuário pode fazer login depois.
      // Alternativamente, poderia chamar login() aqui ou retornar o token do registro se a API o fizesse.
      return { success: true };

    } catch (error) {
      console.error('Erro ao registrar:', error);
      return { success: false, error: 'Erro de rede ou servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

