'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  X
} from 'lucide-react'; // Using lucide-react icons

export default function Sidebar() {
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
    { name: 'Dashboard', href: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Mapa', href: '/map', icon: <Map className="w-5 h-5" /> },
    { name: 'Veículos', href: '/vehicles', icon: <Truck className="w-5 h-5" /> },
    { name: 'Geocercas', href: '/geofences', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Alertas', href: '/alerts', icon: <Bell className="w-5 h-5" /> },
    { name: 'Relatórios', href: '/reports', icon: <FileText className="w-5 h-5" /> },
    { name: 'Configurações', href: '/settings', icon: <Settings className="w-5 h-5" /> },
    { name: 'Perfil', href: '/profile', icon: <User className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Mobile Toggle Button - Fixed at bottom */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar - Desktop (left side) or Mobile (bottom sheet) */}
      <aside 
        className={`
          ${isMobile ? 'fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 ease-in-out bg-white shadow-lg rounded-t-xl' : 'bg-gray-100 w-64 min-h-screen shadow-md'} 
          ${isMobile && !isMobileMenuOpen ? 'translate-y-full' : 'translate-y-0'}
        `}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <ul className={`space-y-2 ${isMobile ? 'grid grid-cols-4 gap-4' : ''}`}>
            {navItems.map((item) => (
              <li key={item.name} className={isMobile ? 'text-center' : ''}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center p-2 rounded-lg transition-colors duration-200
                    ${isActive(item.href) 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'}
                    ${isMobile ? 'flex-col text-xs' : 'space-x-3'}
                  `}
                >
                  {item.icon}
                  <span className={isMobile ? 'mt-1' : ''}>{item.name}</span>
                </Link>
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
