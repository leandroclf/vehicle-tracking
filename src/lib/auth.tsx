'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { verifyToken } from './jwt-client'; // Versão do cliente da função verifyToken

// Para debug
console.log('Módulo auth.tsx carregado')

// Definição do tipo de usuário (pode ser estendido com base no payload do JWT)
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// Interface para a resposta da API de login
interface LoginResponse {
  user: User;
  token: string;
  error?: string;
}

// Interface para a resposta da API de registro
interface RegisterResponse {
  success: boolean;
  error?: string;
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
        console.log('Token armazenado encontrado:', !!storedToken);
        
        if (storedToken) {
          // Tentar decodificar o token
          const decodedUser = verifyToken(storedToken);
          console.log('Token decodificado:', decodedUser);
          
          if (decodedUser && decodedUser.userId) {
            // Criar objeto de usuário com os dados do token
            const userData: User = { 
              id: decodedUser.userId, 
              name: decodedUser.name || 'Usuário', // Valor padrão caso o nome não esteja no token
              email: decodedUser.email || '' // Valor padrão caso o email não esteja no token
            };
            
            setUser(userData);
            setToken(storedToken);
            console.log('Usuário autenticado:', userData);
          } else {
            console.error('Token inválido ou expirado');
            // Token inválido ou expirado, limpar localStorage
            removeLocalStorageItem('yukz_token');
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        removeLocalStorageItem('yukz_token'); // Limpar em caso de erro
        setUser(null);
        setToken(null);
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
      // Limpar qualquer autenticação anterior
      removeLocalStorageItem('yukz_token');
      setUser(null);
      setToken(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        // Garantir que as credenciais sejam enviadas
        credentials: 'include'
      });

      // Verificar se a resposta foi recebida
      if (!response.ok) {
        console.error('Erro na resposta HTTP:', response.status, response.statusText);
        
        try {
          const errorData = await response.json() as { error?: string };
          console.error('Detalhes do erro:', errorData);
          return { success: false, error: errorData.error || `Erro ${response.status}: ${response.statusText}` };
        } catch (parseError) {
          console.error('Erro ao processar resposta de erro:', parseError);
          return { success: false, error: `Erro ${response.status}: ${response.statusText}` };
        }
      }
      
      // Tentar processar a resposta JSON
      let data: LoginResponse;
      try {
        data = await response.json() as LoginResponse;
        console.log('Resposta do login processada:', data ? 'Sucesso' : 'Vazia');
      } catch (jsonError) {
        console.error('Erro ao processar resposta JSON:', jsonError);
        return { success: false, error: 'Erro ao processar resposta do servidor' };
      }
      
      // Verificar se a resposta contém os dados esperados
      if (!data || !data.user || !data.token) {
        console.error('Resposta incompleta do login:', data);
        return { success: false, error: 'Resposta incompleta do servidor' };
      }

      // Login bem-sucedido, armazenar token e dados do usuário
      const { user: userData, token: userToken } = data;
      console.log('Login bem-sucedido:', { userData, tokenLength: userToken?.length });
      
      // Verificar se o token é válido antes de armazenar
      const decodedUser = verifyToken(userToken);
      if (!decodedUser || !decodedUser.userId) {
        console.error('Token recebido é inválido');
        return { success: false, error: 'Erro de autenticação: token inválido' };
      }
      
      // Armazenar token e dados do usuário
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

      const data = await response.json() as RegisterResponse;

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

