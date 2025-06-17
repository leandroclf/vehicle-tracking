# Exemplos de Migração - shadcn/ui Optimization

## Visão Geral

Este documento fornece exemplos práticos de como migrar componentes existentes para usar os novos padrões estabelecidos.

## 1. Migração do VehicleStatusFilters

### Antes (Código Atual)
```typescript
// VehicleStatusFilters.tsx
const statusOptions = [
  { value: 'online', label: 'Online', color: 'bg-green-500' },
  { value: 'offline', label: 'Offline', color: 'bg-red-500' },
  // ...
];

const VehicleStatusFilters = ({ selectedStatuses, onStatusChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map(option => (
        <button
          key={option.value}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedStatuses.includes(option.value)
              ? `${option.color} text-white`
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => onStatusChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
```

### Depois (Otimizado)
```typescript
// VehicleStatusFilters.tsx
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'sleep', label: 'Dormindo' },
  { value: 'sem_resposta', label: 'Sem Resposta' },
  { value: 'sem_gps', label: 'Sem GPS' },
] as const;

interface VehicleStatusFiltersProps {
  selectedStatuses: string[];
  onStatusChange: (status: string) => void;
  className?: string;
  "data-testid"?: string;
}

const VehicleStatusFilters = ({ 
  selectedStatuses, 
  onStatusChange, 
  className,
  "data-testid": testId 
}: VehicleStatusFiltersProps) => {
  return (
    <div 
      className={cn("flex flex-wrap gap-2", className)}
      data-testid={testId}
      role="group"
      aria-label="Filtros de status de veículos"
    >
      {statusOptions.map(option => {
        const isSelected = selectedStatuses.includes(option.value);
        
        return (
          <Button
            key={option.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "transition-all duration-200",
              isSelected && "ring-2 ring-ring ring-offset-2"
            )}
            data-testid={`${testId}-${option.value}`}
            aria-pressed={isSelected}
          >
            <StatusBadge 
              status={option.value as any}
              className="mr-2 h-2 w-2 p-0"
              showPulse={isSelected}
            />
            {option.label}
            {isSelected && (
              <Badge 
                variant="secondary" 
                size="sm" 
                className="ml-2 h-4 w-4 p-0 text-xs"
              >
                ✓
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export { VehicleStatusFilters };
```

### Melhorias Implementadas
- ✅ Uso de componentes shadcn/ui padronizados
- ✅ Acessibilidade com `aria-label`, `aria-pressed`, `role`
- ✅ Data attributes para testes
- ✅ Variantes centralizadas
- ✅ Animações suaves
- ✅ Indicadores visuais claros

## 2. Migração do Modal para ConfirmationDialog

### Antes (Código Atual)
```typescript
// Uso típico de modal para confirmação
const [showDeleteModal, setShowDeleteModal] = useState(false);

const handleDelete = async () => {
  try {
    await deleteVehicle(vehicleId);
    setShowDeleteModal(false);
    // refresh data
  } catch (error) {
    // handle error
  }
};

return (
  <>
    <Button 
      variant="destructive" 
      onClick={() => setShowDeleteModal(true)}
    >
      Excluir Veículo
    </Button>
    
    <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);
```

### Depois (Otimizado)
```typescript
// Uso simplificado com ConfirmationDialog
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

const handleDelete = async () => {
  try {
    await deleteVehicle(vehicleId);
    // refresh data
  } catch (error) {
    // handle error
  }
};

return (
  <ConfirmationDialog
    title="Excluir Veículo"
    description="Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita."
    confirmText="Excluir"
    cancelText="Cancelar"
    variant="destructive"
    onConfirm={handleDelete}
    data-testid="delete-vehicle-confirmation"
  >
    <Button variant="destructive">
      Excluir Veículo
    </Button>
  </ConfirmationDialog>
);
```

### Melhorias Implementadas
- ✅ Redução de 20+ linhas para 15 linhas
- ✅ Estado interno gerenciado automaticamente
- ✅ Loading state integrado
- ✅ Acessibilidade completa
- ✅ Consistência visual
- ✅ Reutilização em todo o projeto

## 3. Migração de Formulários para FormFieldWithValidation

### Antes (Código Atual)
```typescript
// VehicleForm.tsx
<FormField
  control={form.control}
  name="vehicleId"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>ID do Veículo *</FormLabel>
      <FormControl>
        <Input
          placeholder="Digite o ID do veículo"
          className={fieldState.error ? "border-red-500" : ""}
          {...field}
        />
      </FormControl>
      <FormDescription>
        Identificador único do veículo no sistema
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Depois (Otimizado)
```typescript
// VehicleForm.tsx
import { FormFieldWithValidation } from "@/components/ui/FormFieldWithValidation";

<FormFieldWithValidation
  control={form.control}
  name="vehicleId"
  label="ID do Veículo"
  placeholder="Digite o ID do veículo"
  description="Identificador único do veículo no sistema"
  required
  successMessage="ID válido e disponível"
  data-testid="vehicle-id-field"
/>
```

### Melhorias Implementadas
- ✅ Validação visual automática
- ✅ Estados de sucesso/erro/warning
- ✅ Ícones indicativos
- ✅ Mensagens customizáveis
- ✅ Acessibilidade completa
- ✅ Código mais limpo e legível

## 4. Migração de Tabelas para DataTable

### Antes (Código Atual)
```typescript
// VehicleList.tsx
const [searchTerm, setSearchTerm] = useState("");
const [sortColumn, setSortColumn] = useState(null);
const [currentPage, setCurrentPage] = useState(1);

