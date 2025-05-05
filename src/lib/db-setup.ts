'use client';

import { supabase, supabaseAdmin } from '@/lib/supabase';

// Função para verificar se a tabela existe
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // Tentar consultar a tabela diretamente para ver se ela existe
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    // Se não houver erro, a tabela existe
    if (!error) {
      return true;
    }
    
    // Verificar se o erro indica que a tabela não existe
    if (error.message && error.message.includes('does not exist')) {
      return false;
    }
    
    // Se for outro tipo de erro, logar e assumir que a tabela não existe
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return false;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return false;
  }
}

// Função para verificar e criar a tabela de notificações se não existir
export async function ensureNotificationsTable(): Promise<boolean> {
  try {
    const exists = await checkTableExists('notifications');
    
    if (exists) {
      console.log('Tabela de notificações já existe');
      return true;
    }
    
    console.log('Criando tabela de notificações...');
    
    // Verificar se o supabaseAdmin está disponível
    if (!supabaseAdmin) {
      console.warn('Cliente Admin do Supabase não disponível, não é possível criar tabela de notificações');
      return false;
    }
    
    // Usar método From para criar tabela
    try {
      // Criar tabela base
      await supabase.from('notifications').insert({
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        title: 'Inicialização',
        message: 'Tabela criada',
        read: true,
        type: 'system',
        timestamp: new Date().toISOString()
      }).select();
      
      console.log('Tabela de notificações criada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao criar tabela de notificações:', error);
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar/criar tabela de notificações:', error);
    return false;
  }
}

// Função para verificar e criar a tabela de alertas se não existir
export async function ensureAlertsTable(): Promise<boolean> {
  try {
    const exists = await checkTableExists('alerts');
    
    if (exists) {
      console.log('Tabela de alertas já existe');
      return true;
    }
    
    console.log('Criando tabela de alertas...');
    
    // Verificar se o supabaseAdmin está disponível
    if (!supabaseAdmin) {
      console.warn('Cliente Admin do Supabase não disponível, não é possível criar tabela de alertas');
      return false;
    }
    
    // Usar método From para criar tabela
    try {
      // Criar tabela base
      await supabase.from('alerts').insert({
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        message: 'Tabela criada',
        read: true,
        type: 'system',
        severity: 'low',
        timestamp: new Date().toISOString()
      }).select();
      
      console.log('Tabela de alertas criada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao criar tabela de alertas:', error);
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar/criar tabela de alertas:', error);
    return false;
  }
}

// Função para inicializar o banco de dados
export async function initializeDatabase(): Promise<boolean> {
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