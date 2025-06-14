# Checklist de QA - Migração shadcn/ui

## 🎯 Objetivo

Este checklist garante que a migração para shadcn/ui mantém a qualidade, acessibilidade e performance do projeto.

## ✅ Checklist de Componentes

### Componentes Base

#### Button
- [ ] Todas as variantes funcionam corretamente (default, destructive, outline, secondary, ghost, link)
- [ ] Todos os tamanhos funcionam (sm, default, lg, icon)
- [ ] Estados de loading e disabled funcionam
- [ ] Ícones são exibidos corretamente
- [ ] Hover e focus states estão funcionais
- [ ] Acessibilidade: navegação por teclado (Tab, Enter, Space)
- [ ] ARIA attributes estão presentes

#### Input
- [ ] Tipos de input funcionam (text, email, password, search, etc.)
- [ ] Estados de erro são exibidos corretamente
- [ ] Placeholder e labels funcionam
- [ ] Validação visual funciona
- [ ] Focus states estão corretos
- [ ] Acessibilidade: associação com labels
- [ ] Screen readers conseguem ler o conteúdo

#### Card
- [ ] CardHeader, CardTitle, CardDescription renderizam corretamente
- [ ] CardContent exibe o conteúdo adequadamente
- [ ] Espaçamento interno está correto
- [ ] Hover effects funcionam
- [ ] Responsividade em diferentes tamanhos

#### Badge
- [ ] Variantes funcionam (default, secondary, destructive, outline)
- [ ] Tamanhos estão adequados
- [ ] Cores estão corretas conforme o design system
- [ ] Texto é legível em todas as variantes

#### Alert
- [ ] Variantes funcionam (default, destructive)
- [ ] Ícones são exibidos corretamente
- [ ] AlertTitle e AlertDescription funcionam
- [ ] Cores e contrastes estão adequados
- [ ] Acessibilidade: role="alert" está presente

#### Label
- [ ] Associação com inputs funciona (htmlFor)
- [ ] Estilos estão consistentes
- [ ] Indicador de campo obrigatório funciona
- [ ] Acessibilidade: screen readers identificam labels

### Componentes Interativos

#### Dialog
- [ ] Abre e fecha corretamente
- [ ] Overlay funciona (clique fora fecha)
- [ ] Escape key fecha o dialog
- [ ] Focus trap funciona (Tab fica dentro do dialog)
- [ ] DialogHeader, DialogTitle, DialogContent renderizam
- [ ] Scroll funciona quando conteúdo é grande
- [ ] Acessibilidade: ARIA attributes corretos
- [ ] Screen readers anunciam abertura/fechamento

#### Sheet
- [ ] Abre e fecha corretamente
- [ ] Animações de slide funcionam
- [ ] Diferentes posições funcionam (top, right, bottom, left)
- [ ] Overlay funciona
- [ ] Responsividade em mobile
- [ ] Focus management funciona
- [ ] Escape key fecha

#### Select
- [ ] Abre e fecha corretamente
- [ ] Seleção de itens funciona
- [ ] Placeholder é exibido
- [ ] Valor selecionado é mostrado
- [ ] Navegação por teclado (Arrow keys, Enter, Escape)
- [ ] Busca por digitação funciona
- [ ] Acessibilidade: ARIA attributes
- [ ] Screen readers conseguem navegar

#### Dropdown Menu
- [ ] Abre e fecha corretamente
- [ ] Itens são clicáveis
- [ ] Separadores funcionam
- [ ] Ícones nos itens são exibidos
- [ ] Navegação por teclado funciona
- [ ] Escape fecha o menu
- [ ] Clique fora fecha o menu
- [ ] Acessibilidade: role="menu" está presente

#### Tabs
- [ ] Troca entre abas funciona
- [ ] Conteúdo das abas é exibido corretamente
- [ ] Aba ativa é destacada visualmente
- [ ] Navegação por teclado (Arrow keys)
- [ ] Acessibilidade: ARIA attributes corretos
- [ ] Screen readers anunciam mudanças de aba

