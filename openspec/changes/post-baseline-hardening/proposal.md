# Proposal: Post-Baseline Hardening

## Change ID
`post-baseline-hardening`

## Status
Implemented — validated on 2026-07-02 (see `VALIDATION.md`)

## Context
O change `production-readiness` foi implementado e validado em 2026-07-02
(typecheck 0 erros, lint limpo, testes verdes, build de produção sem bypasses).
O relatório de validação (`openspec/changes/production-readiness/VALIDATION.md`)
documentou riscos residuais e melhorias que ficaram explicitamente fora do
baseline. Este change transforma esses itens em trabalho planejado.

Origem de cada item (VALIDATION.md):
- Riscos residuais 1–5 (RBAC ausente, rotas com TODOs de dados, envio real de
  comandos ao dispositivo, notificações estáticas, cobertura de testes).
- Sugestões de melhoria (Testcontainers, TLS verificado, consolidação de
  bibliotecas de toast e componentes de UI duplicados, dependências não usadas).

## Problem
O baseline congelou o comportamento atual e tornou os caminhos não suportados
explícitos (501/fail-closed), mas cinco capacidades permanecem incompletas em
produção:

1. Administração de papéis não funciona: as rotas admin consultam tabelas de
   RBAC (`roles`, `profiles.role_id`) que não existem nas migrações — o
   comportamento é fail-closed, então nenhum usuário consegue exercer fluxos
   administrativos.
2. Rotas herdadas da migração Supabase→PostgreSQL respondem com shapes estáveis
   porém sem dados reais (`/api/vehicles/positions`, `/api/settings`, partes de
   `/api/reports/*`, `/api/geofences`).
3. Comandos remotos são registrados e auditáveis, mas nunca chegam ao
   dispositivo (não há integração com o tracker-server).
4. `/api/notifications` retorna dados estáticos de exemplo.
5. Não há testes de integração/e2e — a confiança de release vem de typecheck,
   lint, build e revisão de contrato.

Além disso, há débito de infraestrutura com impacto de segurança e manutenção:
TLS com `rejectUnauthorized: false` em produção, três bibliotecas de toast
coexistindo e componentes de UI duplicados com case divergente.

## Goals
- Provisionar o modelo de RBAC e destravar os fluxos administrativos.
- Completar as rotas que hoje respondem sem dados reais, ou removê-las do
  contrato suportado.
- Integrar o envio de comandos ao tracker-server com confirmação de execução.
- Persistir notificações reais.
- Estabelecer testes de integração de API (banco efêmero) e um fluxo e2e mínimo.
- Eliminar o débito de segurança de TLS e o débito de manutenção de UI/deps.

## Non-Goals
- Novas capacidades de produto não listadas no VALIDATION.md.
- Redesenho de arquitetura ou troca de stack.
- Reabrir contratos congelados pelo baseline (mudanças aqui são aditivas ou
  preenchem contratos já publicados).

## Users / Actors Impacted
- Administradores de frota (RBAC, gestão de papéis).
- Operadores/dispatch (comandos remotos com confirmação real, notificações).
- Usuários finais (histórico de posições, configurações persistentes, relatórios
  com dados reais).
- Equipe de engenharia e operações (testes, TLS, manutenção de UI).

## Scope
### In scope
1. **RBAC**: migração para `roles` + `profiles.role_id`, seed do papel
   `Administrador`, alinhamento das rotas admin existentes.
2. **Completude de dados**: `/api/vehicles/positions`, `/api/settings/*`,
   `/api/reports/*` (persistência/geração real), `/api/geofences` (trechos TODO).
3. **Despacho de comandos**: integração `commands` → tracker-server, transição
   de status `sent_to_device` → `executed`/`failed` com resposta do dispositivo.
4. **Notificações persistentes**: tabela `notifications`, CRUD na rota
   existente, alimentação via eventos/alertas.
5. **Testes**: integração de API com banco efêmero (Testcontainers) para rotas
   críticas; um fluxo e2e feliz (login → dashboard → comando).
6. **Hardening de infra/manutenção**: TLS com CA verificada, consolidação de
   toast em uma biblioteca (`sonner`), unificação de componentes de UI
   duplicados (`Tabs`/`tabs-fixed`, `ScrollArea`/`scroll-area`,
   `SimpleTooltip` compartilhado), remoção de dependências não usadas.

### Out of scope
- App mobile, novos provedores de mapa, novos tipos de relatório.
- Migração de infraestrutura ou hosting.
- MFA por telefone (permanece 501 até decisão de produto sobre provedor de SMS).

## Business Rules
- Papéis SHALL ser persistidos no banco e verificados server-side; a ausência de
  papel SHALL continuar falhando fechada.
- Comandos SHALL refletir o estado real do dispositivo: `executed` somente após
  confirmação; falha/timeout SHALL resultar em `failed` com `error_message`.
- Notificações SHALL ser atribuíveis a um usuário e deriváveis de eventos reais.
- Nenhuma rota do contrato suportado SHALL responder com dados fabricados.

## Expected Impact
### Data
- Novas tabelas/colunas: `roles`, `profiles.role_id`, `notifications`,
  possivelmente `user_settings`. Migrações reversíveis + seeds.

### APIs / Contracts
- Shapes existentes preservados; rotas 501/estáticas passam a cumprir o contrato
  já publicado. Nenhuma quebra para consumidores atuais.

### Integrations
- tracker-server (TCP/WebSocket) para despacho e confirmação de comandos.

### Security / Privacy
- TLS verificado em produção; RBAC persistido elimina a dependência de
  fail-closed como único mecanismo.

### Operations
- Testcontainers no CI; cobertura mínima e2e como gate de release.

## Risks and Mitigations
| Risco | Impacto | Mitigação |
|---|---|---|
| Migração de RBAC em banco com dados existentes | Médio | Migração aditiva + seed idempotente; rollback documentado |
| Integração com tracker-server instável | Alto | Timeout + retry com status `failed` explícito; feature flag para despacho |
| Testcontainers aumenta tempo de CI | Baixo | Rodar suíte de integração em job paralelo |
| Consolidação de toast/UI causar regressão visual | Baixo | Migrar por página com verificação manual; manter API dos wrappers |

## Success Criteria
- Um usuário com papel `Administrador` consegue listar usuários e alterar papéis
  de ponta a ponta.
- `GET /api/vehicles/positions` retorna histórico real de `events`; relatórios
  gerados persistem e são baixáveis; configurações sobrevivem a re-login.
- Um comando confirmado chega ao tracker-server e termina em
  `executed`/`failed` conforme a resposta real.
- Notificações refletem eventos reais e são marcáveis como lidas com persistência.
- CI executa testes de integração de API + 1 fluxo e2e; suíte de validação do
  baseline (typecheck/lint/test/build) permanece verde.
- Produção sem `rejectUnauthorized: false`; uma única biblioteca de toast;
  componentes duplicados unificados.

## Open Questions
- O modelo de papéis será binário (Administrador/usuário) ou hierárquico
  (manager)? As telas atuais sugerem `admin`/`manager`/`user`.
- O tracker-server atual expõe canal de comando ou precisa de extensão?
- Configurações de dashboard ficam em `user_settings` (jsonb) ou tabela própria?
