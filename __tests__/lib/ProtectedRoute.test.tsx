// @jest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider, AuthContext } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: () => '/dashboard',
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

function Wrapper({ children, auth }: any) {
  // Permite customizar o contexto de autenticação para cada teste
  const value = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    token: auth.token,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  };
  return (
    <AuthProvider>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza filhos se autenticado', () => {
    render(
      <ProtectedRoute>
        <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      { wrapper: ({ children }) => <Wrapper auth={{ user: { id: '1', email: 'a@a.com' }, isAuthenticated: true, isLoading: false, token: 't' }}>{children}</Wrapper> }
    );
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
  });

  it('mostra loading se isLoading=true', () => {
    render(
      <ProtectedRoute>
        <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      { wrapper: ({ children }) => <Wrapper auth={{ user: null, isAuthenticated: false, isLoading: true, token: null }}>{children}</Wrapper> }
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redireciona para /login se não autenticado', async () => {
    render(
      <ProtectedRoute>
        <div>Conteúdo Protegido</div>
      </ProtectedRoute>,
      { wrapper: ({ children }) => <Wrapper auth={{ user: null, isAuthenticated: false, isLoading: false, token: null }}>{children}</Wrapper> }
    );
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard');
    });
  });
}); 