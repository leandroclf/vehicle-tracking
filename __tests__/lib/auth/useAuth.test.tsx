// @jest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  it('retorna estado inicial não autenticado', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('realiza login e atualiza estado', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      result.current.login('test@example.com', '123456');
      jest.runAllTimers();
    });
    expect(result.current.user).toMatchObject({ email: 'test@example.com' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('fake-token');
    // Persistência
    expect(localStorage.getItem('user')).toContain('test@example.com');
    expect(localStorage.getItem('token')).toBe('fake-token');
  });

  it('realiza logout e limpa estado', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      result.current.login('test@example.com', '123456');
      jest.runAllTimers();
    });
    act(() => {
      result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('carrega usuário do localStorage ao inicializar', () => {
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'persist@a.com' }));
    localStorage.setItem('token', 'persist-token');
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toMatchObject({ email: 'persist@a.com' });
    expect(result.current.token).toBe('persist-token');
    expect(result.current.isAuthenticated).toBe(true);
  });
}); 