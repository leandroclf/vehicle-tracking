'use client';

import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Cliente para o usuário normal
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para verificar se a tabela existe
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .maybeSingle();
    
    if (error) {
      console.error(`Erro ao verificar tabela ${tableName}:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return false;
  }
}

// Função para verificar e criar a tabela de notificações se não existir
export async function ensureNotificationsTable() {
  try {
    const exists = await checkTableExists('notifications');
    
    if (exists) {
      console.log('Tabela de notificações já existe');
      return true;
    }
    
    console.log('Criando tabela de notificações...');
    
    // Usar RPC para criar a tabela, já que o Supabase não permite criar tabelas diretamente pela API
    const { error } = await supabaseAdmin().rpc('create_notifications_table');
    
    if (error) {
      console.error('Erro ao criar tabela de notificações:', error);
      return false;
    }
    
    console.log('Tabela de notificações criada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar tabela de notificações:', error);
    return false;
  }
}

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    console.log('Verificando estrutura do banco de dados...');
    
    // Verificar e criar tabelas essenciais
    await ensureNotificationsTable();
    
    console.log('Verificação de banco de dados concluída');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
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

export default { initializeDatabase, checkTableExists, useRequiredTables }; 