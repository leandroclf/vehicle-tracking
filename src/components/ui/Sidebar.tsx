import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  badge?: {
    count: number;
    color: 'red' | 'green' | 'blue' | 'yellow';
  };
  children?: SidebarItemProps[];
}

interface SidebarProps {
  items: SidebarItemProps[];
  logo?: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  footer?: ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  logo,
  collapsed = false,
  onToggleCollapse,
  className = '',
  footer,
}) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpansion = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const badgeColorClass = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500';
      case 'green':
        return 'bg-green-500';
      case 'blue':
        return 'bg-blue-500';
      case 'yellow':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderSidebarItem = (item: SidebarItemProps, isSubmenu = false) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.label];

    return (
      <li key={item.label} className={isSubmenu ? 'pl-4' : ''}>
        {hasChildren ? (
          <div
            className={`flex items-center justify-between cursor-pointer p-2 rounded-md ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => toggleItemExpansion(item.label)}
          >
            <div className="flex items-center">
              <span className="mr-3">{item.icon}</span>
              {!collapsed && (
                <span className="font-medium transition-all duration-200">
                  {item.label}
                </span>
              )}
            </div>
            {!collapsed && (
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        ) : (
          <Link
            href={item.href}
            onClick={item.onClick}
            className={`flex items-center p-2 rounded-md ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {!collapsed && (
              <span className="font-medium transition-all duration-200">
                {item.label}
              </span>
            )}
            {!collapsed && item.badge && (
              <span
                className={`ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full ${badgeColorClass(
                  item.badge.color
                )}`}
              >
                {item.badge.count}
              </span>
            )}
          </Link>
        )}
        {hasChildren && isExpanded && !collapsed && (
          <ul className="mt-1 space-y-1">
            {item.children?.map((child) => renderSidebarItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className={`h-full flex flex-col bg-white border-r shadow-sm ${
        collapsed ? 'w-16' : 'w-64'
      } transition-all duration-300 ${className}`}
    >
      <div className="p-4 flex items-center justify-between border-b">
        {!collapsed ? (
          <div className="flex-1">{logo}</div>
        ) : (
          <div className="w-full flex justify-center">{logo}</div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            <svg
              className={`w-5 h-5 transform ${
                collapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {items.map((item) => renderSidebarItem(item))}
        </ul>
      </div>

      {footer && (
        <div className="border-t p-4">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Sidebar; 