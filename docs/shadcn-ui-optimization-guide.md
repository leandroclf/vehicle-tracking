# Guia de Otimização shadcn/ui - Vehicle Tracking

## Visão Geral

Este documento descreve as otimizações implementadas no projeto de rastreamento de veículos para melhorar o uso da biblioteca shadcn/ui, focando em usabilidade, componentização, manutenção e performance.

## Estrutura de Arquivos Criados/Modificados

### Arquivos Centralizados

- **`src/lib/variants.ts`** - Variantes centralizadas usando class-variance-authority
- **`tailwind.config.js`** - Tokens semânticos e animações customizadas
- **`src/components/ui/LazyComponents.tsx`** - Wrappers para lazy loading

### Componentes Otimizados

- **`src/components/ui/badge.tsx`** - Refatorado para usar variantes centralizadas
- **`src/components/ui/StatusBadge.tsx`** - Eliminada duplicação, melhorada acessibilidade

### Novos Componentes Compostos

- **`src/components/ui/ConfirmationDialog.tsx`** - Dialog + Button para ações destrutivas
- **`src/components/ui/FormFieldWithValidation.tsx`** - FormField com validação visual aprimorada
- **`src/components/ui/LoadingOverlay.tsx`** - Estados de carregamento reutilizáveis
- **`src/components/ui/DataTable.tsx`** - Table com paginação e filtros integrados

## Padrões Estabelecidos

### 1. Variantes Centralizadas

#### Localização
`src/lib/variants.ts`

#### Padrão
```typescript
import { cva, type VariantProps } from "class-variance-authority";

export const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        // outras variantes
      },
      size: {
        default: "default-size",
        // outros tamanhos
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ComponentVariants = VariantProps<typeof componentVariants>;
```

#### Benefícios
- Consistência visual em todo o projeto
- Facilita manutenção e atualizações
- Reduz duplicação de código
- Melhora a tipagem TypeScript

### 2. Tokens Semânticos no Tailwind

#### Cores de Status
```javascript
status: {
  online: "hsl(142 76% 36%)",
  offline: "hsl(0 84% 60%)",
  sleep: "hsl(221 83% 53%)",
  warning: "hsl(38 92% 50%)",
  info: "hsl(199 89% 48%)",
},
```

#### Animações Customizadas
```javascript
animation: {
  "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "fade-in": "fade-in 0.3s ease-out",
  "slide-up": "slide-up 0.3s ease-out",
  "slide-down": "slide-down 0.3s ease-out",
},
```

### 3. Acessibilidade Aprimorada

#### Padrões Obrigatórios
- `data-testid` para testes automatizados
- `aria-label` e `aria-describedby` apropriados
- `role` para elementos semânticos
- `aria-live` para atualizações dinâmicas
- Suporte completo à navegação por teclado

#### Exemplo
```typescript
<div 
  ref={ref}
  className={cn(statusIndicatorVariants({ status }), className)} 
  data-testid={testId}
  role="status"
  aria-label={`Status: ${status}`}
  {...props}
>
```

### 4. Lazy Loading para Performance

#### Componentes Pesados
- Dialog e DialogContent
- Sheet e SheetContent
- ActionMenu
- DataTable

#### Uso
```typescript
import { LazyDialogWrapper } from "@/components/ui/LazyComponents";

<LazyDialogWrapper fallback={<CustomLoader />}>
  {/* conteúdo do dialog */}
</LazyDialogWrapper>
```

#### Hook de Preload
```typescript
const { preloadDialog, preloadAll } = usePreloadComponents();

// Preload em hover/focus
<PreloadTrigger components={['dialog']} trigger="hover">
  <Button>Abrir Dialog</Button>
</PreloadTrigger>
```

## Componentes Compostos

### 1. ConfirmationDialog

#### Propósito
Combina Dialog + Button para ações destrutivas com UX consistente.

#### Uso
```typescript
<ConfirmationDialog
  title="Excluir Veículo"
  description="Esta ação não pode ser desfeita."
  variant="destructive"
  onConfirm={handleDelete}
  data-testid="delete-vehicle-dialog"
>
  <Button variant="destructive">Excluir</Button>
</ConfirmationDialog>
```

