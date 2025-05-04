"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce, throttle } from './utils';

/**
 * Hook para estado persistente no localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key]);
  
  return [storedValue, setValue];
}

/**
 * Hook para data fetching com caching
 */
export function useCachedFetcher<T>(url: string, options?: RequestInit, cacheDuration = 60000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const cache = useRef<{[key: string]: {data: T, timestamp: number}}>({}); 
  
  useEffect(() => {
    async function fetchData() {
      // Verificar cache
      const cacheKey = `${url}-${JSON.stringify(options)}`;
      const cachedData = cache.current[cacheKey];
      const now = Date.now();
      
      // Se dados em cache e dentro do tempo de validade, use-os
      if (cachedData && now - cachedData.timestamp < cacheDuration) {
        setData(cachedData.data);
        setLoading(false);
        return;
      }
      
      // Caso contrário, busque novos dados
      try {
        setLoading(true);
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json() as T;
        setData(result);
        
        // Atualizar cache
        cache.current[cacheKey] = {
          data: result,
          timestamp: now
        };
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [url, options, cacheDuration]);
  
  return { data, loading, error };
}

/**
 * Hook para debounce de valores
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook para callback com debounce
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  return useMemo(() => debounce(callback, delay), [callback, delay]);
}

/**
 * Hook para callback com throttle
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  return useMemo(() => throttle(callback, limit), [callback, limit]);
} 