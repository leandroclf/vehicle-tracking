
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth'; // Import useAuth
import Link from 'next/link';
import { Menu, X, User, LogOut } from 'lucide-react'; // Using lucide-react icons

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth(); // Get user and logout function
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold">
          Yukz
        </Link>

        {/* Desktop Navigation & User Info */}
        <nav className="hidden md:flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {user.name || user.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition duration-300"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">Login</Link>
              <Link href="/register" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition duration-300">Registrar</Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-700 px-4 py-3">
          <nav className="flex flex-col space-y-2">
            {isAuthenticated && user ? (
              <>
                <span className="flex items-center py-1">
                  <User className="w-4 h-4 mr-1" />
                  {user.name || user.email}
                </span>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition duration-300 text-left"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-300 py-1">Login</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition duration-300">Registrar</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

