# Guia de Implementação shadcn/ui

## 🚀 Início Rápido

### 1. Instalação do shadcn/ui CLI

```bash
# Instalar CLI globalmente
npm install -g shadcn-ui@latest

# Ou usar npx para execução única
npx shadcn-ui@latest init
```

### 2. Inicialização do Projeto

O arquivo `components.json` já foi criado. Execute:

```bash
# Verificar configuração
npx shadcn-ui@latest init --check

# Instalar componentes base
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
```

## 📋 Onda 1: Componentes Base

### Button Component

#### Antes (Atual)
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### Depois (shadcn/ui)
```typescript
// src/components/ui/button.tsx (gerado pelo shadcn/ui)
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Variants customizadas do projeto
        success: "bg-green-600 hover:bg-green-700/90 text-white",
        warning: "bg-yellow-500 hover:bg-yellow-600/90 text-black dark:text-white",
        info: "bg-blue-500 hover:bg-blue-600/90 text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

#### Migração Gradual
```typescript
// src/components/ui/Button_legacy.tsx (renomear arquivo atual)
// Manter para compatibilidade durante transição

// Criar alias para facilitar migração
export { Button as ButtonLegacy } from './Button_legacy'
export { Button } from './button' // novo componente shadcn/ui
```

### Input Component

#### Instalar componentes necessários
```bash
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
```

#### FormField Composto
```typescript
// src/components/composite/form-field.tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface FormFieldProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  className?: string
  children: React.ReactElement
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, helperText, required, className, children, ...props }, ref) => {
    const id = React.useId()
    const hasError = !!error
    
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <Label htmlFor={id} className={cn(hasError && "text-destructive")}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {React.cloneElement(children, {
          id,
          className: cn(
            children.props.className,
            hasError && "border-destructive focus-visible:ring-destructive"
          ),
          'aria-invalid': hasError,
          'aria-describedby': error ? `${id}-error` : helperText ? `${id}-helper` : undefined,
        })}
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"
```

### Card Component

```bash
npx shadcn-ui@latest add card
```

#### Uso do Card shadcn/ui
```typescript
// Antes
<Card padding="md" shadow="lg" hoverable>
  <h3>Título</h3>
  <p>Conteúdo</p>
</Card>

// Depois
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Conteúdo</p>
  </CardContent>
</Card>
```

## 📋 Onda 2: Componentes Interativos

### Dialog/Modal

```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add sheet
```

#### ConfirmationDialog Composto
```typescript
// src/components/composite/confirmation-dialog.tsx
import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Select Component

```bash
npx shadcn-ui@latest add select
```

#### Migração do Select
```typescript
// Antes
<Select
  options={[
    { value: 'option1', label: 'Opção 1' },
    { value: 'option2', label: 'Opção 2' },
  ]}
  value={value}
  onChange={setValue}
  placeholder="Selecione uma opção"
/>

// Depois
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione uma opção" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
    <SelectItem value="option2">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

## 📋 Onda 3: Componentes Específicos

### VehicleCard Composto
```typescript
// src/components/composite/vehicle-card.tsx
import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Vehicle } from "@/types/vehicle"

interface VehicleCardProps {
  vehicle: Vehicle
  onSelect?: (vehicle: Vehicle) => void
  showActions?: boolean
  className?: string
}

