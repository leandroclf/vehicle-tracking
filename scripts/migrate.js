#!/usr/bin/env node

/**
 * Script para aplicar a migração unificada do banco de dados
 * Executa o arquivo unified_schema.sql para criar/atualizar as tabelas necessárias
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Verificar variáveis de ambiente
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Caminho para o arquivo de migração unificada
const migrationFilePath = path.resolve(__dirname, '..', 'migrations', 'unified_schema.sql');

// Verificar se o arquivo existe
if (!fs.existsSync(migrationFilePath)) {
  console.error(`Erro: Arquivo de migração não encontrado em ${migrationFilePath}`);
  process.exit(1);
}

// Ler o conteúdo do arquivo
const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');

// Dividir o script em comandos SQL separados por ';'
const sqlCommands = migrationSql
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

// Função para executar a migração
async function executeMigration() {
  console.log(`Aplicando ${sqlCommands.length} comandos SQL...`);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i] + ';'; // Adiciona o ponto e vírgula de volta
    
    try {
      const { error } = await supabase.rpc('pg_execute', { query: sql });
      
      if (error) {
        console.warn(`Aviso: Comando ${i+1} falhou: ${error.message.substring(0, 150)}...`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.warn(`Aviso: Erro ao executar comando ${i+1}: ${error.message?.substring(0, 150) || error}`);
      errorCount++;
    }
    
    // Mostrar progresso a cada 10 comandos
    if ((i + 1) % 10 === 0) {
      console.log(`Progresso: ${i + 1}/${sqlCommands.length} comandos processados`);
    }
  }

  console.log('Migração concluída!');
  console.log(`${successCount} comandos executados com sucesso`);
  console.log(`${errorCount} comandos apresentaram erros`);
  
  // Verificar tabelas obrigatórias
  const requiredTables = [
    'profiles', 
    'vehicles', 
    'alerts', 
    'settings', 
    'notifications',
    'geofences'
  ];
  
  const missingTables = [];
  
  console.log('Verificando tabelas obrigatórias...');
  
  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.message.includes(`relation "${table}" does not exist`)) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    console.error(`Erro: As seguintes tabelas não foram criadas: ${missingTables.join(', ')}`);
    process.exit(1);
  } else {
    console.log('Todas as tabelas obrigatórias foram criadas com sucesso!');
  }
}

// Executar a migração
executeMigration()
  .catch(error => {
    console.error('Erro fatal durante a migração:', error);
    process.exit(1);
  }); 