#### Variantes
- `destructive` - Ações perigosas (vermelho)
- `warning` - Ações de atenção (amarelo)
- `info` - Informações (azul)
- `success` - Confirmações positivas (verde)

### 2. FormFieldWithValidation

#### Propósito
Estende FormField com validação visual e estados aprimorados.

#### Uso
```typescript
<FormFieldWithValidation
  control={form.control}
  name="vehicleId"
  label="ID do Veículo"
  placeholder="Digite o ID"
  required
  successMessage="ID válido"
  data-testid="vehicle-id-field"
/>
```

#### Estados
- `default` - Estado normal
- `success` - Validação bem-sucedida
- `warning` - Avisos
- `error` - Erros de validação

### 3. LoadingOverlay

#### Propósito
Estados de carregamento reutilizáveis com diferentes variantes.

#### Uso
```typescript
<LoadingOverlay 
  isLoading={loading}
  variant="skeleton"
  overlay={true}
>
  <VehicleList />
</LoadingOverlay>
```

#### Variantes
- `spinner` - Spinner animado
- `pulse` - Animação de pulso
- `skeleton` - Placeholder estrutural

### 4. DataTable

#### Propósito
Tabela completa com busca, filtros, ordenação e paginação.

#### Uso
```typescript
const columns = [
  {
    key: 'id',
    title: 'ID',
    sortable: true,
    width: '100px'
  },
  {
    key: 'status',
    title: 'Status',
    filterable: true,
    render: (value) => <StatusBadge status={value} />
  }
];

<DataTable
  data={vehicles}
  columns={columns}
  searchable
  pagination
  onRowClick={handleRowClick}
  data-testid="vehicles-table"
/>
```

## Migração de Componentes Existentes

### StatusBadge → Variantes Centralizadas

#### Antes
```typescript
// Duplicação de variantes
const statusBadgeVariants = cva(/* ... */);
const badgeVariants = cva(/* ... */);
```

#### Depois
```typescript
// Importa variantes centralizadas
import { statusIndicatorVariants } from "@/lib/variants";
```

### Badge → Acessibilidade Aprimorada

#### Antes
```typescript
<div className={cn(badgeVariants({ variant }), className)} {...props} />
```

#### Depois
```typescript
<div 
  ref={ref}
  className={cn(badgeVariants({ variant, size }), className)} 
  data-testid={testId}
  {...props} 
/>
```

## Recomendações Futuras

### 1. Componentes Adicionais

- **StatusIndicator** - Unificar todos os indicadores de status
- **VehicleCard** - Card específico para exibição de veículos
- **FilterPanel** - Painel de filtros reutilizável
- **MapOverlay** - Overlay para mapas com informações

### 2. Melhorias de Performance

- Implementar virtualization para listas grandes
- Adicionar memoization em componentes pesados
- Otimizar re-renders com React.memo

### 3. Testes

- Criar testes unitários para todos os componentes
- Implementar testes de acessibilidade
- Adicionar testes de performance

### 4. Documentação

- Storybook para documentação visual
- Guias de uso para cada componente
- Exemplos de implementação

## Checklist de Implementação

### ✅ Concluído
- [x] Variantes centralizadas em `variants.ts`
- [x] Tokens semânticos no `tailwind.config.js`
- [x] Refatoração do `StatusBadge` e `Badge`
- [x] Componentes compostos criados
- [x] Lazy loading implementado
- [x] Acessibilidade aprimorada
- [x] Documentação dos padrões

### 🔄 Próximos Passos
- [ ] Migrar componentes existentes para usar variantes centralizadas
- [ ] Implementar lazy loading nos componentes pesados existentes
- [ ] Adicionar testes automatizados
- [ ] Criar Storybook para documentação
- [ ] Otimizar performance com memoization

## Conclusão

As otimizações implementadas estabelecem uma base sólida para o uso consistente e eficiente da biblioteca shadcn/ui no projeto. Os padrões definidos garantem:

- **Consistência** visual e funcional
- **Manutenibilidade** através de código centralizado
- **Performance** com lazy loading e otimizações
- **Acessibilidade** seguindo as melhores práticas
- **Escalabilidade** para futuras funcionalidades

A implementação incremental permite que a equipe adote os novos padrões gradualmente, sem impactar o desenvolvimento em andamento.