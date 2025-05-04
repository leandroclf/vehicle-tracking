import React, { ReactNode, useState } from 'react';
import Link from 'next/link';

interface NavbarItemProps {
  href: string;
  label: string;
  active?: boolean;
  dropdownItems?: {
    href: string;
    label: string;
  }[];
}

interface NavbarProps {
  logo?: ReactNode;
  items?: NavbarItemProps[];
  rightContent?: ReactNode;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
  mobileMenuBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Navbar: React.FC<NavbarProps> = ({
  logo,
  items = [],
  rightContent,
  sticky = false,
  transparent = false,
  className = '',
  mobileMenuBreakpoint = 'lg',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const breakpointClass = `${mobileMenuBreakpoint}:flex`;

  return (
    <nav
      className={`w-full bg-background border-b border-border ${
        sticky ? 'sticky top-0 z-10' : ''
      } ${transparent ? 'bg-transparent' : ''} ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {logo}
            </div>
          </div>
          
          <div className={`hidden ${breakpointClass} items-center`}>
            <div className="ml-10 flex items-baseline space-x-4">
              {items.map((item) => (
                <div key={item.label} className="relative">
                  {item.dropdownItems ? (
                    <>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          item.active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {item.label}
                        <svg
                          className={`ml-1 w-4 h-4 transition-transform ${
                            openDropdown === item.label ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {openDropdown === item.label && (
                        <div className="absolute z-10 mt-2 w-48 origin-top-right rounded-md bg-background border border-border py-1 shadow-lg">
                          {item.dropdownItems.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.label}
                              href={dropdownItem.href}
                              className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        item.active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {rightContent && (
            <div className={`hidden ${breakpointClass} items-center`}>
              {rightContent}
            </div>
          )}
          
          <div className={`${breakpointClass.replace('flex', 'hidden')} items-center`}>
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
            >
              <span className="sr-only">Abrir menu principal</span>
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className={`${breakpointClass.replace('flex', 'block')} md:hidden`}>
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {items.map((item) => (
              <React.Fragment key={item.label}>
                {item.dropdownItems ? (
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`w-full flex justify-between items-center px-3 py-2 text-base font-medium rounded-md ${
                        item.active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {item.label}
                      <svg
                        className={`ml-1 w-4 h-4 transition-transform ${
                          openDropdown === item.label ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {openDropdown === item.label && (
                      <div className="mt-2 pl-4 space-y-1">
                        {item.dropdownItems.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            className="block px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                            onClick={() => {
                              setOpenDropdown(null);
                              setMobileMenuOpen(false);
                            }}
                          >
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 text-base font-medium rounded-md ${
                      item.active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
          {rightContent && (
            <div className="border-t border-border pt-4 pb-3">
              <div className="px-2">{rightContent}</div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 