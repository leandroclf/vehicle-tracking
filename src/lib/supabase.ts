import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Variável para armazenar a instância única do cliente Supabase
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  // Se já existe uma instância, retorná-la
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Variáveis de ambiente do Supabase não configuradas corretamente');
  }
  
  // Criar uma nova instância apenas se não existir
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
} 