#!/usr/bin/env node

/**
 * Script de migração para reorganizar a estrutura do projeto
 * seguindo os princípios SOLID e Clean Architecture
 */

const fs = require('fs');
const path = require('path');

// Configuração das pastas da nova estrutura
const NEW_STRUCTURE = {
  'src/domain': [
    'entities',
    'value-objects', 
    'repositories',
    'services'
  ],
  'src/application': [
    'use-cases/vehicle',
    'use-cases/driver', 
    'use-cases/alert',
    'use-cases/geofence',
    'dtos',
    'ports'
  ],
  'src/infrastructure': [
    'repositories/supabase',
    'external-services/google-maps',
    'external-services/weather',
    'external-services/email',
    'database',
    'adapters'
  ],
  'src/presentation': [
    'components/ui',
    'components/forms',
    'components/layout',
    'components/maps',
    'components/widgets',
    'hooks',
    'providers',
    'pages/dashboard'
  ],
  'src/shared': [
    'utils',
    'constants',
    'types',
    'config',
    'errors'
  ]
};

// Mapeamento de arquivos existentes para nova estrutura
const FILE_MIGRATIONS = {
  // Componentes UI
  'src/components/ui/': 'src/presentation/components/ui/',
  'src/components/layout/': 'src/presentation/components/layout/',
  'src/components/map/': 'src/presentation/components/maps/',
  'src/components/dashboard/widgets/': 'src/presentation/components/widgets/',
  'src/components/vehicle/': 'src/presentation/components/forms/',
  
  // Hooks
  'src/lib/hooks/': 'src/presentation/hooks/',
  
  // Providers
  'src/lib/providers/': 'src/presentation/providers/',
  
  // Utilitários
  'src/lib/utils.ts': 'src/shared/utils/format.utils.ts',
  'src/lib/auth/password-utils.ts': 'src/shared/utils/password.utils.ts',
  
  // Configurações
  'src/lib/supabase.ts': 'src/shared/config/supabase.config.ts',
  'src/lib/google-maps.ts': 'src/shared/config/google-maps.config.ts',
  
  // Tipos
  'src/types/': 'src/shared/types/',
  
  // Serviços (precisam ser refatorados)
  'src/lib/services.ts': 'src/infrastructure/external-services/', // Será dividido
  'src/lib/apiClient.ts': 'src/infrastructure/adapters/api.adapter.ts',
  
  // Estilos
  'src/styles/': 'src/shared/styles/'
};

/**
 * Cria a estrutura de pastas da nova arquitetura
 */
function createNewStructure() {
  console.log('🏗️  Criando nova estrutura de pastas...');
  
  Object.entries(NEW_STRUCTURE).forEach(([basePath, subPaths]) => {
    // Criar pasta base
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
      console.log(`✅ Criado: ${basePath}`);
    }
    
    // Criar subpastas
    subPaths.forEach(subPath => {
      const fullPath = path.join(basePath, subPath);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Criado: ${fullPath}`);
      }
    });
  });
}

/**
 * Cria arquivos index.ts (barrel exports) para facilitar importações
 */
function createBarrelExports() {
  console.log('📦 Criando barrel exports...');
  
  const barrelPaths = [
    'src/domain/entities/index.ts',
    'src/domain/repositories/index.ts', 
    'src/application/use-cases/index.ts',
    'src/application/dtos/index.ts',
    'src/infrastructure/repositories/index.ts',
    'src/presentation/components/index.ts',
    'src/presentation/hooks/index.ts',
    'src/shared/utils/index.ts',
    'src/shared/types/index.ts'
  ];
  
  barrelPaths.forEach(barrelPath => {
    if (!fs.existsSync(barrelPath)) {
      fs.writeFileSync(barrelPath, '// Barrel export - adicione exports aqui\n');
      console.log(`✅ Criado: ${barrelPath}`);
    }
  });
}

/**
 * Cria exemplos de arquivos seguindo os novos padrões
 */
function createExampleFiles() {
  console.log('📝 Criando arquivos de exemplo...');
  
  // Exemplo de entidade
  const vehicleEntity = `/**
 * Entidade Vehicle - representa um veículo no domínio
 */
export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly licensePlate: string,
    public readonly status: VehicleStatus,
    public readonly coordinates: Coordinates
  ) {}

  updateLocation(newCoordinates: Coordinates): Vehicle {
    return new Vehicle(
      this.id,
      this.name,
      this.licensePlate,
      this.status,
      newCoordinates
    );
  }

  isActive(): boolean {
    return this.status === VehicleStatus.ACTIVE;
  }
}

export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}
`;
  
  // Exemplo de repositório
  const vehicleRepository = `/**
 * Interface do repositório de veículos
 * Define o contrato para persistência de dados
 */
import { Vehicle } from '../entities/vehicle.entity';

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findAll(): Promise<Vehicle[]>;
  findByStatus(status: VehicleStatus): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<void>;
  delete(id: string): Promise<void>;
}
`;
  
  // Exemplo de caso de uso
  const createVehicleUseCase = `/**
 * Caso de uso para criação de veículos
 * Contém a lógica de negócio para esta operação
 */
import { Vehicle, VehicleStatus } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { CreateVehicleDto } from '../dtos/vehicle.dto';
import { generateId } from '../../shared/utils/id.utils';

