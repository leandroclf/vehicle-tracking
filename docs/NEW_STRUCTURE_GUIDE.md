# Guia da Nova Estrutura

## Convenções de Nomenclatura

- **Entidades**: `*.entity.ts`
- **Value Objects**: `*.vo.ts`
- **Repositórios**: `*.repository.ts`
- **Casos de Uso**: `*.use-case.ts`
- **DTOs**: `*.dto.ts`
- **Implementações**: `*.impl.ts`

## Regras de Importação

1. Use barrel exports (`index.ts`) sempre que possível
2. Imports relativos apenas dentro da mesma camada
3. Imports absolutos entre camadas diferentes
4. Use os aliases configurados no tsconfig.json:
   - `@/domain/*`
   - `@/application/*`
   - `@/infrastructure/*`
   - `@/presentation/*`
   - `@/shared/*`

## Fluxo de Dependências

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ← Shared
```

## Exemplos de Uso

### Criando uma nova entidade
```typescript
// src/domain/entities/driver.entity.ts
export class Driver {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly licenseNumber: string
  ) {}
}
```

### Criando um caso de uso
```typescript
// src/application/use-cases/driver/create-driver.use-case.ts
import { Driver } from '@/domain/entities/driver.entity';
import { DriverRepository } from '@/domain/repositories/driver.repository';

export class CreateDriverUseCase {
  constructor(private driverRepository: DriverRepository) {}
  
  async execute(data: CreateDriverDto): Promise<Driver> {
    // lógica do caso de uso
  }
}
```

### Usando em um componente
```typescript
// src/presentation/components/forms/driver-form.tsx
import { useCreateDriver } from '@/presentation/hooks/use-driver.hook';

export function DriverForm() {
  const { createDriver, isLoading } = useCreateDriver();
  // componente UI puro
}
```