const filteredVehicles = vehicles.filter(vehicle =>
  vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
);

return (
  <div>
    <Input
      placeholder="Buscar veículos..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead onClick={() => handleSort('name')}>
            Nome {getSortIcon('name')}
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Localização</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredVehicles.map(vehicle => (
          <TableRow key={vehicle.id}>
            <TableCell>{vehicle.name}</TableCell>
            <TableCell>
              <StatusBadge status={vehicle.status} />
            </TableCell>
            <TableCell>{vehicle.location}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
    {/* Paginação manual */}
  </div>
);
```

### Depois (Otimizado)
```typescript
// VehicleList.tsx
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

const columns = [
  {
    key: 'name',
    title: 'Nome',
    sortable: true,
    filterable: true,
  },
  {
    key: 'status',
    title: 'Status',
    filterable: true,
    render: (value: string) => (
      <StatusBadge 
        status={value as any} 
        showPulse={value === 'online'}
        data-testid={`status-${value}`}
      />
    ),
  },
  {
    key: 'location',
    title: 'Localização',
    sortable: true,
    render: (value: string) => (
      <span className="text-muted-foreground">
        {value || 'Não disponível'}
      </span>
    ),
  },
  {
    key: 'actions',
    title: 'Ações',
    render: (_, vehicle) => (
      <LazyActionMenuWrapper data-testid={`actions-${vehicle.id}`}>
        {/* menu de ações */}
      </LazyActionMenuWrapper>
    ),
  },
];

return (
  <DataTable
    data={vehicles}
    columns={columns}
    searchable
    searchPlaceholder="Buscar veículos..."
    filterable
    sortable
    pagination
    pageSize={20}
    emptyMessage="Nenhum veículo encontrado"
    onRowClick={(vehicle) => navigate(`/vehicles/${vehicle.id}`)}
    data-testid="vehicles-table"
  />
);
```

### Melhorias Implementadas
- ✅ Redução de 50+ linhas para 30 linhas
- ✅ Busca, filtros e ordenação integrados
- ✅ Paginação automática
- ✅ Loading states
- ✅ Responsividade
- ✅ Acessibilidade completa
- ✅ Lazy loading para ações

## 5. Implementação de Lazy Loading

### Antes (Carregamento Imediato)
```typescript
// Dashboard.tsx
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { ActionMenu } from "@/components/ui/ActionMenu";

// Todos os componentes são carregados imediatamente
```

### Depois (Lazy Loading)
```typescript
// Dashboard.tsx
import { 
  LazyDialogWrapper,
  LazySheetWrapper,
  LazyActionMenuWrapper,
  PreloadTrigger,
  usePreloadComponents
} from "@/components/ui/LazyComponents";

const Dashboard = () => {
  const { preloadAll } = usePreloadComponents();
  
  // Preload em interações do usuário
  useEffect(() => {
    const timer = setTimeout(preloadAll, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div>
      {/* Preload em hover */}
      <PreloadTrigger components={['dialog']} trigger="hover">
        <Button>Abrir Configurações</Button>
      </PreloadTrigger>
      
      {/* Dialog com lazy loading */}
      <LazyDialogWrapper>
        <DialogContent>
          {/* conteúdo pesado */}
        </DialogContent>
      </LazyDialogWrapper>
      
      {/* Sheet para mobile */}
      <LazySheetWrapper>
        <SheetContent>
          {/* menu lateral */}
        </SheetContent>
      </LazySheetWrapper>
    </div>
  );
};
```

### Melhorias Implementadas
- ✅ Redução do bundle inicial
- ✅ Carregamento sob demanda
- ✅ Preload inteligente
- ✅ Fallbacks customizáveis
- ✅ Melhor performance inicial

## 6. Padronização de Cores e Estados

### Antes (Classes Hardcoded)
```typescript
// Vários componentes com cores inconsistentes
<div className="bg-green-500 text-white">Online</div>
<div className="bg-red-400 text-white">Offline</div>
<div className="bg-blue-600 text-white">Dormindo</div>
```

### Depois (Tokens Semânticos)
```typescript
// Usando tokens do tailwind.config.js
<StatusBadge status="online" />    // bg-status-online
<StatusBadge status="offline" />   // bg-status-offline  
<StatusBadge status="sleep" />     // bg-status-sleep

// Ou usando variantes centralizadas
<Badge variant="success">Sucesso</Badge>
<Badge variant="warning">Atenção</Badge>
<Badge variant="destructive">Erro</Badge>
```

### Melhorias Implementadas
- ✅ Consistência visual
- ✅ Facilita mudanças de tema
- ✅ Manutenção centralizada
- ✅ Melhor acessibilidade (contraste)

## Checklist de Migração

### Para cada componente:
- [ ] Substituir classes hardcoded por variantes centralizadas
- [ ] Adicionar `data-testid` para testes
- [ ] Implementar acessibilidade (aria-*, role)
- [ ] Usar componentes compostos quando aplicável
- [ ] Implementar lazy loading se necessário
- [ ] Adicionar estados de loading/error
- [ ] Documentar mudanças

### Priorização:
1. **Alta**: Componentes críticos (formulários, tabelas)
2. **Média**: Componentes de UI (badges, buttons)
3. **Baixa**: Componentes decorativos

## Conclusão

A migração incremental permite adotar os novos padrões sem impactar o desenvolvimento. Cada componente migrado melhora a consistência, manutenibilidade e performance do projeto.