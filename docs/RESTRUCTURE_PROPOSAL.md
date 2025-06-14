# Proposta de Reorganização da Estrutura do Projeto

## Análise da Estrutura Atual

### Problemas Identificados

1. **Violação do Princípio da Responsabilidade Única (SRP)**
   - `src/lib/services.ts` mistura diferentes responsabilidades (telemetria, clima, etc.)
   - Componentes UI misturados com lógica de negócio
   - Pasta `lib` muito genérica com responsabilidades diversas

2. **Violação do Princípio da Inversão de Dependência (DIP)**
   - Componentes dependem diretamente de implementações específicas (Supabase)
   - Falta de abstrações para serviços externos

3. **Violação do Princípio da Segregação de Interfaces (ISP)**
   - Interfaces muito grandes e genéricas
   - Tipos espalhados sem organização clara

4. **Falta de Organização por Domínio**
   - Código organizado por tipo técnico ao invés de domínio de negócio
   - Dificulta a localização e manutenção do código

## Nova Estrutura Proposta

### Arquitetura em Camadas (Clean Architecture)

```
src/
├── domain/                     # Camada de Domínio
│   ├── entities/               # Entidades de negócio
│   │   ├── vehicle.entity.ts
│   │   ├── driver.entity.ts
│   │   ├── alert.entity.ts
│   │   └── geofence.entity.ts
│   ├── value-objects/          # Objetos de valor
│   │   ├── coordinates.vo.ts
│   │   ├── vehicle-status.vo.ts
│   │   └── alert-severity.vo.ts
│   ├── repositories/           # Interfaces de repositório
│   │   ├── vehicle.repository.ts
│   │   ├── driver.repository.ts
│   │   └── alert.repository.ts
│   └── services/               # Interfaces de serviços de domínio
│       ├── telemetry.service.ts
│       ├── notification.service.ts
│       └── geofence.service.ts
│
├── application/                # Camada de Aplicação
│   ├── use-cases/              # Casos de uso
│   │   ├── vehicle/
│   │   │   ├── create-vehicle.use-case.ts
│   │   │   ├── update-vehicle.use-case.ts
│   │   │   └── get-vehicle-telemetry.use-case.ts
│   │   ├── driver/
│   │   └── alert/
│   ├── dtos/                   # Data Transfer Objects
│   │   ├── vehicle.dto.ts
│   │   ├── driver.dto.ts
│   │   └── alert.dto.ts
│   └── ports/                  # Interfaces para serviços externos
│       ├── email.port.ts
│       ├── maps.port.ts
│       └── weather.port.ts
│
├── infrastructure/             # Camada de Infraestrutura
│   ├── repositories/           # Implementações de repositório
│   │   ├── supabase/
│   │   │   ├── vehicle.repository.impl.ts
│   │   │   ├── driver.repository.impl.ts
│   │   │   └── alert.repository.impl.ts
│   │   └── index.ts
│   ├── external-services/      # Serviços externos
│   │   ├── google-maps/
│   │   │   ├── maps.service.impl.ts
│   │   │   └── geocoding.service.impl.ts
│   │   ├── weather/
│   │   │   └── weather.service.impl.ts
│   │   └── email/
│   │       └── email.service.impl.ts
│   ├── database/               # Configurações de banco
│   │   ├── supabase.config.ts
│   │   ├── migrations/
│   │   └── seeds/
│   └── adapters/               # Adaptadores para APIs externas
│       ├── supabase.adapter.ts
│       └── google-maps.adapter.ts
│
├── presentation/               # Camada de Apresentação
│   ├── components/             # Componentes UI puros
│   │   ├── ui/                 # Componentes base (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── forms/              # Componentes de formulário
│   │   │   ├── vehicle-form.tsx
│   │   │   └── driver-form.tsx
│   │   ├── layout/             # Componentes de layout
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   ├── maps/               # Componentes de mapa
│   │   │   ├── google-map.tsx
│   │   │   └── route-display.tsx
│   │   └── widgets/            # Widgets do dashboard
│   │       ├── telemetry-widget.tsx
│   │       └── alert-widget.tsx
│   ├── hooks/                  # Custom hooks
│   │   ├── use-vehicle.hook.ts
│   │   ├── use-realtime.hook.ts
│   │   └── use-auth.hook.ts
│   ├── providers/              # Context providers
│   │   ├── auth.provider.tsx
│   │   ├── theme.provider.tsx
│   │   └── realtime.provider.tsx
│   └── pages/                  # Páginas específicas (se necessário)
│       └── dashboard/
│
├── shared/                     # Recursos compartilhados
│   ├── utils/                  # Utilitários
│   │   ├── date.utils.ts
│   │   ├── format.utils.ts
│   │   └── validation.utils.ts
│   ├── constants/              # Constantes
│   │   ├── api.constants.ts
│   │   ├── routes.constants.ts
│   │   └── app.constants.ts
│   ├── types/                  # Tipos compartilhados
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   └── database.types.ts
│   ├── config/                 # Configurações
│   │   ├── env.config.ts
│   │   ├── api.config.ts
│   │   └── app.config.ts
│   └── errors/                 # Classes de erro customizadas
│       ├── domain.errors.ts
│       ├── application.errors.ts
│       └── infrastructure.errors.ts
│
└── app/                        # Next.js App Router (mantido)
    ├── api/
    ├── dashboard/
    └── ...
```

