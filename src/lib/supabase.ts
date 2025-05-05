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
    console.log('Instância principal do cliente Supabase criada');
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
    console.log('Instância realtime do cliente Supabase criada');
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
    console.log('Instância admin do cliente Supabase criada');
  }
  return _adminClient;
};

// Exportações para retrocompatibilidade
export const supabase = createClient();
export const supabaseRealtime = createRealtimeClient();
export const supabaseAdmin = createAdminClient();

// Validar conexão com Supabase
const testSupabaseConnection = async () => {
  try {
    // Testa uma operação simples para verificar se a conexão está funcionando
    const { data, error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    
    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('Conexão com Supabase OK, mas tabela profiles não existe (normal para primeira inicialização)');
        return;
      }
      console.error('Erro na conexão com Supabase:', error.message);
      return;
    }
    
    console.log('Conexão com Supabase estabelecida com sucesso');
  } catch (err) {
    console.error('Erro ao testar conexão com Supabase:', err);
  }
};

// Executar o teste se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test' && typeof window !== 'undefined') {
  // Executar teste de conexão após carregamento da página
  setTimeout(testSupabaseConnection, 1000);
} 