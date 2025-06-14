# Plano de Migração para shadcn/ui

## 📋 Visão Geral

Este documento detalha o plano completo para migrar o projeto Yukz Vehicle Tracking para utilizar shadcn/ui como biblioteca de componentes principal, mantendo a excelente base de acessibilidade e performance já existente.

## 🎯 Objetivos

- ✅ **Usabilidade intuitiva**: Manter e melhorar acessibilidade (WCAG 2.1 AA)
- ✅ **Componentes reutilizáveis**: Padronizar API e melhorar composabilidade
- ✅ **Facilidade de manutenção**: Reduzir código duplicado e complexidade
- ✅ **Performance otimizada**: Manter bundle size controlado e Core Web Vitals

## 📊 Análise do Estado Atual

### ✅ Pontos Fortes Existentes
- TailwindCSS configurado com tokens CSS bem estruturados
- Radix UI já instalado e em uso
- class-variance-authority implementado
- Excelente foco em acessibilidade (alto contraste, variáveis CSS específicas)
- Next.js com otimizações de performance

### 🔄 Componentes a Migrar
```
📁 src/components/ui/ (50 componentes)
├── 🔥 Alta Prioridade (Onda 1)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   └── Alert.tsx
├── 🟡 Média Prioridade (Onda 2)
│   ├── Modal.tsx → Dialog
│   ├── Dropdown.tsx
│   ├── Select.tsx
│   ├── Tabs.tsx
│   └── Table.tsx
└── 🟢 Baixa Prioridade (Onda 3)
    ├── VehicleStatusFilters.tsx
    ├── AccessibilityMenu.tsx
    └── Componentes específicos do domínio
```

## 🚀 Roadmap de Implementação

### Fase 1: Configuração Base (1-2 dias)

#### 1.1 Instalação e Configuração
```bash
# Instalar shadcn/ui CLI
npx shadcn-ui@latest init

# Configurar components.json
# Ajustar tailwind.config.js
# Verificar utils/cn.ts
```

#### 1.2 Estrutura de Arquivos
```
src/
├── components/
│   ├── ui/           # Componentes shadcn/ui puros
│   ├── composite/    # Componentes compostos
│   └── legacy/       # Componentes antigos (temporário)
└── lib/
    └── utils.ts      # cn() e utilitários
```

### Fase 2: Migração Onda 1 - Componentes Base (3-4 dias)

#### 2.1 Button Component
```typescript
// Migrar para shadcn/ui Button com variants customizadas
// Manter compatibilidade com props existentes
// Adicionar suporte a asChild para composição
```

#### 2.2 Input Component
```typescript
// Implementar FormField composto (Label + Input + Error)
// Manter suporte a ícones e validação
// Garantir acessibilidade com ARIA attributes
```

#### 2.3 Card Component
```typescript
// Migrar para shadcn/ui Card
// Manter variants de padding, shadow, hover
// Criar CardHeader, CardContent, CardFooter compostos
```

### Fase 3: Migração Onda 2 - Componentes Interativos (4-5 dias)

#### 3.1 Dialog/Modal
```typescript
// Substituir Modal.tsx por shadcn/ui Dialog
// Criar ConfirmationDialog composto
// Implementar Sheet para mobile
```

#### 3.2 Select e Dropdown
```typescript
// Migrar para shadcn/ui Select
// Manter suporte a busca e multi-seleção
// Implementar DropdownMenu para ações
```

### Fase 4: Migração Onda 3 - Componentes Específicos (3-4 dias)

#### 4.1 Componentes do Domínio
```typescript
// VehicleStatusFilters usando Select + Badge
// AccessibilityMenu usando DropdownMenu
// Componentes de dashboard usando Card + Badge
```

### Fase 5: Otimização e Polimento (2-3 dias)

#### 5.1 Performance
- Implementar lazy loading com React.lazy()
- Configurar webpack-bundle-analyzer
- Otimizar tree-shaking

#### 5.2 Testes e QA
- Testes de acessibilidade com axe-core
- Testes de navegação por teclado
- Auditoria de Core Web Vitals

## 🧩 Componentes Compostos Planejados

### FormField
```typescript
// Composição: Label + Input + HelperText + ErrorMessage
interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactElement;
}
```

### ConfirmationDialog
```typescript
// Composição: Dialog + DialogHeader + DialogFooter + Button
interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}
```

### LoadingOverlay
```typescript
// Composição: Dialog + Spinner + Text
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  backdrop?: boolean;
}
```

### VehicleCard
```typescript
// Composição: Card + Avatar + Badge + Button
interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: (vehicle: Vehicle) => void;
  showActions?: boolean;
}
```

## 🎨 Design System e Tokens

