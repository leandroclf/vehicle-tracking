'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for TabsContext
interface TabsContextType {
  value: string;
  onChange: (value: string) => void;
}

// Create context for tabs
const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Custom hook to use the tabs context
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within a Tabs component');
  }
  return context;
}

// Main Tabs component
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export default function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
}: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(value || defaultValue || '');

  useEffect(() => {
    if (value !== undefined) {
      setSelectedTab(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setSelectedTab(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: selectedTab, onChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// TabsList component
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`flex ${className}`}>
      {children}
    </div>
  );
}

// TabsTrigger component
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const { value: selectedValue, onChange } = useTabsContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      className={`px-4 py-2 text-sm font-medium ${
        isSelected
          ? 'border-b-2 border-blue-500 text-blue-600'
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${className}`}
      onClick={() => onChange(value)}
    >
      {children}
    </button>
  );
}

// TabsContent component
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return <div className={className}>{children}</div>;
}