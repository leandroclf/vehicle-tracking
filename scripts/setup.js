#!/usr/bin/env node

/**
 * Script de configuração inicial do projeto
 * Configura o banco de dados e executa as migrações necessárias
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[SETUP] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log('Arquivo .env não encontrado. Copiando .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    log('Arquivo .env criado. Por favor, configure as variáveis de ambiente antes de continuar.');
    process.exit(1);
  }
}

function runCommand(command, description) {
  try {
    log(description);
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} concluído`);
  } catch (err) {
    error(`Falha ao executar: ${description}`);
    error(err.message);
    process.exit(1);
  }
}

function main() {
  log('Iniciando configuração do projeto...');
  
  // Verificar arquivo .env
  checkEnvFile();
  
  // Instalar dependências
  runCommand('npm install', 'Instalando dependências');
  
  // Gerar cliente Drizzle
  runCommand('npm run db:generate', 'Gerando cliente Drizzle');
  
  // Executar migrações
  runCommand('npm run db:migrate', 'Executando migrações do banco de dados');
  
  // Build do projeto
  runCommand('npm run build', 'Fazendo build do projeto');
  
  log('✓ Configuração concluída com sucesso!');
  log('Para iniciar o projeto em desenvolvimento, execute: npm run dev');
  log('Para iniciar com Docker, execute: docker-compose up --build');
}

if (require.main === module) {
  main();
}

module.exports = { main };