import { getDbPool } from '@/lib/database';

// Helper para operações privilegiadas (usadas em rotas de API no backend)
export const getAdminClient = () => {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('DATABASE_URL não está definida nas variáveis de ambiente');
  }
  
  return pool;
};

// Função auxiliar para verificar e atualizar a estrutura do banco de dados
export const ensureDatabaseStructure = async () => {
  try {
    const pool = getAdminClient();
    
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
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
      } catch (error: any) {
        if (error.message.includes(`relation "${table}" does not exist`)) {
          missingTables.push(table);
        }
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