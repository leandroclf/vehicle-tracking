# 📁 Estrutura do Projeto Yukz

## 🏗️ Arquitetura Atual

O projeto utiliza **Next.js 14** com **TypeScript** e está em transição para **Clean Architecture**.

### 📂 Estrutura de Pastas

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   │   ├── health/        # Health Check endpoint
│   │   └── analytics/     # Analytics APIs
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── tracking/         # Tracking pages
│
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui components
│   ├── analytics/        # Analytics components
│   ├── dashboard/        # Dashboard components
│   ├── auth/            # Authentication components
│   └── map/             # Map components
│
├── lib/                  # Utilitários e configurações
│   ├── analytics/        # Analytics services
│   ├── auth/            # Authentication logic
│   ├── db/              # Database utilities
│   └── supabase.ts      # Supabase client
│
├── types/               # Definições TypeScript
│   ├── analytics.d.ts   # Analytics types
│   ├── auth.d.ts        # Auth types
│   └── database.types.ts # Database types
│
├── hooks/               # Custom React hooks
│   └── use-analytics-dashboard.ts
│
└── styles/              # Estilos globais
    └── globals.css
```

## 🎯 Componentes Principais

### ✅ Implementados
- **API Health Check** - Monitoramento da aplicação
- **Dashboard Analytics** - Métricas e insights (60% completo)
- **Componentes UI** - shadcn/ui integrado
- **Tipos TypeScript** - Definições completas

### 🔄 Em Desenvolvimento
- **Autenticação** - Estrutura básica criada
- **Sistema de Rastreamento** - Interface parcial
- **Mapas** - Componentes básicos

### ❌ Não Implementados
- **Clean Architecture** - Pastas criadas, sem implementação
- **MFA Completo** - Apenas estrutura
- **Servidor de Rastreamento** - Não configurado

## 🛠️ Tecnologias

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos

### Backend
- **Next.js API Routes** - APIs REST
- **Supabase** - Banco de dados e auth
- **PostgreSQL** - Database

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração local

## 📊 Status de Implementação

| Módulo | Status | Progresso |
|--------|--------|-----------|
| Infraestrutura | ✅ Completo | 100% |
| API Health | ✅ Completo | 100% |
| Dashboard Analytics | 🔄 Parcial | 60% |
| Autenticação | 🔄 Básico | 30% |
| Rastreamento | 🔄 UI Only | 20% |
| Clean Architecture | ❌ Não implementado | 0% |

## 🚀 Próximos Passos

### Prioridade 1 (4-6 semanas)
1. **Completar Autenticação**
   - Login/registro funcional
   - Middleware de proteção
   - Recuperação de senha

2. **Finalizar Dashboard Analytics**
   - Dados reais do backend
   - Testes unitários
   - Otimizações de performance

3. **Sistema de Rastreamento Básico**
   - CRUD de veículos
   - Visualização em mapa
   - Dados mock para demonstração

### Prioridade 2 (6-8 semanas)
1. **Servidor de Rastreamento**
   - TCP/UDP server
   - Parsers de protocolos
   - Processamento GPS

2. **Funcionalidades Avançadas**
   - Relatórios
   - Alertas em tempo real
   - Geocercas

## 📝 Convenções

### Nomenclatura
- **Componentes**: PascalCase (`DashboardCard`)
- **Arquivos**: kebab-case (`analytics-dashboard.tsx`)
- **Tipos**: PascalCase com sufixo (`UserData`, `VehicleStatus`)

### Estrutura de Componentes
```typescript
// Imports
import { ... } from '...'

// Types
interface ComponentProps {
  // props definition
}

// Component
export function Component({ ...props }: ComponentProps) {
  // implementation
}

// Default export
export default Component
```

### API Routes
```typescript
// GET /api/resource
export async function GET(request: Request) {
  // implementation
}

// POST /api/resource
export async function POST(request: Request) {
  // implementation
}
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor de produção

# Qualidade
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm test            # Testes unitários

# Banco de dados
npm run migrate      # Executa migrações
npm run health       # Verifica saúde do sistema

# Docker
docker-compose up    # Inicia ambiente completo
```

## 📚 Documentação Relacionada

- <mcfile name="README.md" path="c:\Users\leand\IdeaProjects\yukz\vehicle-tracking\README.md"></mcfile> - Visão geral do projeto
- <mcfile name="ROADMAP_REALISTA.md" path="c:\Users\leand\IdeaProjects\yukz\vehicle-tracking\docs\ROADMAP_REALISTA.md"></mcfile> - Plano de execução
- <mcfile name="CHECKLIST_DEPLOY_PRODUCAO.md" path="c:\Users\leand\IdeaProjects\yukz\vehicle-tracking\docs\CHECKLIST_DEPLOY_PRODUCAO.md"></mcfile> - Deploy em produção

---

*Documento atualizado em: Janeiro 2025*