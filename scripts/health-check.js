#!/usr/bin/env node

/**
 * Script de Verificação de Saúde do Sistema
 * Verifica se todos os componentes estão funcionando corretamente
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para verificar se uma porta está em uso
async function checkPort(port, service) {
  try {
    const { stdout } = await execAsync(`netstat -an | findstr :${port}`);
    if (stdout.includes(`:${port}`)) {
      log(`✅ ${service} está rodando na porta ${port}`, 'green');
      return true;
    } else {
      log(`❌ ${service} não está rodando na porta ${port}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao verificar porta ${port} para ${service}`, 'red');
    return false;
  }
}

// Função para verificar endpoint HTTP
async function checkEndpoint(url, name) {
  try {
    const { stdout } = await execAsync(`powershell -Command "try { $response = Invoke-WebRequest -Uri '${url}' -UseBasicParsing -TimeoutSec 10; $response.StatusCode } catch { 'ERROR' }"`);
    const statusCode = stdout.trim();
    
    if (statusCode === '200') {
      log(`✅ ${name} está respondendo (${statusCode})`, 'green');
      return true;
    } else if (statusCode === 'ERROR') {
      log(`❌ ${name} não está acessível`, 'red');
      return false;
    } else {
      log(`⚠️  ${name} respondeu com status ${statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao verificar ${name}: ${error.message}`, 'red');
    return false;
  }
}

// Função para verificar containers Docker
async function checkDockerContainers() {
  try {
    const { stdout } = await execAsync('docker ps --format "table {{.Names}}\\t{{.Status}}"');
    const lines = stdout.split('\n').filter(line => line.includes('supabase'));
    
    if (lines.length > 0) {
      log('✅ Containers Supabase encontrados:', 'green');
      lines.forEach(line => {
        if (line.includes('Up')) {
          log(`  ✅ ${line}`, 'green');
        } else {
          log(`  ❌ ${line}`, 'red');
        }
      });
      return true;
    } else {
      log('❌ Nenhum container Supabase encontrado', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Erro ao verificar containers Docker', 'red');
    return false;
  }
}

// Função para verificar variáveis de ambiente
function checkEnvironmentVariables() {
  const requiredVars = [
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allPresent = true;
  
  log('🔍 Verificando variáveis de ambiente:', 'blue');
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`  ✅ ${varName}`, 'green');
    } else {
      log(`  ❌ ${varName} não definida`, 'red');
      allPresent = false;
    }
  });

  return allPresent;
}

// Função principal
async function healthCheck() {
  log('🏥 VERIFICAÇÃO DE SAÚDE DO SISTEMA YUKZ', 'bold');
  log('=' .repeat(50), 'blue');
  
  const checks = [];
  
  // Verificar variáveis de ambiente
  log('\n📋 Variáveis de Ambiente:', 'blue');
  checks.push(checkEnvironmentVariables());
  
  // Verificar containers Docker
  log('\n🐳 Containers Docker:', 'blue');
  checks.push(await checkDockerContainers());
  
  // Verificar portas
  log('\n🔌 Verificação de Portas:', 'blue');
  checks.push(await checkPort(3000, 'Next.js'));
  checks.push(await checkPort(54321, 'Supabase Kong'));
  checks.push(await checkPort(54322, 'Supabase PostgreSQL'));
  
  // Verificar endpoints
  log('\n🌐 Verificação de Endpoints:', 'blue');
  checks.push(await checkEndpoint('http://localhost:3000', 'Aplicação Next.js'));
  checks.push(await checkEndpoint('http://localhost:3000/api/health', 'Health Check API'));
  checks.push(await checkEndpoint('http://localhost:54321/rest/v1/', 'Supabase Kong API'));
  
  // Resumo
  log('\n📊 RESUMO:', 'bold');
  log('=' .repeat(30), 'blue');
  
  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  
  if (passedChecks === totalChecks) {
    log(`✅ Todos os ${totalChecks} testes passaram!`, 'green');
    log('🚀 Sistema está funcionando corretamente!', 'green');
  } else {
    log(`⚠️  ${passedChecks}/${totalChecks} testes passaram`, 'yellow');
    log('🔧 Alguns componentes precisam de atenção', 'yellow');
  }
  
  // Próximos passos
  log('\n📝 Próximos Passos:', 'blue');
  log('  • Execute "npm run dev" se o Next.js não estiver rodando', 'reset');
  log('  • Execute "supabase start" se o Supabase não estiver rodando', 'reset');
  log('  • Verifique o arquivo .env.local para variáveis de ambiente', 'reset');
  log('  • Consulte docs/PROXIMOS_PASSOS.md para mais informações', 'reset');
}

// Executar verificação
if (require.main === module) {
  // Carregar variáveis de ambiente
  require('dotenv').config({ path: '.env.local' });
  
  healthCheck().catch(error => {
    log(`❌ Erro durante verificação: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { healthCheck };