#### Avatar
- [ ] Imagem é exibida quando disponível
- [ ] Fallback funciona quando imagem falha
- [ ] Tamanhos diferentes funcionam
- [ ] Bordas e estilos estão corretos
- [ ] Alt text está presente para acessibilidade

#### Tooltip
- [ ] Aparece no hover
- [ ] Aparece no focus (teclado)
- [ ] Posicionamento está correto
- [ ] Não interfere com outros elementos
- [ ] Delay de aparição/desaparição funciona
- [ ] Acessibilidade: ARIA attributes corretos

### Componentes de Formulário

#### Form (React Hook Form)
- [ ] Validação funciona corretamente
- [ ] Mensagens de erro são exibidas
- [ ] Submit funciona
- [ ] Reset funciona
- [ ] Estados de loading funcionam
- [ ] Acessibilidade: associação de erros com campos

#### Checkbox
- [ ] Check/uncheck funciona
- [ ] Estados indeterminado funciona
- [ ] Disabled state funciona
- [ ] Label clicável funciona
- [ ] Navegação por teclado (Space)
- [ ] Acessibilidade: ARIA attributes

#### Radio Group
- [ ] Seleção única funciona
- [ ] Navegação por teclado (Arrow keys)
- [ ] Disabled state funciona
- [ ] Labels clicáveis funcionam
- [ ] Acessibilidade: role="radiogroup"

#### Switch
- [ ] Toggle funciona
- [ ] Estados on/off são visualmente distintos
- [ ] Disabled state funciona
- [ ] Navegação por teclado (Space)
- [ ] Acessibilidade: ARIA attributes

#### Slider
- [ ] Arrastar funciona
- [ ] Valores são atualizados
- [ ] Min/max são respeitados
- [ ] Step funciona
- [ ] Navegação por teclado (Arrow keys)
- [ ] Acessibilidade: ARIA attributes

### Componentes de Layout

#### Table
- [ ] Headers são exibidos corretamente
- [ ] Dados são renderizados nas células
- [ ] Scroll horizontal funciona quando necessário
- [ ] Zebra striping funciona (se aplicado)
- [ ] Hover effects funcionam
- [ ] Acessibilidade: headers associados às células

#### Separator
- [ ] Linha de separação é visível
- [ ] Orientação (horizontal/vertical) funciona
- [ ] Espaçamento está correto

#### Scroll Area
- [ ] Scroll funciona corretamente
- [ ] Scrollbars customizadas funcionam
- [ ] Conteúdo não vaza
- [ ] Performance é adequada

### Componentes de Feedback

#### Progress
- [ ] Barra de progresso é exibida
- [ ] Valor é atualizado corretamente
- [ ] Animações funcionam
- [ ] Acessibilidade: ARIA attributes para progresso

#### Skeleton
- [ ] Animação de loading funciona
- [ ] Tamanhos estão corretos
- [ ] Não interfere no layout
- [ ] Performance é adequada

## 🎨 Componentes Compostos

### FormField
- [ ] Label é exibido corretamente
- [ ] Indicador de obrigatório funciona
- [ ] Helper text é mostrado
- [ ] Mensagens de erro são exibidas
- [ ] Associação ARIA funciona
- [ ] Estilos estão consistentes

### ConfirmationDialog
- [ ] Diferentes variantes funcionam (default, destructive, warning, info)
- [ ] Ícones corretos são exibidos
- [ ] Botões de confirmação/cancelamento funcionam
- [ ] Hook useConfirmationDialog funciona
- [ ] Estados de loading funcionam
- [ ] Escape cancela a ação

### VehicleCard
- [ ] Informações do veículo são exibidas
- [ ] Status é mostrado corretamente
- [ ] Métricas (velocidade, combustível, bateria) funcionam
- [ ] Menu de ações funciona
- [ ] Modo compacto funciona
- [ ] Tooltips funcionam
- [ ] Responsividade está adequada

