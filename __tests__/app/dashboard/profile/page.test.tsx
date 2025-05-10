// @jest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/dashboard/profile/page';
import { AuthProvider, AuthContext } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: () => '/dashboard/profile',
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

function Wrapper({ children, auth }: any) {
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

describe('ProfilePage (protegida)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza conteúdo se autenticado', () => {
    render(
      <ProfilePage />, 
      { wrapper: ({ children }) => <Wrapper auth={{ user: { id: '1', email: 'a@a.com', name: 'Usuário' }, isAuthenticated: true, isLoading: false, token: 't' }}>{children}</Wrapper> }
    );
    expect(screen.getByText(/Perfil do Usuário/i)).toBeInTheDocument();
  });

  it('redireciona para login se não autenticado', async () => {
    render(
      <ProfilePage />, 
      { wrapper: ({ children }) => <Wrapper auth={{ user: null, isAuthenticated: false, isLoading: false, token: null }}>{children}</Wrapper> }
    );
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard%2Fprofile');
    });
  });
});

describe('ProfilePage (integração)', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation((url, options) => {
      if (url === '/api/profile' && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, user: { id: '1', name: 'Usuário', email: 'a@a.com', phone: '123' } })
        }) as any;
      }
      if (url === '/api/auth/update-password') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, message: 'Senha atualizada com sucesso!' })
        }) as any;
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Erro' }) }) as any;
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('atualiza perfil e exibe mensagem de sucesso', async () => {
    render(
      <ProfilePage />, 
      { wrapper: ({ children }) => <Wrapper auth={{ user: { id: '1', email: 'a@a.com', name: 'Usuário', phone: '123' }, isAuthenticated: true, isLoading: false, token: 't' }}>{children}</Wrapper> }
    );
    const nomeInput = screen.getByLabelText(/Nome/i) as HTMLInputElement;
    const salvarBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    expect(nomeInput).toBeInTheDocument();
    nomeInput.focus();
    await waitFor(() => {
      nomeInput.setSelectionRange(0, nomeInput.value.length);
    });
    nomeInput.value = 'NovoNome';
    nomeInput.dispatchEvent(new Event('input', { bubbles: true }));
    salvarBtn.click();
    await waitFor(() => {
      expect(screen.getByText(/Perfil atualizado com sucesso/i)).toBeInTheDocument();
    });
  });

  it('exibe erro ao atualizar perfil se API falhar', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Erro ao atualizar perfil.' }) }));
    render(
      <ProfilePage />, 
      { wrapper: ({ children }) => <Wrapper auth={{ user: { id: '1', email: 'a@a.com', name: 'Usuário', phone: '123' }, isAuthenticated: true, isLoading: false, token: 't' }}>{children}</Wrapper> }
    );
    const salvarBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    salvarBtn.click();
    await waitFor(() => {
      expect(screen.getByText(/Erro ao atualizar perfil/i)).toBeInTheDocument();
    });
  });

  it('altera senha e exibe mensagem de sucesso', async () => {
    render(
      <ProfilePage />, 
      { wrapper: ({ children }) => <Wrapper auth={{ user: { id: '1', email: 'a@a.com', name: 'Usuário', phone: '123' }, isAuthenticated: true, isLoading: false, token: 't' }}>{children}</Wrapper> }
    );
    const senhaAtual = screen.getByLabelText(/Senha Atual/i) as HTMLInputElement;
    const novaSenha = screen.getByLabelText(/Nova Senha/i) as HTMLInputElement;
    const confirmarSenha = screen.getByLabelText(/Confirmar Nova Senha/i) as HTMLInputElement;
    const atualizarBtn = screen.getByRole('button', { name: /Atualizar Senha/i });
    senhaAtual.value = 'senha123';
    senhaAtual.dispatchEvent(new Event('input', { bubbles: true }));
    novaSenha.value = 'novaSenha123';
    novaSenha.dispatchEvent(new Event('input', { bubbles: true }));
    confirmarSenha.value = 'novaSenha123';
    confirmarSenha.dispatchEvent(new Event('input', { bubbles: true }));
    atualizarBtn.click();
    await waitFor(() => {
      expect(screen.getByText(/Senha atualizada com sucesso/i)).toBeInTheDocument();
    });
  });

  it('exibe erro ao alterar senha se API falhar', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Erro ao atualizar senha' }) }));
    render(
      <ProfilePage />, 
      { wrapper: ({ children }) => <Wrapper auth={{ user: { id: '1', email: 'a@a.com', name: 'Usuário', phone: '123' }, isAuthenticated: true, isLoading: false, token: 't' }}>{children}</Wrapper> }
    );
    const senhaAtual = screen.getByLabelText(/Senha Atual/i) as HTMLInputElement;
    const novaSenha = screen.getByLabelText(/Nova Senha/i) as HTMLInputElement;
    const confirmarSenha = screen.getByLabelText(/Confirmar Nova Senha/i) as HTMLInputElement;
    const atualizarBtn = screen.getByRole('button', { name: /Atualizar Senha/i });
    senhaAtual.value = 'senha123';
    senhaAtual.dispatchEvent(new Event('input', { bubbles: true }));
    novaSenha.value = 'novaSenha123';
    novaSenha.dispatchEvent(new Event('input', { bubbles: true }));
    confirmarSenha.value = 'novaSenha123';
    confirmarSenha.dispatchEvent(new Event('input', { bubbles: true }));
    atualizarBtn.click();
    await waitFor(() => {
      expect(screen.getByText(/Erro ao atualizar senha/i)).toBeInTheDocument();
    });
  });
}); 