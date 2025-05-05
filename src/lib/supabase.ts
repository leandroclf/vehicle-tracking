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

// Cliente padrão compartilhado
let _supabaseClient: SupabaseClient | null = null;

// Cliente com realtime compartilhado
let _realtimeClient: SupabaseClient | null = null;

// Cliente admin compartilhado
let _adminClient: SupabaseClient | null = null;

/**
 * Retorna um cliente Supabase compartilhado 
 */
export const createClient = (options = {}): SupabaseClient => {
  if (!_supabaseClient) {
    _supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      ...defaultOptions,
      ...options
    });
  }
  return _supabaseClient;
};

/**
 * Retorna um cliente Supabase com suporte a realtime
 */
export const createRealtimeClient = (options = {}): SupabaseClient => {
  if (!_realtimeClient) {
    _realtimeClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      ...realtimeOptions,
      ...options
    });
  }
  return _realtimeClient;
};

/**
 * Retorna um cliente Supabase com permissões administrativas
 */
export const createAdminClient = (options = {}): SupabaseClient | null => {
  if (supabaseServiceKey && !_adminClient) {
    _adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      ...adminOptions,
      ...options
    });
  }
  return _adminClient;
};

// Exportações para retrocompatibilidade
export const supabase = createClient();
export const supabaseRealtime = createRealtimeClient();
export const supabaseAdmin = createAdminClient(); 