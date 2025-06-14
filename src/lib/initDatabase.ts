import { getAdminClient } from './databaseConfig';
import fs from 'fs';
import path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Inicializa o banco de dados aplicando as migrações necessárias
 */
export async function initializeDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    const admin = getAdminClient();
    
    // Verificar se as tabelas principais existem
    console.log('Verificando estado atual do banco de dados...');
    const requiredTables = [
      'profiles', 
      'vehicles', 
      'alerts', 
      'settings', 
      'notifications',
      'geofences'
    ];
    
    // Verificamos se pelo menos uma das tabelas principais já existe
    const { data, error } = await admin.from('profiles').select('id').limit(1);
    const tablesExist = !error;
    
    if (tablesExist) {
      console.log('Banco de dados já inicializado');
      
      // Verificar se há tabelas faltando
      const missingTables = await checkMissingTables(admin, requiredTables);
      
      if (missingTables.length > 0) {
        console.log(`Tabelas faltantes detectadas: ${missingTables.join(', ')}`);
        await applyMigration(admin);
      }
      
      return true;
    }
    
    // Aplicar o script de migração unificado
    console.log('Aplicando migração unificada...');
    await applyMigration(admin);
    
    console.log('Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Falha ao inicializar o banco de dados:', error);
    throw error;
  }
}

/**
 * Verifica quais tabelas estão faltando no banco de dados
 */
async function checkMissingTables(admin: SupabaseClient, tables: string[]): Promise<string[]> {
  const missingTables = [];
  
  for (const table of tables) {
    const { error } = await admin.from(table).select('id').limit(1);
    if (error && error.message.includes(`relation "${table}" does not exist`)) {
      missingTables.push(table);
    }
  }
  
  return missingTables;
}

/**
 * Aplica a migração usando o arquivo unificado
 */
async function applyMigration(admin: SupabaseClient) {
  try {
    // Define os possíveis caminhos para o arquivo de migração (desenvolvimento e produção)
    const migrationFile = 'unified_schema.sql';
    const possiblePaths = [
      path.join(process.cwd(), 'migrations', migrationFile),
      path.resolve(__dirname, '../..', 'migrations', migrationFile),
      path.resolve(__dirname, '../../..', 'migrations', migrationFile)
    ];
    
    let migrationPath = '';
    
    // Tenta encontrar o arquivo em um dos possíveis caminhos
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        migrationPath = possiblePath;
        console.log(`Arquivo de migração encontrado em: ${migrationPath}`);
        break;
      }
    }
    
    if (!migrationPath) {
      throw new Error('Arquivo de migração unificada não encontrado');
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir o script em comandos SQL separados por ';'
    const sqlCommands = migrationSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`Aplicando ${sqlCommands.length} comandos SQL...`);
    
    // Executa cada comando separadamente
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i] + ';'; // Adiciona o ponto e vírgula de volta
      
      try {
        const { error } = await admin.rpc('pg_execute', { query: sql });
        
        if (error) {
          console.warn(`Aviso: Comando ${i+1} falhou: ${error.message.substring(0, 100)}...`);
        }
      } catch (cmdError: unknown) {
        const errorMessage = cmdError instanceof Error ? cmdError.message : String(cmdError);
        console.warn(`Aviso: Erro ao executar comando ${i+1}: ${errorMessage.substring(0, 100)}...`);
      }
    }
    
    // Verificação final
    const requiredTables = ['profiles', 'vehicles', 'alerts', 'settings', 'notifications', 'geofences'];
    const missingTables = await checkMissingTables(admin, requiredTables);
    
    if (missingTables.length > 0) {
      throw new Error(`Algumas tabelas não foram criadas: ${missingTables.join(', ')}`);
    }
    
    console.log('Migração aplicada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro durante aplicação da migração:', error);
    throw error;
  }
}