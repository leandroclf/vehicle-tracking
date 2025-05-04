/**
 * Utilitário para armazenamento local persistente
 */

/**
 * Salva um valor no armazenamento local
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined') {
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
      localStorage.setItem(`yukz-${key}`, valueToStore);
    }
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
}

/**
 * Recupera um valor do armazenamento local
 */
export function getFromStorage<T>(key: string, defaultValue?: T): T | undefined {
  try {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(`yukz-${key}`);
      if (!storedValue) return defaultValue;
      
      try {
        // Tenta fazer parse como JSON
        return JSON.parse(storedValue) as T;
      } catch {
        // Se não for JSON, retorna como string ou o valor original
        return storedValue as unknown as T;
      }
    }
    return defaultValue;
  } catch (error) {
    console.error('Erro ao ler do localStorage:', error);
    return defaultValue;
  }
}

/**
 * Remove um valor do armazenamento local
 */
export function removeFromStorage(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`yukz-${key}`);
    }
  } catch (error) {
    console.error('Erro ao remover do localStorage:', error);
  }
}

/**
 * Verifica se um valor existe no armazenamento local
 */
export function existsInStorage(key: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`yukz-${key}`) !== null;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar existência no localStorage:', error);
    return false;
  }
}

/**
 * Limpa todas as entradas de armazenamento da aplicação
 */
export function clearAppStorage(): void {
  try {
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      
      // Identificar todas as chaves da aplicação
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('yukz-')) {
          keysToRemove.push(key);
        }
      }
      
      // Remover cada chave
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.error('Erro ao limpar localStorage da aplicação:', error);
  }
} 