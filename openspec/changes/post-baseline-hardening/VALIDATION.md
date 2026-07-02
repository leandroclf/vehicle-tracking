# Validation Report: Post-Baseline Hardening

Data: 2026-07-02
Change: `post-baseline-hardening`

## Resultado da suíte de validação

| Verificação | Comando | Resultado |
|---|---|---|
| Typecheck | `pnpm run typecheck` | 0 erros |
| Lint | `pnpm run lint` (`--max-warnings=0`) | limpo |
| Testes unitários | `pnpm test` | 12/12 |
| **Testes de integração (novo)** | `pnpm run test:integration` | **20/20 contra PostgreSQL real** |
| Build de produção | `pnpm run build` | sucesso, 59 páginas |
| Migração (banco limpo) | initdb via docker compose | 13 tabelas criadas |
| Migração (reexecução) | `psql -f post_baseline_hardening.sql` | idempotente (IF NOT EXISTS/ON CONFLICT) |
| Smoke HTTP ponta a ponta | servidor real + curl | 13 passos, todos OK |
| Dispatcher de comandos | tracker-server com flag ligada | timeout → `failed` validado no banco |

## O que foi implementado por tarefa

### 1. RBAC (tarefas 1.1, 1.2)
- Migração `migrations/post_baseline_hardening.sql`: tabelas `roles`,
  `profiles.role_id` (FK, set null), seed dos papéis `Administrador`/`Gerente`/`Usuário`.
- `scripts/seed-rbac.js` (`pnpm run seed:rbac`): idempotente, atribui `Administrador`
  ao usuário de `ADMIN_EMAIL`.
- Validado ao vivo: `/api/users` retornou **403 fail-closed antes do seed** e **200 depois**;
  gate coberto pela suíte de integração (401/403/200).

### 2. Completude de dados (tarefas 2.1–2.4)
- `/api/vehicles/positions`: histórico real de `events` (filtros vehicleId/from/to/history)
  e último estado de `vehicle_status`; sem tabela fantasma `positions`.
- `/api/settings`, `/api/settings/preferences`, `/api/settings/notifications`: persistência
  real em `user_settings` (jsonb, upsert com merge). Round-trip validado por integração e smoke.
- `/api/reports` (POST/GET), `/api/reports/custom`, `/api/reports/[id]/download`: geração
  **síncrona com dados reais** (agregados de trips/events/alerts por veículo), persistidos na
  tabela `reports`; download em CSV/JSON. `/api/reports/generate` (sem consumidores) → 501
  explícito. O contexto `lib/reports` deixou de usar dados simulados.
- `/api/geofences`: CRUD completo em Drizzle (cor persistida no jsonb `coordinates._color`,
  status ↔ `is_active`); ciclo criar→listar→excluir validado no smoke.
- **Extra descoberto pela suíte**: `/api/alerts` e `/api/alerts/read-all` ainda eram
  esqueletos (GET sempre vazio, PATCH sem efeito) — implementados de verdade (escopo via
  join `vehicles.user_id`, PATCH/PUT persistidos) e `lib/alerts` ligado à API real.
- Placa duplicada agora responde **409** (antes 500).

### 3. Despacho de comandos (tarefas 3.1, 3.2)
- Spike documentado em `SPIKE-command-channel.md` (decisão: banco como fila).
- `tracker-server/src/services/commands.js`: `CommandDispatcher` com polling,
  localização do socket por IMEI, encoding Queclink ASCII (templates por env),
  comando cru via `parameters.metadata.raw_command`, respostas `command_response`
  → `executed`, falhas explícitas (sem IMEI, sem encoder, erro de escrita) e
  **timeout → `failed`** (validado de ponta a ponta com banco real).
- Feature flag `COMMANDS_DISPATCH_ENABLED` (default off) preserva o comportamento do baseline.

### 4. Notificações e testes (tarefas 4.1–4.3)
- Tabela `notifications` + rota real (GET com filtros/paginação, PATCH persistido,
  PATCH sem ids = marcar todas); alimentada na criação de alerts (tracker-server).
  Dados estáticos eliminados; consumidores enviam Bearer token.
- Suíte de integração nova (`tests/integration/`, `pnpm run test:integration`):
  20 testes cobrindo auth (registro/login/credencial inválida), vehicles (CRUD +
  placa duplicada), commands (criar/confirmar/token inválido/dupla confirmação/paginação),
  alerts (listar/ack persistido), users (gate RBAC), notifications (round-trip),
  settings (round-trip) e reports (conteúdo reflete viagem semeada).
- CI (`.github/workflows/ci.yml`): job de validação (typecheck/lint/unit/build) +
  job de integração com PostgreSQL efêmero e migrações aplicadas.
- E2E: smoke HTTP de 13 passos contra servidor real (registro → seed RBAC → login →
  gate admin → veículo → comando pendente → token inválido → confirmação →
  histórico → settings → relatório+CSV → geofence CRUD). **E2E de navegador
  (Playwright) não foi instalado** — ver riscos residuais.

### 5. Hardening (tarefas 5.1–5.4)
- TLS: produção usa `rejectUnauthorized: true` com CA via `DATABASE_CA_CERT`
  (`DATABASE_SSL=disable` para redes privadas); documentado no `.env.example`.
- Toasts: consolidado em `sonner` (Toaster global montado no layout raiz — antes os
  toasts sonner **não apareciam** por falta de Toaster); `react-hot-toast` e
  `react-toastify` removidos.
- UI: `tabs-fixed.tsx` e `ScrollArea.tsx` duplicados removidos (consumidores migrados);
  `SimpleTooltip` exportado de `components/ui/Tooltip.tsx` e adotado (Sidebar,
  VehicleCommands); botões de sirene/faróis deixaram de **simular** sucesso e chamam a API real.
- Dependências removidas (9): node-fetch, @types/node-fetch, turbo, cmdk, input-otp,
  vaul, jspdf-autotable, caniuse-lite, pg-connection-string (mantidos drizzle-kit,
  react-day-picker, xlsx, jspdf — todos com uso verificado).

## Riscos residuais

1. **E2E de navegador**: o fluxo feliz foi validado por smoke HTTP + integração, não por
   Playwright em navegador real. Follow-up: adicionar Playwright quando o ambiente de CI
   permitir download de browsers.
2. **Encoders de comando Teltonika/Concox**: comandos nesses protocolos falham
   explicitamente (sem encoder binário). Follow-up por modelo de dispositivo real.
3. **Templates Queclink**: defaults da família GV; ajustar por env (`QUECLINK_CMD_<TYPE>`)
   conforme o modelo em campo. Nunca testado contra dispositivo físico.
4. **Rotas de exportação de monitoramento/análise** (`/api/monitoring/export`,
   `/api/analytics/export`): fora do escopo deste change; verificar na próxima iteração.
5. **WebSocket de notificações**: a inserção em banco não publica no WebSocket
   automaticamente (o canal `ws` existente segue funcionando para posições).
   Follow-up: publicar via `notifyChange`/Redis pub-sub ao inserir notificação.
