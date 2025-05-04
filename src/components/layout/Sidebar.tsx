'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { 
  Home, 
  Map, 
  Truck, 
  MapPin, 
  Bell, 
  FileText, 
  Settings, 
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'; // Using lucide-react icons

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Mapa', href: '/dashboard/map', icon: <Map className="w-5 h-5" /> },
    { name: 'Veículos', href: '/dashboard/vehicles', icon: <Truck className="w-5 h-5" /> },
    { name: 'Geocercas', href: '/dashboard/geofences', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Alertas', href: '/dashboard/alerts', icon: <Bell className="w-5 h-5" /> },
    { name: 'Relatórios', href: '/dashboard/reports', icon: <FileText className="w-5 h-5" /> },
    { name: 'Configurações', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
    { name: 'Perfil', href: '/dashboard/profile', icon: <User className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Mobile Toggle Button - Fixed at bottom */}
      {isMobile && (
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Sidebar - Desktop (left side) or Mobile (bottom sheet) */}
      <aside 
        className={cn(
          "h-full transition-all duration-300",
          isMobile ? 
            "fixed bottom-0 left-0 right-0 z-40 transform bg-white dark:bg-gray-800 shadow-lg rounded-t-xl" : 
            "bg-gray-100 dark:bg-gray-800 min-h-screen shadow-md h-full",
          isMobile && !isMobileMenuOpen ? "translate-y-full" : "translate-y-0",
          !isMobile && collapsed ? "w-16" : isMobile ? "w-full" : "w-64"
        )}
      >
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="absolute right-[-12px] top-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 z-10"
            aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">Menu</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500 dark:text-gray-400"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className={cn("p-6", isMobile && "p-4")}>
          <ul className={cn("space-y-2", isMobile && "grid grid-cols-4 gap-4")}>
            {navItems.map((item) => (
              <li key={item.name} className={isMobile ? 'text-center' : ''}>
                {collapsed && !isMobile ? (
                  <Tooltip content={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg transition-all duration-200",
                        isActive(item.href) 
                          ? "bg-blue-600 text-white" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                      aria-label={item.name}
                    >
                      {item.icon}
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center p-2 rounded-lg transition-all duration-200",
                      isActive(item.href) 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                      isMobile ? "flex-col text-xs" : "space-x-3"
                    )}
                  >
                    {item.icon}
                    <span className={isMobile ? "mt-1" : ""}>{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
