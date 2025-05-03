'use client';

import { lazy, Suspense, ComponentType } from 'react';

export interface LazyLoadingProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyLoading({ children, fallback = null }: LazyLoadingProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback: React.ReactNode = null
) {
  const LazyComponent = lazy(factory);
  
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <LazyLoading fallback={fallback}>
        <LazyComponent {...props} />
      </LazyLoading>
    );
  };
} 