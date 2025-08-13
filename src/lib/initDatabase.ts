import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Inicializa o banco de dados aplicando as migrações necessárias
 */
export async function initializeDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
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
    try {
      await db.execute(sql`SELECT 1 FROM profiles LIMIT 1`);
      console.log('Banco de dados já inicializado');
      
      // Verificar se há tabelas faltando
      const missingTables = await checkMissingTables(requiredTables);
      
      if (missingTables.length > 0) {
        console.log(`Tabelas faltantes detectadas: ${missingTables.join(', ')}`);
        await applyMigration();
      }
      
      return true;
    } catch (error) {
      // Tabela não existe, aplicar migração
      console.log('Aplicando migração unificada...');
      await applyMigration();
    }
    
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
async function checkMissingTables(tables: string[]): Promise<string[]> {
  const missingTables = [];
  
  for (const table of tables) {
    try {
      await db.execute(sql.raw(`SELECT 1 FROM ${table} LIMIT 1`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes(`relation "${table}" does not exist`)) {
        missingTables.push(table);
      }
    }
  }
  
  return missingTables;
}

/**
 * Aplica a migração usando o arquivo unificado
 */
async function applyMigration() {
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
      const sqlCommand = sqlCommands[i] + ';'; // Adiciona o ponto e vírgula de volta
      
      try {
        await db.execute(sql.raw(sqlCommand));
      } catch (cmdError: unknown) {
        const errorMessage = cmdError instanceof Error ? cmdError.message : String(cmdError);
        console.warn(`Aviso: Erro ao executar comando ${i+1}: ${errorMessage.substring(0, 100)}...`);
      }
    }
    
    // Verificação final
    const requiredTables = ['profiles', 'vehicles', 'alerts', 'settings', 'notifications', 'geofences'];
    const missingTables = await checkMissingTables(requiredTables);
    
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