import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from './supabaseClient';

// Reexportando o cliente supabase tipado
export { supabase };

// Helper para operações privilegiadas (usadas em rotas de API no backend)
export const getAdminClient = () => {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida nas variáveis de ambiente');
  }
  
  return supabaseAdmin;
};

// Função auxiliar para verificar e atualizar a estrutura do banco de dados
export const ensureDatabaseStructure = async () => {
  try {
    const admin = getAdminClient();
    
    // Verificar se as tabelas principais existem
    const { data: tablesList, error: tablesError } = await admin.from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Erro ao verificar tabelas:', tablesError);
      return false;
    }
    
    const requiredTables = [
      'profiles', 
      'vehicles', 
      'vehicle_status', 
      'trips', 
      'events', 
      'alerts', 
      'settings', 
      'geofences'
    ];
    
    const missingTables = requiredTables.filter(
      table => !tablesList?.some(t => t.table_name === table)
    );
    
    if (missingTables.length > 0) {
      console.warn(`Tabelas faltantes: ${missingTables.join(', ')}`);
      return false;
    }
    
    console.log('Todas as tabelas necessárias estão configuradas');
    return true;
  } catch (error) {
    console.error('Erro ao verificar estrutura do banco de dados:', error);
    return false;
  }
};