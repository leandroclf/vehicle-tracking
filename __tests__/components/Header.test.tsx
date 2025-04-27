import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/layout/Header';
import { AuthProvider, useAuth } from '@/lib/auth'; // Need AuthProvider for context

// Mock the useAuth hook
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'), // Use actual implementation for AuthProvider
  useAuth: jest.fn(),
}));

describe('Header Component', () => {
  const mockLogout = jest.fn();

  // Test case for unauthenticated user
  test('renders Login and Register buttons when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
    });

    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );

    // Check for Login and Register links/buttons
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registrar/i })).toBeInTheDocument();
    expect(screen.queryByText(/sair/i)).not.toBeInTheDocument();
  });

  // Test case for authenticated user
  test('renders user name and Logout button when user is authenticated', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );

    // Check for user name and Logout button
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /registrar/i })).not.toBeInTheDocument();
  });

  // Test case for logout button click
  test('calls logout function when Logout button is clicked', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );

    const logoutButton = screen.getByRole('button', { name: /sair/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  // Add more tests for mobile menu interactions if needed
});