export class CreateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository
  ) {}

  async execute(dto: CreateVehicleDto): Promise<Vehicle> {
    // Validações de negócio
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Nome do veículo é obrigatório');
    }

    if (!dto.licensePlate || dto.licensePlate.trim().length === 0) {
      throw new Error('Placa do veículo é obrigatória');
    }

    // Criar entidade
    const vehicle = new Vehicle(
      generateId(),
      dto.name.trim(),
      dto.licensePlate.trim().toUpperCase(),
      VehicleStatus.INACTIVE,
      { lat: 0, lng: 0 } // Coordenadas iniciais
    );

    // Persistir
    await this.vehicleRepository.save(vehicle);
    
    return vehicle;
  }
}
`;
  
  // Criar arquivos de exemplo
  const examples = [
    ['src/domain/entities/vehicle.entity.ts', vehicleEntity],
    ['src/domain/repositories/vehicle.repository.ts', vehicleRepository],
    ['src/application/use-cases/vehicle/create-vehicle.use-case.ts', createVehicleUseCase]
  ];
  
  examples.forEach(([filePath, content]) => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Criado exemplo: ${filePath}`);
    }
  });
}

/**
 * Cria arquivo de configuração do TypeScript atualizado
 */
function updateTsConfig() {
  console.log('⚙️  Atualizando tsconfig.json...');
  
  const tsConfigPath = 'tsconfig.json';
  
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    // Adicionar paths para as novas estruturas
    if (!tsConfig.compilerOptions.paths) {
      tsConfig.compilerOptions.paths = {};
    }
    
    Object.assign(tsConfig.compilerOptions.paths, {
      '@/domain/*': ['./src/domain/*'],
      '@/application/*': ['./src/application/*'],
      '@/infrastructure/*': ['./src/infrastructure/*'],
      '@/presentation/*': ['./src/presentation/*'],
      '@/shared/*': ['./src/shared/*']
    });
    
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log('✅ tsconfig.json atualizado');
  }
}

/**
 * Cria documentação sobre a nova estrutura
 */
function createDocumentation() {
  console.log('📚 Criando documentação...');
  
  const readmeContent = `# Guia da Nova Estrutura

## Convenções de Nomenclatura

- **Entidades**: \`*.entity.ts\`
- **Value Objects**: \`*.vo.ts\`
- **Repositórios**: \`*.repository.ts\`
- **Casos de Uso**: \`*.use-case.ts\`
- **DTOs**: \`*.dto.ts\`
- **Implementações**: \`*.impl.ts\`

## Regras de Importação

1. Use barrel exports (\`index.ts\`) sempre que possível
2. Imports relativos apenas dentro da mesma camada
3. Imports absolutos entre camadas diferentes
4. Use os aliases configurados no tsconfig.json:
   - \`@/domain/*\`
   - \`@/application/*\`
   - \`@/infrastructure/*\`
   - \`@/presentation/*\`
   - \`@/shared/*\`

## Fluxo de Dependências

\`\`\`
Presentation → Application → Domain
     ↓              ↓
Infrastructure ← Shared
\`\`\`

## Exemplos de Uso

### Criando uma nova entidade
\`\`\`typescript
// src/domain/entities/driver.entity.ts
export class Driver {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly licenseNumber: string
  ) {}
}
\`\`\`

### Criando um caso de uso
\`\`\`typescript
// src/application/use-cases/driver/create-driver.use-case.ts
import { Driver } from '@/domain/entities/driver.entity';
import { DriverRepository } from '@/domain/repositories/driver.repository';

export class CreateDriverUseCase {
  constructor(private driverRepository: DriverRepository) {}
  
  async execute(data: CreateDriverDto): Promise<Driver> {
    // lógica do caso de uso
  }
}
\`\`\`

### Usando em um componente
\`\`\`typescript
// src/presentation/components/forms/driver-form.tsx
import { useCreateDriver } from '@/presentation/hooks/use-driver.hook';

export function DriverForm() {
  const { createDriver, isLoading } = useCreateDriver();
  // componente UI puro
}
\`\`\`
`;
  
  fs.writeFileSync('docs/NEW_STRUCTURE_GUIDE.md', readmeContent);
  console.log('✅ Criado: docs/NEW_STRUCTURE_GUIDE.md');
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando migração da estrutura do projeto...');
  console.log('');
  
  try {
    // Criar pasta docs se não existir
    if (!fs.existsSync('docs')) {
      fs.mkdirSync('docs');
    }
    
    createNewStructure();
    console.log('');
    
    createBarrelExports();
    console.log('');
    
    createExampleFiles();
    console.log('');
    
    updateTsConfig();
    console.log('');
    
    createDocumentation();
    console.log('');
    
    console.log('✅ Migração da estrutura concluída!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Revisar os arquivos de exemplo criados');
    console.log('2. Começar a migrar arquivos existentes gradualmente');
    console.log('3. Atualizar imports nos arquivos migrados');
    console.log('4. Executar testes para verificar se tudo funciona');
    console.log('5. Ler a documentação em docs/NEW_STRUCTURE_GUIDE.md');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  createNewStructure,
  createBarrelExports,
  createExampleFiles,
  updateTsConfig,
  createDocumentation
};