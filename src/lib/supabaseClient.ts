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
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Logs para debug
console.log('Cliente Supabase inicializado com URL:', supabaseUrl);
console.log('ANON KEY (primeiros 10 caracteres):', supabaseAnonKey.substring(0, 10) + '...');
console.log('SERVICE KEY configurada:', supabaseServiceKey ? 'Sim' : 'Não');

// Verificar conectividade com Supabase
async function testSupabaseConnection() {
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
}

// Executar o teste se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  testSupabaseConnection();
}

// Create a service role client for backend operations if needed
// Desativado para debug
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// export const supabaseAdmin = supabaseServiceKey
//   ? createClient(supabaseUrl, supabaseServiceKey)
//   : null;