### Manter Tokens CSS Existentes
```css
/* Preservar variáveis de acessibilidade */
:root {
  --focus-ring-color: 209 100% 50%;
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
  
  /* Manter cores customizadas do projeto */
  --primary: 209 100% 18%;
  --secondary: 35 91% 59%;
}
```

### Variants Customizadas
```typescript
// Estender variants do shadcn/ui para necessidades específicas
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        // Variants padrão do shadcn/ui
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Variants customizadas do projeto
        success: "bg-green-600 hover:bg-green-700/90 text-white",
        warning: "bg-yellow-500 hover:bg-yellow-600/90 text-black",
        info: "bg-blue-500 hover:bg-blue-600/90 text-white",
      }
    }
  }
)
```

## 🔧 Configuração Técnica

### components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Atualização do tailwind.config.js
```javascript
module.exports = {
  // Configuração existente mantida
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // Adicionar plugins do shadcn/ui se necessário
  plugins: [require("tailwindcss-animate")],
}
```

## 📈 Monitoramento e Performance

### Métricas a Acompanhar
- **Bundle Size**: Manter < 500KB gzipped
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Acessibilidade**: Score axe-core > 95%
- **Performance**: Lighthouse Score > 90

### Ferramentas de Monitoramento
```bash
# Bundle analysis
npm run build && npx webpack-bundle-analyzer .next/static/chunks/*.js

# Performance testing
npm run lighthouse

# Accessibility testing
npm run test:a11y
```

## ♿ Acessibilidade

### Checklist de Acessibilidade
- [ ] Contraste de cores WCAG 2.1 AA (4.5:1)
- [ ] Navegação por teclado completa
- [ ] Screen reader compatibility
- [ ] ARIA attributes apropriados
- [ ] Focus management em modais
- [ ] Modo alto contraste funcional
- [ ] Suporte a prefers-reduced-motion

### Testes Automatizados
```typescript
// Exemplo de teste de acessibilidade
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button should be accessible', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🚦 Estratégia de Migração

### Abordagem Incremental
1. **Coexistência**: Manter componentes antigos com sufixo `_legacy`
2. **Feature Flags**: Usar flags para alternar entre versões
3. **Testes A/B**: Comparar performance e usabilidade
4. **Rollback Plan**: Manter possibilidade de reverter mudanças

### Branches e PRs
```
feature/shadcn-migration
├── feat/shadcn-setup
├── feat/wave-1-basic-components
├── feat/wave-2-interactive-components
├── feat/wave-3-domain-components
└── feat/optimization-and-cleanup
```

## 📚 Documentação

### Arquivos a Criar/Atualizar
- [ ] `COMPONENT_GUIDELINES.md` - Guidelines de uso
- [ ] `ACCESSIBILITY_GUIDE.md` - Guia de acessibilidade
- [ ] `PERFORMANCE_GUIDE.md` - Otimizações de performance
- [ ] `MIGRATION_CHECKLIST.md` - Checklist para desenvolvedores
- [ ] Storybook para componentes

## 🔮 Melhorias Futuras

### Funcionalidades Planejadas
- **Theme Switcher**: Alternância automática de tema
- **Dark Mode**: Modo escuro aprimorado
- **Animation System**: Animações consistentes
- **Mobile-First**: Componentes otimizados para mobile
- **Internationalization**: Suporte a múltiplos idiomas

### Componentes Avançados
- **DataTable**: Tabela com sorting, filtering, pagination
- **CommandPalette**: Busca global com cmdk
- **Toast System**: Notificações aprimoradas
- **Form Builder**: Construtor de formulários dinâmicos

## 📋 Checklist de Conclusão

### Fase 1 - Setup
- [ ] shadcn/ui CLI configurado
- [ ] components.json criado
- [ ] Estrutura de pastas organizada
- [ ] utils/cn.ts implementado

### Fase 2 - Onda 1
- [ ] Button migrado e testado
- [ ] Input migrado e testado
- [ ] Card migrado e testado
- [ ] Badge migrado e testado
- [ ] Alert migrado e testado

### Fase 3 - Onda 2
- [ ] Dialog/Modal migrado
- [ ] Select migrado
- [ ] DropdownMenu migrado
- [ ] Tabs migrado
- [ ] Table migrado

### Fase 4 - Onda 3
- [ ] Componentes específicos migrados
- [ ] Componentes compostos criados
- [ ] Lazy loading implementado

### Fase 5 - Finalização
- [ ] Performance otimizada
- [ ] Testes de acessibilidade passando
- [ ] Documentação completa
- [ ] Componentes legacy removidos

---

**Estimativa Total**: 15-20 dias de desenvolvimento
**Risco**: Baixo (base sólida existente)
**Impacto**: Alto (melhoria significativa na manutenibilidade)