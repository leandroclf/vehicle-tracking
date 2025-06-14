import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Obtenção de variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Opções para cliente padrão
const defaultOptions = {};

// Opções para cliente com realtime
const realtimeOptions = {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Opções para cliente admin
const adminOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

// Tipagem para as instâncias no globalThis
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __realtimeClient: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __adminClient: SupabaseClient | undefined | null;
}

const getSupabaseInstance = <T extends SupabaseClient | null | undefined>(
  name: '__supabaseClient' | '__realtimeClient' | '__adminClient',
  createFn: () => T
): T => {
  if (process.env.NODE_ENV === 'production') {
    if (!globalThis[name]) {
      globalThis[name] = createFn();
    }
  } else {
    // Em desenvolvimento, sempre recriamos ou pegamos do global para evitar problemas com HMR
    // mas a lógica de singleton dentro das createFn ainda se aplica se a instância global já existir.
    if (!globalThis[name]) {
      globalThis[name] = createFn();
    }
  }
  return globalThis[name] as T;
};

/**
 * Retorna um cliente Supabase compartilhado 
 */
export const createClient = (options = {}): SupabaseClient => {
  return getSupabaseInstance('__supabaseClient', () => {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      ...defaultOptions,
      ...options
    });
    console.log('Instância principal do cliente Supabase criada');
    return client;
  }) as SupabaseClient;
};

/**
 * Retorna um cliente Supabase com suporte a realtime
 */
export const createRealtimeClient = (options = {}): SupabaseClient => {
  return getSupabaseInstance('__realtimeClient', () => {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      ...realtimeOptions,
      ...options
    });
    console.log('Instância realtime do cliente Supabase criada');
    return client;
  }) as SupabaseClient;
};

/**
 * Retorna um cliente Supabase com permissões administrativas
 */
export const createAdminClient = (options = {}): SupabaseClient | null => {
  return getSupabaseInstance('__adminClient', () => {
    if (supabaseServiceKey) {
      const client = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        ...adminOptions,
        ...options
      });
      console.log('Instância admin do cliente Supabase criada');
      return client;
    }
    return null;
  });
};

// Exportações para retrocompatibilidade
export const supabase = createClient();
export const supabaseRealtime = createRealtimeClient();
export const supabaseAdmin = createAdminClient();