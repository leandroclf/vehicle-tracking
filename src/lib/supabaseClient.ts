import { createClient } from '@supabase/supabase-js';

// Configurações hardcoded para debug
const supabaseUrl = "https://zktyautduranjobylpkb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdHlhdXRkdXJhbmpvYnlscGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NTgyMjYsImV4cCI6MjA2MTMzNDIyNn0.3vw7s9Y2P7prhfTKl6ULQtyZ3SgkPJo7UxX2SfAE4x0";

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Logs para debug
console.log('Cliente Supabase inicializado com URL:', supabaseUrl);
console.log('ANON KEY (primeiros 10 caracteres):', supabaseAnonKey.substring(0, 10) + '...');

// Create a service role client for backend operations if needed
// Desativado para debug
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// export const supabaseAdmin = supabaseServiceKey
//   ? createClient(supabaseUrl, supabaseServiceKey)
//   : null;

