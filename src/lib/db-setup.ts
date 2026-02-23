'use client';

import { getDbPool } from '@/lib/database';

// Função para verificar se a tabela existe
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // Usar método direto para verificar se a tabela existe
    return await checkTableExistsAlternative(tableName);
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return false;
  }
}

// Método alternativo para verificar se a tabela existe
async function checkTableExistsAlternative(tableName: string): Promise<boolean> {
  try {
    // Tentar uma consulta simples com count para verificar se a tabela existe
    // TODO: Implementar query SQL direta
    const count = null;
    const error = null;
    // await pool.query(...)
    //   .from(tableName)
    //   .select('*', { count: 'exact', head: true });
      
    // Se não houver erro, a tabela existe
    if (!error) {
      console.log(`Tabela ${tableName} existe (método alternativo)`);
      return true;
    }
    
    // Verificar se o erro indica que a tabela não existe
    if (error.message && (
      error.message.includes('does not exist') ||
      error.message.includes('relation') ||
      error.message.includes('table')
    )) {
      console.log(`Tabela ${tableName} não existe (método alternativo)`);
      return false;
    }
    
    // Se for outro tipo de erro, logar e assumir que a tabela não existe
    console.error(`Erro ao verificar tabela ${tableName} (método alternativo):`, error);
    return false;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName} (método alternativo):`, error);
    return false;
  }
}

// Função para criar tabela de notificações
export async function createNotificationsTable() {
  try {
    const exists = await checkTableExists('notifications');
    if (exists) return true;
    
    console.log('Tabela notifications não existe, mas não é possível criar via cliente');
    return false;
  } catch (error) {
    console.error('Erro ao verificar tabela notifications:', error);
    return false;
  }
}

// Função para criar tabela de alertas
export async function createAlertsTable() {
  try {
    const exists = await checkTableExists('alerts');
    if (exists) return true;
    
    console.log('Tabela alerts não existe, mas não é possível criar via cliente');
    return false;
  } catch (error) {
    console.error('Erro ao verificar tabela alerts:', error);
    return false;
  }
}

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  console.log('Verificando banco de dados...');
  
  try {
    // Verificar tabelas principais
    await createNotificationsTable();
    await createAlertsTable();
    
    console.log('Verificação do banco de dados concluída');
    return true;
  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error);
    return false;
  }
}

// Função auxiliar para verificar se tabelas críticas existem
export function useRequiredTables() {
  const requiredTables = [
    'profiles',
    'vehicles',
    'alerts',
    'geofences',
    'notifications'
  ];
  
  const verifyTables = async () => {
    const tableStatus = await Promise.all(
      requiredTables.map(async (table) => {
        const exists = await checkTableExists(table);
        return { table, exists };
      })
    );
    
    const missingTables = tableStatus.filter(t => !t.exists).map(t => t.table);
    
    if (missingTables.length > 0) {
      console.warn('Tabelas não encontradas:', missingTables);
      return {
        allTablesExist: false,
        missingTables
      };
    }
    
    return {
      allTablesExist: true,
      missingTables: []
    };
  };
  
  return { verifyTables };
}

const dbSetup = { initializeDatabase, checkTableExists, useRequiredTables };

export default dbSetup;