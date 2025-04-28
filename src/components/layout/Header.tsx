'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Menu, X, User, LogOut, MapPin, Bell, Settings, BarChart } from 'lucide-react';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#00315c] text-white shadow-md sticky top-0 z-50">
      <div className="yukz-container py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/dashboard/dashboard" className="text-xl font-bold flex items-center">
          <span className="mr-2 text-[#faa631]">Yukz</span>
          <span className="text-sm font-normal hidden sm:inline">Rastreamento</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated && (
            <>
              <Link href="/dashboard/dashboard" className="hover:text-[#faa631] flex items-center">
                <BarChart className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
              <Link href="/dashboard/map" className="hover:text-[#faa631] flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Mapa
              </Link>
              <Link href="/dashboard/alerts" className="hover:text-[#faa631] flex items-center">
                <Bell className="w-4 h-4 mr-1" />
                Alertas
              </Link>
              <Link href="/dashboard/settings" className="hover:text-[#faa631] flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Configurações
              </Link>
            </>
          )}
        </nav>

        {/* User Info & Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              <span className="flex items-center text-sm bg-[#007db8]/30 px-3 py-1 rounded-full">
                <User className="w-4 h-4 mr-1" />
                {user.name || user.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center px-3 py-1 bg-[#faa631] hover:bg-[#d69028] rounded transition duration-300 text-sm"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-[#faa631] transition-colors">Login</Link>
              <Link href="/register" className="px-3 py-1 bg-[#faa631] hover:bg-[#d69028] rounded transition duration-300 text-sm">Registrar</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu" className="text-white">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#00315c] border-t border-[#007db8]/30 py-4">
          <div className="yukz-container flex flex-col space-y-4">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard/dashboard" 
                  className="flex items-center px-4 py-2 hover:bg-[#007db8]/20 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <BarChart className="w-5 h-5 mr-3" />
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/map" 
                  className="flex items-center px-4 py-2 hover:bg-[#007db8]/20 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MapPin className="w-5 h-5 mr-3" />
                  Mapa
                </Link>
                <Link 
                  href="/dashboard/alerts" 
                  className="flex items-center px-4 py-2 hover:bg-[#007db8]/20 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Bell className="w-5 h-5 mr-3" />
                  Alertas
                </Link>
                <Link 
                  href="/dashboard/settings" 
                  className="flex items-center px-4 py-2 hover:bg-[#007db8]/20 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Configurações
                </Link>
                <div className="border-t border-[#007db8]/30 pt-4 mt-2">
                  <div className="flex items-center px-4 py-2 text-sm">
                    <User className="w-5 h-5 mr-3" />
                    {user?.name || user?.email}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-left text-[#faa631] hover:bg-[#007db8]/20 rounded-md"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="flex items-center px-4 py-2 hover:bg-[#007db8]/20 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-3" />
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="flex items-center px-4 py-2 bg-[#faa631] text-white rounded-md mx-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Registrar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