export function VehicleCard({
  vehicle,
  onSelect,
  showActions = true,
  className,
}: VehicleCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={vehicle.imageUrl} alt={vehicle.name} />
          <AvatarFallback>{vehicle.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-3 flex-1">
          <h3 className="font-semibold">{vehicle.name}</h3>
          <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
        </div>
        <Badge variant={vehicle.status === 'online' ? 'default' : 'secondary'}>
          {vehicle.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Última atualização: {formatDateTime(vehicle.lastUpdate)}
          </div>
          {showActions && (
            <Button
              size="sm"
              onClick={() => onSelect?.(vehicle)}
            >
              Ver detalhes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🎯 Comandos de Instalação Completa

### Componentes Base (Onda 1)
```bash
npx shadcn-ui@latest add button input card badge alert label
```

### Componentes Interativos (Onda 2)
```bash
npx shadcn-ui@latest add dialog sheet select dropdown-menu tabs table
```

### Componentes Avançados (Onda 3)
```bash
npx shadcn-ui@latest add avatar tooltip popover command scroll-area
```

### Componentes de Formulário
```bash
npx shadcn-ui@latest add form checkbox radio-group switch slider
```

### Componentes de Layout
```bash
npx shadcn-ui@latest add separator accordion collapsible resizable
```

## 🧪 Testes de Migração

### Teste de Compatibilidade
```typescript
// src/components/__tests__/migration.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { ButtonLegacy } from '@/components/ui/Button_legacy'

describe('Migration Compatibility', () => {
  it('should render new Button with same props as legacy', () => {
    const props = {
      variant: 'primary' as const,
      size: 'md' as const,
      children: 'Test Button'
    }
    
    const { rerender } = render(<ButtonLegacy {...props} />)
    const legacyButton = screen.getByRole('button')
    
    rerender(<Button {...props} />)
    const newButton = screen.getByRole('button')
    
    // Verificar se ambos renderizam o mesmo texto
    expect(legacyButton.textContent).toBe(newButton.textContent)
  })
})
```

### Teste de Acessibilidade
```typescript
// src/components/__tests__/accessibility.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { FormField } from '@/components/composite/form-field'
import { Input } from '@/components/ui/input'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  it('FormField should be accessible', async () => {
    const { container } = render(
      <FormField label="Nome" error="Campo obrigatório">
        <Input placeholder="Digite seu nome" />
      </FormField>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## 📊 Monitoramento de Performance

### Bundle Size Analysis
```bash
# Instalar ferramenta de análise
npm install --save-dev @next/bundle-analyzer

# Configurar no next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // sua configuração existente
})

# Executar análise
ANALYZE=true npm run build
```

### Performance Testing
```typescript
// scripts/performance-test.js
const { performance } = require('perf_hooks')

function measureComponentRender() {
  const start = performance.now()
  
  // Simular renderização de componentes
  // ...
  
  const end = performance.now()
  console.log(`Render time: ${end - start}ms`)
}

measureComponentRender()
```

## 🔄 Processo de Rollback

### Em caso de problemas
```bash
# 1. Reverter para componentes legacy
git checkout HEAD~1 -- src/components/ui/

# 2. Remover componentes shadcn/ui
rm -rf src/components/ui/button.tsx
rm -rf src/components/ui/input.tsx
# ... outros componentes

# 3. Restaurar imports
# Substituir imports do shadcn/ui pelos legacy
```

### Feature Flags para Rollback Gradual
```typescript
// src/lib/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_SHADCN_BUTTON: process.env.NEXT_PUBLIC_USE_SHADCN_BUTTON === 'true',
  USE_SHADCN_INPUT: process.env.NEXT_PUBLIC_USE_SHADCN_INPUT === 'true',
  USE_SHADCN_CARD: process.env.NEXT_PUBLIC_USE_SHADCN_CARD === 'true',
}

// Uso nos componentes
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { Button } from '@/components/ui/button'
import { ButtonLegacy } from '@/components/ui/Button_legacy'

export function AdaptiveButton(props: ButtonProps) {
  return FEATURE_FLAGS.USE_SHADCN_BUTTON 
    ? <Button {...props} />
    : <ButtonLegacy {...props} />
}
```

## ✅ Checklist de Implementação

### Preparação
- [ ] `components.json` criado
- [ ] shadcn/ui CLI instalado
- [ ] Estrutura de pastas organizada
- [ ] Feature flags configuradas

### Onda 1 - Componentes Base
- [ ] Button migrado
- [ ] Input migrado
- [ ] Card migrado
- [ ] Badge migrado
- [ ] Alert migrado
- [ ] FormField composto criado

### Onda 2 - Componentes Interativos
- [ ] Dialog migrado
- [ ] Select migrado
- [ ] DropdownMenu migrado
- [ ] Tabs migrado
- [ ] Table migrado
- [ ] ConfirmationDialog composto criado

### Onda 3 - Componentes Específicos
- [ ] VehicleCard composto criado
- [ ] AccessibilityMenu migrado
- [ ] Componentes de dashboard migrados
- [ ] LoadingOverlay composto criado

### Finalização
- [ ] Testes de acessibilidade passando
- [ ] Performance otimizada
- [ ] Bundle size verificado
- [ ] Documentação atualizada
- [ ] Componentes legacy removidos

---

**Próximo passo**: Execute `npx shadcn-ui@latest init` para começar a migração!