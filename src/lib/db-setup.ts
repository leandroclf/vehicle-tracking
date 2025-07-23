'use client';

import { supabase } from '@/lib/supabase';

// Função para verificar se a tabela existe
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // Usar uma consulta mais segura para verificar a existência da tabela
    const { data, error } = await supabase.rpc('check_table_exists', {
      table_name: tableName
    });
    
    if (error) {
      // Se a função RPC não existir, usar método alternativo
      if (error.message?.includes('function check_table_exists')) {
        return await checkTableExistsAlternative(tableName);
      }
      console.error(`Erro ao verificar tabela ${tableName}:`, error);
      return false;
    }
    
    console.log(`Tabela ${tableName} ${data ? 'existe' : 'não existe'}`);
    return Boolean(data);
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return await checkTableExistsAlternative(tableName);
  }
}

// Método alternativo para verificar se a tabela existe
async function checkTableExistsAlternative(tableName: string): Promise<boolean> {
  try {
    // Tentar uma consulta simples com count para verificar se a tabela existe
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
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
    
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      `
    });
    
    if (error) {
      console.error('Erro ao criar tabela notifications:', error);
      return false;
    }
    
    console.log('Tabela notifications criada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao criar tabela notifications:', error);
    return false;
  }
}

// Função para criar tabela de alertas
export async function createAlertsTable() {
  try {
    const exists = await checkTableExists('alerts');
    if (exists) return true;
    
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS alerts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          vehicle_id UUID NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP WITH TIME ZONE,
          CONSTRAINT fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
        CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
      `
    });
    
    if (error) {
      console.error('Erro ao criar tabela alerts:', error);
      return false;
    }
    
    console.log('Tabela alerts criada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao criar tabela alerts:', error);
    return false;
  }
}

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  console.log('Inicializando banco de dados...');
  
  try {
    // Verificar se a extensão UUID está disponível
    const { error: uuidError } = await supabase.rpc('execute_sql', {
      sql_query: "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    });
    
    if (uuidError) {
      console.error('Erro ao habilitar extensão uuid-ossp:', uuidError);
    } else {
      console.log('Extensão uuid-ossp habilitada com sucesso');
    }
    
    // Criar tabelas
    await createNotificationsTable();
    await createAlertsTable();
    
    console.log('Inicialização do banco de dados concluída');
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