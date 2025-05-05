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
    // Usando rpc para verificar se a tabela existe
    const { data, error } = await supabase
      .rpc('table_exists', { table_name: tableName })
      .single();
    
    if (error) {
      console.error(`Erro ao verificar tabela ${tableName}:`, error);
      
      // Alternativa: tentar consultar a tabela diretamente para ver se ela existe
      try {
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        // Se conseguir consultar a tabela sem erros, ela existe
        if (!testError) {
          return true;
        }
        
        // Se o erro for diferente de "tabela não existe", logar o erro
        if (!testError.message.includes('does not exist')) {
          console.error(`Erro ao testar consulta na tabela ${tableName}:`, testError);
        }
        
        return false;
      } catch (testErr) {
        return false;
      }
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

// Função para verificar e criar a tabela de alertas se não existir
export async function ensureAlertsTable() {
  try {
    const exists = await checkTableExists('alerts');
    
    if (exists) {
      console.log('Tabela de alertas já existe');
      return true;
    }
    
    console.log('Criando tabela de alertas...');
    
    // Usar RPC para criar a tabela
    const { error } = await supabaseAdmin().rpc('create_alerts_table');
    
    if (error) {
      console.error('Erro ao criar tabela de alertas:', error);
      return false;
    }
    
    console.log('Tabela de alertas criada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar tabela de alertas:', error);
    return false;
  }
}

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    console.log('Verificando estrutura do banco de dados...');
    
    // Verificar e criar tabelas essenciais
    await ensureNotificationsTable();
    await ensureAlertsTable();
    
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