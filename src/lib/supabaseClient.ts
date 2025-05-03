import { createClient } from '@supabase/supabase-js';

// Obtendo variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
}

// Criar cliente Supabase padrão
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Criar cliente admin com service role
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Logs para debug
console.log('Cliente Supabase inicializado com URL:', supabaseUrl);
console.log('ANON KEY (primeiros 10 caracteres):', supabaseAnonKey.substring(0, 10) + '...');
console.log('SERVICE KEY configurada:', supabaseServiceKey ? 'Sim' : 'Não');

// Create a service role client for backend operations if needed
// Desativado para debug
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// export const supabaseAdmin = supabaseServiceKey
//   ? createClient(supabaseUrl, supabaseServiceKey)
//   : null;