## Aplicação dos Princípios SOLID

### 1. Single Responsibility Principle (SRP)
- Cada classe/módulo tem uma única responsabilidade
- Separação clara entre entidades, casos de uso, repositórios e serviços
- Componentes UI focados apenas na apresentação

### 2. Open/Closed Principle (OCP)
- Interfaces permitem extensão sem modificação
- Novos provedores de dados podem ser adicionados implementando as interfaces existentes
- Componentes podem ser estendidos através de composição

### 3. Liskov Substitution Principle (LSP)
- Implementações de repositórios são intercambiáveis
- Serviços externos podem ser substituídos sem afetar o código cliente

### 4. Interface Segregation Principle (ISP)
- Interfaces pequenas e específicas
- Clientes dependem apenas dos métodos que utilizam
- Separação entre interfaces de leitura e escrita quando apropriado

### 5. Dependency Inversion Principle (DIP)
- Dependência de abstrações, não de implementações concretas
- Injeção de dependência através de construtores ou hooks
- Camadas superiores não dependem de camadas inferiores

## Exemplos Práticos

### Entidade de Domínio
```typescript
// src/domain/entities/vehicle.entity.ts
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
}
```

### Interface de Repositório
```typescript
// src/domain/repositories/vehicle.repository.ts
export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findAll(): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Caso de Uso
```typescript
// src/application/use-cases/vehicle/create-vehicle.use-case.ts
export class CreateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly notificationService: NotificationService
  ) {}

  async execute(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = new Vehicle(
      generateId(),
      dto.name,
      dto.licensePlate,
      VehicleStatus.INACTIVE,
      new Coordinates(0, 0)
    );

    await this.vehicleRepository.save(vehicle);
    await this.notificationService.notify('Vehicle created successfully');
    
    return vehicle;
  }
}
```

### Implementação de Repositório
```typescript
// src/infrastructure/repositories/supabase/vehicle.repository.impl.ts
export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabaseClient
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    return this.mapToEntity(data);
  }

  // ... outros métodos
}
```

### Componente de Apresentação
```typescript
// src/presentation/components/forms/vehicle-form.tsx
interface VehicleFormProps {
  onSubmit: (data: CreateVehicleDto) => void;
  isLoading?: boolean;
}

export function VehicleForm({ onSubmit, isLoading }: VehicleFormProps) {
  // Componente puro focado apenas na apresentação
  // Não conhece detalhes de implementação dos casos de uso
}
```

## Benefícios da Nova Estrutura

### 1. Manutenibilidade
- Código organizado por responsabilidade facilita localização e modificação
- Mudanças em uma camada não afetam outras camadas
- Facilita a identificação de bugs e problemas

### 2. Testabilidade
- Interfaces permitem mock fácil para testes unitários
- Casos de uso podem ser testados independentemente
- Componentes UI podem ser testados isoladamente

### 3. Escalabilidade
- Novos desenvolvedores encontrarão código previsível e bem organizado
- Padrões consistentes facilitam a adição de novas funcionalidades
- Estrutura suporta crescimento do time e do projeto

### 4. Reutilização
- Componentes e serviços desacoplados podem ser reutilizados
- Lógica de negócio independente de framework
- Facilita a criação de bibliotecas internas

### 5. Flexibilidade
- Mudanças de implementação não afetam outras camadas
- Fácil substituição de provedores externos (ex: trocar Supabase por outro banco)
- Suporte a diferentes interfaces (web, mobile, API)

## Estratégia de Migração

### Fase 1: Preparação
1. Criar nova estrutura de pastas
2. Configurar barrel exports (`index.ts`)
3. Atualizar configurações do TypeScript

### Fase 2: Migração por Domínio
1. Começar com o domínio de veículos
2. Criar entidades e value objects
3. Implementar interfaces de repositório
4. Migrar casos de uso
5. Atualizar componentes

### Fase 3: Refatoração
1. Implementar injeção de dependência
2. Adicionar testes unitários
3. Documentar padrões e convenções
4. Treinar equipe nos novos padrões

### Fase 4: Otimização
1. Revisar e otimizar interfaces
2. Adicionar métricas e monitoramento
3. Implementar cache e otimizações de performance
4. Documentação final

## Convenções e Padrões

### Nomenclatura
- Entidades: `*.entity.ts`
- Value Objects: `*.vo.ts`
- Repositórios: `*.repository.ts`
- Casos de Uso: `*.use-case.ts`
- DTOs: `*.dto.ts`
- Implementações: `*.impl.ts`

### Imports
- Usar barrel exports para facilitar importações
- Imports relativos apenas dentro da mesma camada
- Imports absolutos entre camadas diferentes

### Testes
- Testes unitários para casos de uso
- Testes de integração para repositórios
- Testes de componente para UI
- Mocks para dependências externas

Esta estrutura garante que o projeto siga rigorosamente os princípios SOLID, facilitando a manutenção e compreensão por novos desenvolvedores, além de tornar o código mais testável, reutilizável e flexível.