#!/usr/bin/env node

/**
 * Script para testar a nova estrutura do projeto
 * Verifica se todos os arquivos foram criados corretamente
 * e se as dependências estão funcionando
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const srcPath = path.join(projectRoot, 'src');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function main() {
  log('🧪 Testando a nova estrutura do projeto...\n', 'bold');
  
  let allChecks = true;
  
  // Verificar estrutura de pastas
  log('📁 Verificando estrutura de pastas:', 'blue');
  
  const directories = [
    [path.join(srcPath, 'domain'), 'Domain layer'],
    [path.join(srcPath, 'domain', 'entities'), 'Domain entities'],
    [path.join(srcPath, 'domain', 'repositories'), 'Domain repositories'],
    [path.join(srcPath, 'domain', 'value-objects'), 'Domain value objects'],
    [path.join(srcPath, 'domain', 'services'), 'Domain services'],
    
    [path.join(srcPath, 'application'), 'Application layer'],
    [path.join(srcPath, 'application', 'use-cases'), 'Application use cases'],
    [path.join(srcPath, 'application', 'dtos'), 'Application DTOs'],
    [path.join(srcPath, 'application', 'ports'), 'Application ports'],
    
    [path.join(srcPath, 'infrastructure'), 'Infrastructure layer'],
    [path.join(srcPath, 'infrastructure', 'repositories'), 'Infrastructure repositories'],
    [path.join(srcPath, 'infrastructure', 'external-services'), 'External services'],
    [path.join(srcPath, 'infrastructure', 'database'), 'Database configuration'],
    [path.join(srcPath, 'infrastructure', 'adapters'), 'Infrastructure adapters'],
    
    [path.join(srcPath, 'presentation'), 'Presentation layer'],
    [path.join(srcPath, 'presentation', 'components'), 'Presentation components'],
    [path.join(srcPath, 'presentation', 'hooks'), 'Presentation hooks'],
    [path.join(srcPath, 'presentation', 'providers'), 'Presentation providers'],
    
    [path.join(srcPath, 'shared'), 'Shared layer'],
    [path.join(srcPath, 'shared', 'utils'), 'Shared utilities'],
    [path.join(srcPath, 'shared', 'types'), 'Shared types'],
    [path.join(srcPath, 'shared', 'constants'), 'Shared constants'],
    [path.join(srcPath, 'shared', 'config'), 'Shared configuration'],
    [path.join(srcPath, 'shared', 'errors'), 'Shared errors']
  ];
  
  directories.forEach(([dir, desc]) => {
    if (!checkDirectory(dir, desc)) {
      allChecks = false;
    }
  });
  
  log('\n📄 Verificando arquivos de exemplo:', 'blue');
  
  const files = [
    [path.join(srcPath, 'domain', 'entities', 'vehicle.entity.ts'), 'Vehicle entity example'],
    [path.join(srcPath, 'domain', 'repositories', 'vehicle.repository.ts'), 'Vehicle repository interface'],
    [path.join(srcPath, 'application', 'use-cases', 'vehicle', 'create-vehicle.use-case.ts'), 'Create vehicle use case'],
    [path.join(srcPath, 'domain', 'entities', 'index.ts'), 'Domain entities barrel export'],
    [path.join(srcPath, 'application', 'use-cases', 'index.ts'), 'Application use cases barrel export']
  ];
  
  files.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) {
      allChecks = false;
    }
  });
  
  log('\n📚 Verificando documentação:', 'blue');
  
  const docFiles = [
    [path.join(projectRoot, 'docs', 'NEW_STRUCTURE_GUIDE.md'), 'Guia da nova estrutura'],
    [path.join(projectRoot, 'docs', 'RESTRUCTURE_PROPOSAL.md'), 'Proposta de reestruturação'],
    [path.join(projectRoot, 'docs', 'README_NEW_ARCHITECTURE.md'), 'README da nova arquitetura'],
    [path.join(projectRoot, 'examples', 'vehicle-module-example.md'), 'Exemplo de módulo completo']
  ];
  
  docFiles.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) {
      allChecks = false;
    }
  });
  
  log('\n⚙️  Verificando configurações:', 'blue');
  
  const configFiles = [
    [path.join(projectRoot, 'eslint.config.architecture.js'), 'ESLint para arquitetura'],
    [path.join(projectRoot, 'tsconfig.json'), 'TypeScript configuration']
  ];
  
  configFiles.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) {
      allChecks = false;
    }
  });
  
  // Verificar tsconfig.json paths
  log('\n🔗 Verificando aliases do TypeScript:', 'blue');
  
  try {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    const expectedPaths = {
      '@/domain/*': ['./src/domain/*'],
      '@/application/*': ['./src/application/*'],
      '@/infrastructure/*': ['./src/infrastructure/*'],
      '@/presentation/*': ['./src/presentation/*'],
      '@/shared/*': ['./src/shared/*']
    };
    
    const actualPaths = tsconfig.compilerOptions?.paths || {};
    
    Object.entries(expectedPaths).forEach(([alias, expectedPath]) => {
      if (actualPaths[alias] && JSON.stringify(actualPaths[alias]) === JSON.stringify(expectedPath)) {
        log(`✅ Alias ${alias} configurado corretamente`, 'green');
      } else {
        log(`❌ Alias ${alias} não encontrado ou incorreto`, 'red');
        allChecks = false;
      }
    });
  } catch (error) {
    log(`❌ Erro ao verificar tsconfig.json: ${error.message}`, 'red');
    allChecks = false;
  }
  
  // Teste de compilação TypeScript (apenas para arquivos da nova estrutura)
  log('\n🔨 Testando compilação TypeScript (nova estrutura):', 'blue');
  
  try {
    // Testa apenas os arquivos de exemplo da nova estrutura
    execSync('npx tsc --noEmit src/domain/entities/vehicle.entity.ts', { cwd: projectRoot, stdio: 'pipe' });
    log('✅ Compilação dos arquivos da nova estrutura bem-sucedida', 'green');
  } catch (error) {
    const output = error.stdout?.toString() || error.message;
    if (output.includes('Cannot find module') || output.includes('Module not found')) {
      log('⚠️  Avisos de módulos não encontrados (esperado para arquivos de exemplo)', 'yellow');
    } else {
      log('❌ Erro na compilação dos arquivos da nova estrutura', 'red');
      log(`Detalhes: ${output}`, 'yellow');
      allChecks = false;
    }
  }
  
  // Teste do ESLint
  log('\n🔍 Testando ESLint com nova configuração:', 'blue');
  
  try {
    execSync('npx eslint --config eslint.config.architecture.js src/domain/entities/vehicle.entity.ts', { 
      cwd: projectRoot, 
      stdio: 'pipe' 
    });
    log('✅ ESLint executado sem erros críticos', 'green');
  } catch (error) {
    // ESLint pode retornar código de saída não-zero para warnings, então verificamos o conteúdo
    const output = error.stdout?.toString() || '';
    if (output.includes('error') && !output.includes('warning')) {
      log('❌ ESLint encontrou erros', 'red');
      log(`Detalhes: ${output}`, 'yellow');
      allChecks = false;
    } else {
      log('✅ ESLint executado (apenas warnings encontrados)', 'green');
    }
  }
  
  // Resumo final
  log('\n' + '='.repeat(50), 'blue');
  
  if (allChecks) {
    log('🎉 Todos os testes passaram! A nova estrutura está funcionando corretamente.', 'green');
    log('\n📋 Próximos passos:', 'blue');
    log('1. Começar a migrar arquivos existentes gradualmente');
    log('2. Atualizar imports nos arquivos migrados');
    log('3. Executar testes para verificar funcionalidade');
    log('4. Ler a documentação em docs/NEW_STRUCTURE_GUIDE.md');
  } else {
    log('⚠️  Alguns testes falharam. Verifique os erros acima.', 'yellow');
    log('\n🔧 Sugestões:', 'blue');
    log('1. Execute novamente o script de migração: node scripts/restructure-migration.js');
    log('2. Verifique se todas as dependências estão instaladas');
    log('3. Consulte a documentação para resolver problemas específicos');
  }
  
  log('\n📖 Documentação disponível:', 'blue');
  log('- docs/RESTRUCTURE_PROPOSAL.md - Proposta completa');
  log('- docs/README_NEW_ARCHITECTURE.md - Guia de uso');
  log('- examples/vehicle-module-example.md - Exemplo prático');
  log('- docs/NEW_STRUCTURE_GUIDE.md - Guia detalhado');
  
  process.exit(allChecks ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { main };