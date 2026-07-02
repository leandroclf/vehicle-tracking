# Tasks: Post-Baseline Hardening

Prioridade: 1.x destrava fluxos quebrados (RBAC), 2.x completa contratos
publicados, 3.x integrações, 4.x qualidade/segurança, 5.x manutenção.
Cada tarefa referencia o item de origem no
`openspec/changes/production-readiness/VALIDATION.md`.

> **Status: IMPLEMENTADO em 2026-07-02.** Resultados, evidências e riscos
> residuais em `VALIDATION.md` deste change. Exceção parcial: o e2e da tarefa
> 4.3 foi entregue como smoke HTTP de 13 passos contra servidor real
> (Playwright de navegador fica como follow-up; ver VALIDATION.md).

## 1. RBAC (risco residual nº 1)

- [x] 1.1 Migração e seed de RBAC
  - Objetivo: criar `roles` e `profiles.role_id` + seed idempotente
    (`Administrador`, `Gerente`, `Usuário`; admin inicial via `ADMIN_EMAIL`).
  - Arquivos prováveis: `migrations/init.sql` (ou nova migração), `drizzle/`,
    `src/lib/schema.ts`, `scripts/init-db.js`.
  - Validação: migração aplicada em banco limpo e em banco existente; typecheck.
  - Critério de conclusão: tabelas existem, seed idempotente, schema Drizzle
    alinhado ao banco.

- [x] 1.2 Fluxo admin ponta a ponta
  - Objetivo: com RBAC provisionado, validar `/api/roles`, `/api/users` e
    `/api/users/[id]/role` de ponta a ponta pela tela `/dashboard/users`.
  - Depends on: 1.1
  - Validação: integração (Testcontainers, ver 4.1) + manual.
  - Critério de conclusão: admin lista usuários e altera papéis; não-admin
    recebe 403; ausência de papel continua fail-closed.

## 2. Completude de dados das rotas publicadas (risco residual nº 2)

- [x] 2.1 Histórico de posições real
  - Objetivo: `GET /api/vehicles/positions` servindo histórico de `events`
    (filtros: vehicle_id, from/to, limit) — mesma fonte do analytics.
  - Critério de conclusão: payload real, escopado ao usuário, com paginação.

- [x] 2.2 Configurações persistentes
  - Objetivo: criar `user_settings` (jsonb) e ligar `/api/settings/preferences`
    e `/api/settings/notifications` (GET/PUT reais).
  - Critério de conclusão: configurações sobrevivem a re-login; shape atual da
    UI (`src/lib/settings.tsx`) preservado.

- [x] 2.3 Relatórios persistidos
  - Objetivo: tabela `reports` + geração síncrona real em
    `/api/reports/generate`, listagem em `/api/reports`, download em
    `/api/reports/[id]/download`; `/api/reports/custom` sobre `events`/`trips`.
  - Critério de conclusão: relatório gerado, listado e baixável; sem dados
    fabricados; sub-recursos inviáveis rebaixados a 501 explícito.

- [x] 2.4 Geofences sem TODOs
  - Objetivo: completar os trechos herdados em `/api/geofences` (CRUD Drizzle
    sobre a tabela existente) e `/api/geofences/check`.
  - Critério de conclusão: ciclo criar→listar→editar→excluir persistindo de
    verdade, escopado por `user_id`.

## 3. Despacho real de comandos (risco residual nº 3)

- [x] 3.1 Spike: canal de comandos do tracker-server
  - Objetivo: confirmar como `tracker-server/` recebe comandos e devolve
    confirmação (protocolo, endpoint, simulador).
  - Critério de conclusão: documento curto no change com o contrato do canal e
    decisão go/no-go da tarefa 3.2.

- [x] 3.2 Integração de despacho com máquina de estados
  - Objetivo: publicar comando confirmado no tracker-server; transições
    `sent_to_device → executed` (com `response`) ou `→ failed`
    (com `error_message`), timeout 60s; feature flag
    `COMMANDS_DISPATCH_ENABLED`.
  - Depends on: 3.1
  - Critério de conclusão: comando confirmado termina em estado real do
    dispositivo; flag desligada preserva comportamento atual.

## 4. Notificações e testes (riscos residuais nº 4 e nº 5)

- [x] 4.1 Testes de integração de API com banco efêmero
  - Objetivo: Testcontainers (PostgreSQL) + Jest em job de CI separado,
    cobrindo: auth (login/me), vehicles (CRUD + placa duplicada), commands
    (criar/confirmar/expirar/token inválido), alerts (listar/ack em lote),
    users (gate de RBAC 401/403/200).
  - Critério de conclusão: suíte roda no CI e localmente com Docker; falhas
    bloqueiam merge.

- [x] 4.2 Notificações persistentes
  - Objetivo: tabela `notifications` + alimentação a partir da criação de
    alerts; `/api/notifications` (GET/PATCH) sobre dados reais; WebSocket
    emitindo a partir da inserção.
  - Critério de conclusão: nenhuma notificação estática; marcar como lida
    persiste; shape da UI (`NotificationsBell`/`NotificationsProvider`)
    inalterado.

- [x] 4.3 Fluxo e2e mínimo
  - Objetivo: Playwright — login → dashboard → enviar comando → confirmar →
    ver no histórico, contra `docker-compose.dev.yml` (com simulador do
    tracker-server).
  - Depends on: 4.1 (infra de CI), 3.2 desejável (senão valida até
    `sent_to_device`).
  - Critério de conclusão: fluxo roda como smoke gate no CI.

## 5. Hardening de infraestrutura e manutenção (sugestões do VALIDATION.md)

- [x] 5.1 TLS verificado em produção
  - Objetivo: substituir `ssl: { rejectUnauthorized: false }` em
    `src/lib/database.ts` por CA verificada via `DATABASE_CA_CERT`;
    documentar em `.env.example` e `config/README.md`.
  - Critério de conclusão: produção conecta com verificação de certificado;
    dev local inalterado.

- [x] 5.2 Consolidar toasts em `sonner`
  - Objetivo: migrar call sites de `react-hot-toast` e `react-toastify` para
    `sonner` e remover as duas dependências.
  - Critério de conclusão: uma única lib de toast; lint/build verdes.

- [x] 5.3 Unificar componentes de UI duplicados
  - Objetivo: remover `tabs-fixed.tsx` e `ScrollArea.tsx` (migrar consumidores
    para `Tabs.tsx`/`scroll-area.tsx`); exportar `SimpleTooltip` de
    `components/ui/Tooltip.tsx` e substituir os wrappers ad-hoc
    (VehicleCommands, Sidebar, VehicleCard) com `TooltipProvider` único no
    layout raiz.
  - Critério de conclusão: sem componentes duplicados por case; tooltips com
    comportamento consistente.

- [x] 5.4 Remover dependências não usadas
  - Objetivo: rodar depcheck/knip, remover pacotes sem importadores
    (candidatos: `react-day-picker`, `xlsx`, `node-fetch`, `turbo`) e conferir
    lockfile.
  - Critério de conclusão: `pnpm run validate` verde após remoção.

## 6. Validação de release

- [x] 6.1 Re-executar a suíte completa do baseline
  - Objetivo: `pnpm run typecheck` + `pnpm run lint` + `pnpm test` +
    `pnpm run build` + suíte de integração (4.1) + e2e (4.3).
  - Depends on: todas as anteriores.
  - Critério de conclusão: tudo verde; VALIDATION.md deste change escrito com
    resultados e eventuais novos riscos residuais.