### VehicleList
- [ ] Lista de veículos é renderizada
- [ ] Estado vazio é mostrado
- [ ] Grid responsivo funciona
- [ ] Callbacks funcionam (onSelect, onEdit, onTrack)

## 🎯 Testes de Acessibilidade

### Navegação por Teclado
- [ ] Tab navega por todos os elementos interativos
- [ ] Shift+Tab navega na direção oposta
- [ ] Enter ativa botões e links
- [ ] Space ativa checkboxes e switches
- [ ] Arrow keys navegam em menus e tabs
- [ ] Escape fecha modais e menus

### Screen Readers
- [ ] Todos os elementos têm labels apropriados
- [ ] ARIA attributes estão corretos
- [ ] Mudanças de estado são anunciadas
- [ ] Estrutura semântica está correta
- [ ] Landmarks estão definidos

### Contraste e Cores
- [ ] Contraste mínimo de 4.5:1 para texto normal
- [ ] Contraste mínimo de 3:1 para texto grande
- [ ] Informação não depende apenas de cor
- [ ] Estados de focus são visíveis

### Responsividade
- [ ] Funciona em 320px (mobile pequeno)
- [ ] Funciona em 768px (tablet)
- [ ] Funciona em 1024px (desktop)
- [ ] Funciona em 1920px (desktop grande)
- [ ] Touch targets têm pelo menos 44px

## 🚀 Testes de Performance

### Bundle Size
- [ ] Bundle size não aumentou significativamente
- [ ] Tree-shaking está funcionando
- [ ] Componentes não utilizados não estão no bundle
- [ ] Lazy loading funciona onde aplicado

### Rendering
- [ ] Componentes renderizam rapidamente
- [ ] Não há re-renders desnecessários
- [ ] Animações são suaves (60fps)
- [ ] Não há memory leaks

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

## 🔧 Testes Técnicos

### TypeScript
- [ ] Todos os tipos estão corretos
- [ ] Não há erros de compilação
- [ ] IntelliSense funciona corretamente
- [ ] Props são tipadas adequadamente

### Compatibilidade
- [ ] Funciona no Chrome
- [ ] Funciona no Firefox
- [ ] Funciona no Safari
- [ ] Funciona no Edge
- [ ] Funciona em dispositivos móveis

### Integração
- [ ] Componentes funcionam com React Hook Form
- [ ] Componentes funcionam com Next.js
- [ ] CSS variables funcionam
- [ ] Dark mode funciona (se implementado)

## 📋 Checklist de Documentação

- [ ] Todos os componentes têm exemplos de uso
- [ ] Props estão documentadas
- [ ] Casos de uso estão cobertos
- [ ] Acessibilidade está documentada
- [ ] Migração está documentada

## 🎨 Checklist de Design

- [ ] Componentes seguem o design system
- [ ] Espaçamentos estão consistentes
- [ ] Tipografia está correta
- [ ] Cores estão de acordo com a paleta
- [ ] Ícones estão alinhados e proporcionais

## ✅ Aprovação Final

### Desenvolvedor
- [ ] Todos os testes técnicos passaram
- [ ] Performance está adequada
- [ ] Código está limpo e documentado

### Designer
- [ ] Visual está de acordo com o design
- [ ] Interações estão corretas
- [ ] Responsividade está adequada

### QA
- [ ] Todos os testes funcionais passaram
- [ ] Acessibilidade foi validada
- [ ] Compatibilidade foi testada

### Product Owner
- [ ] Funcionalidades atendem aos requisitos
- [ ] UX está adequada
- [ ] Performance é aceitável

---

## 🔗 Ferramentas de Teste

### Acessibilidade
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Performance
- [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [WebPageTest](https://www.webpagetest.org/)

### Compatibilidade
- [BrowserStack](https://www.browserstack.com/)
- [Can I Use](https://caniuse.com/)

---

**Data do teste**: ___________
**Testador**: ___________
**Versão**: ___________
**Status**: [ ] Aprovado [ ] Reprovado [ ] Pendente