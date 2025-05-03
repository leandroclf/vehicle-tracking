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
    
    // Verificar se as tabelas principais existem consultando cada uma delas
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
    
    let missingTables = [];
    
    // Tentamos consultar cada tabela para verificar se existe
    for (const table of requiredTables) {
      const { error } = await admin.from(table).select('count(*)').limit(1);
      if (error && error.message.includes(`relation "${table}" does not exist`)) {
        missingTables.push(table);
      }
    }
    
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