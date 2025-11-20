# 📚 Documentação do Projeto

Este diretório contém toda a documentação técnica do projeto Yukz Vehicle Tracking.

## 📄 Arquivos

### 1. `postgres_project_guide.md`
**Guia Completo: Sistema de Rastreamento com PostgreSQL**

Documentação completa de arquitetura e implementação do zero usando:
- Next.js 14 + TypeScript
- PostgreSQL (sem Supabase)
- Redis + WebSocket
- Drizzle ORM + JWT

**Conteúdo**:
- Arquitetura do sistema
- Setup de ambiente
- Schema de banco de dados
- Autenticação e autorização
- Sistema em tempo real
- APIs e endpoints
- Segurança
- Deploy em produção

### 2. `ai_implementation_prompt.md`
**Prompt para Implementação Guiada por IA**

Prompt estruturado em 7 fases para guiar assistentes de IA (Gemini, ChatGPT, Claude) na implementação completa do sistema.

**Fases**:
1. Setup Inicial e Configuração
2. Banco de Dados PostgreSQL
3. Autenticação e Autorização
4. Sistema em Tempo Real (WebSocket)
5. Features Core do Sistema
6. Interface do Usuário
7. Validação Final

### 3. `navigation_simplification_walkthrough.md`
**Walkthrough: Simplificação da Navegação UX**

Documentação da refatoração que simplificou a navegação removendo sistemas redundantes.

**Mudanças**:
- Removido `ContextualNavigation` (348 linhas)
- Simplificado `Header.tsx` (230 → 120 linhas)
- Consolidado menu do usuário em dropdown
- Liberado 48px de altura vertical

---

## 🚀 Como Usar

### Para iniciar um novo projeto:
1. Leia `postgres_project_guide.md` para entender a arquitetura
2. Use `ai_implementation_prompt.md` com um assistente de IA
3. Siga as fases sequencialmente

### Para contribuir com este projeto:
1. Leia `navigation_simplification_walkthrough.md` para entender as mudanças recentes
2. Consulte `postgres_project_guide.md` para arquitetura

---

## 📝 Manutenção

Estes documentos devem ser atualizados quando:
- Arquitetura do sistema mudar significativamente
- Novas features principais forem adicionadas
- Stack tecnológica for atualizada
- Boas práticas evoluírem

---

**Última atualização**: 2025-11-20
