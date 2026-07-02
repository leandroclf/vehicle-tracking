"use client";

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

/**
 * Combina classes CSS de forma condicional utilizando clsx e tailwind-merge
 * Útil para componentes que precisam combinar classes estáticas, dinâmicas e condicionais
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date time to a readable string
 */
export function formatDateTime(date: Date | string) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format a currency value
 */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Safely access nested object properties
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = undefined) {
  const keys = path.split('.');
  return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : defaultValue, obj);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let lastCall = 0;
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    if (now - lastCall < limit) return undefined;
    
    lastCall = now;
    return func.apply(this, args);
  } as T;
}

/**
 * Trunca um texto para o tamanho especificado e adiciona reticências se necessário
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Gera um ID único baseado em timestamp e número aleatório
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Salva um valor no localStorage com suporte a objetos
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
}

/**
 * Recupera um valor do localStorage com suporte a objetos
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erro ao recuperar do localStorage:', error);
    return defaultValue;
  }
}

/**
 * Função para compor refs de forma segura, evitando loops de atualização
 * Baseada na implementação do @radix-ui/react-compose-refs, mas com proteção contra loops
 */
export function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  // Variável para rastrear se já estamos no meio de uma atualização
  let isUpdating = false;
  // Último nó atribuído, para evitar atualizações redundantes
  let lastNode: T | null = null;
  
  return (node: T) => {
    // Se o nó for igual ao último processado, evitar reprocessamento
    if (node === lastNode) return;
    
    // Prevenir chamadas recursivas durante uma atualização
    if (isUpdating) return;
    
    // Filtrar refs nulos ou undefined
    const validRefs = refs.filter(Boolean);
    
    // Se não houver refs válidos, não fazer nada
    if (validRefs.length === 0) return;
    
    try {
      isUpdating = true;
      lastNode = node;
      
      // Aplicar cada ref com segurança
      validRefs.forEach((ref) => {
        if (typeof ref === 'function') {
          // Chamar funções de ref diretamente
          ref(node);
        } else if (ref && typeof ref === 'object') {
          // Atribuir o node apenas se for diferente para evitar loops
          const mutableRef = ref as React.MutableRefObject<T>;
          if (mutableRef.current !== node) {
            mutableRef.current = node;
          }
        }
      });
    } finally {
      isUpdating = false;
    }
  };
}

// Sobrescrever a implementação do Radix para componentes que a usem diretamente
if (typeof window !== 'undefined') {
  // @ts-ignore - Sobrescrever módulo global para interceptar chamadas diretas
  window.__RADIX_COMPOSE_REFS__ = {
    composeRefs: composeRefs,
    useComposedRefs: function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return React.useCallback(composeRefs(...refs), refs);
    }
  };
} 
