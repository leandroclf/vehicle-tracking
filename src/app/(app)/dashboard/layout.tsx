'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { LazyLoading } from '@/lib/lazy';
import DashboardLoading from '@/components/ui/DashboardLoading';
import PrefetchLinks from '@/components/dashboard/PrefetchLinks';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { VehicleProvider } from '@/lib/vehicles-client';
import PanelLayout from '@/components/dashboard/PanelLayout';
import { AlertProvider } from '@/lib/alerts';
import { ReportProvider } from '@/lib/reports';
import { useSidebar } from '@/lib/sidebar-context';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Removendo importações redundantes
// import Header from '@/components/layout/Header';
// import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/navigation/BottomNav';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

const Sidebar = React.lazy(() => import('@/components/layout/Sidebar'));
const Header = React.lazy(() => import('@/components/layout/Header'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { isSidebarCollapsed, toggleSidebar, isMobile } = useSidebar();
  const mainLayoutRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar scroll para ajustar cabeçalho em dispositivos móveis
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cabeçalho fixo */}
      <Header 
        onToggleSidebar={toggleSidebar} 
        className={`fixed top-0 w-full z-30 transition-shadow ${
          isScrolled ? 'shadow-md' : ''
        }`} 
      />
      
      <div className="flex flex-1 pt-16">
        {/* Sidebar para desktop */}
        <div
          className={`hidden sm:block h-[calc(100vh-4rem)] sticky top-16 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          } transition-all duration-300`}
        >
          <Sidebar />
        </div>
        
        {/* Conteúdo principal - adapta-se à largura total em dispositivos móveis */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto"
          style={{ 
            minHeight: 'calc(100vh - 4rem)',
            marginBottom: isMobile ? '4rem' : '0'
          }}
        >
          <div className={`${isMobile ? 'pb-16' : ''}`}>
            <Suspense fallback={<DashboardLoading />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
      
      {/* Menu mobile fullscreen */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 animate-fade-in">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full"
                aria-label="Fechar menu"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <Sidebar className="w-full" />
            </div>
          </div>
        </div>
      )}
      
      {/* Navegação inferior para mobile */}
      {isMobile && (
        <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
      )}
      
      {/* Contêiner de notificações toast */}
      <ToastContainer 
        position={isMobile ? "top-center" : "bottom-right"}
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <VehicleProvider>
      <AlertProvider>
        <ReportProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </ReportProvider>
      </AlertProvider>
    </VehicleProvider>
  );
}