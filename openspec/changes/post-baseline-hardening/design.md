# Design: Post-Baseline Hardening

## Context
O baseline `production-readiness` congelou contratos e marcou caminhos não
suportados como explícitos. Este change preenche os contratos já publicados com
implementações reais, sem alterar shapes consumidos pela UI.

## Goals and Constraints
### Goals
- Destravar RBAC, dados reais, despacho de comandos, notificações e testes.
- Reduzir débito de segurança (TLS) e de manutenção (UI/deps).

### Constraints
- Não quebrar os contratos congelados no baseline (mudanças aditivas).
- Migrações de banco reversíveis e idempotentes.
- Manter a suíte de validação do baseline verde em todos os passos.

## Technical Decisions

### Decision 1: RBAC mínimo persistido, fail-closed preservado
Criar migração aditiva:
```sql
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id);
```
Seed: papéis `Administrador`, `Gerente`, `Usuário`; atribuição inicial de
`Administrador` via variável `ADMIN_EMAIL` no script de seed (não em runtime).
As rotas admin já consultam exatamente esse modelo (`/api/roles`,
`/api/users/[id]/role`, gate de `/api/users`) — nenhuma mudança de contrato,
apenas o banco passa a existir. Adicionar as tabelas ao `src/lib/schema.ts`
(Drizzle) e a `migrations/init.sql`.
Trade-off: papéis simples, sem permissões granulares — suficiente para os fluxos
de tela existentes.

### Decision 2: Completar rotas sobre as tabelas reais existentes
- `/api/vehicles/positions`: histórico = `events` filtrado por
  `vehicle_id`/janela de tempo (mesma fonte usada por analytics).
- `/api/settings/*`: persistir em `user_settings (user_id uuid PK, preferences
  jsonb, notifications jsonb, updated_at)` — jsonb evita churn de migração.
- `/api/reports/*`: persistir metadados de relatório em `reports (id, user_id,
  type, params jsonb, status, file_ref, created_at)`; geração síncrona no
  baseline (sem fila), arquivos em disco/objeto conforme ambiente.
- `/api/geofences`: completar trechos TODO com Drizzle sobre a tabela
  `geofences` existente.
Regra: se algum sub-recurso não puder ser completado, rebaixar para 501
explícito — nunca dados fabricados.

### Decision 3: Despacho de comandos via tracker-server com máquina de estados
O fluxo de confirmação já persiste `pending_confirmation → sent_to_device`.
Adicionar o despacho real: o tracker-server (processo já existente em
`tracker-server/`) expõe canal de comando; a API publica o comando e um
callback/polling atualiza `commands.status`:
`sent_to_device → executed` (com `response` jsonb) ou `→ failed`
(com `error_message`), timeout configurável (default 60s → `failed`).
Feature flag `COMMANDS_DISPATCH_ENABLED` para permitir rollout gradual;
desligada, o comportamento atual (registro auditável) é mantido.

### Decision 4: Notificações persistidas alimentadas por alertas
Tabela `notifications (id serial, user_id uuid, type, title, message, link,
read boolean default false, created_at)`. Fonte inicial: trigger de aplicação ao
criar `alerts` (join `vehicles.user_id`). A rota `/api/notifications` mantém o
shape atual; o WebSocket de notificações passa a emitir a partir da inserção.

### Decision 5: Testes em duas camadas
- **Integração**: Testcontainers (PostgreSQL) + Jest, cobrindo auth (login/me),
  vehicles CRUD (incl. placa duplicada), commands (criar/confirmar/expirar),
  alerts (listar/ack) e users (gate de RBAC). Job de CI separado.
- **E2E**: Playwright com 1 fluxo feliz (login → dashboard → enviar comando →
  ver histórico), rodando contra `docker-compose.dev.yml`.

### Decision 6: Hardening de infra e manutenção
- TLS: `ssl: { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT }`
  quando `DATABASE_CA_CERT` presente; documentar no `.env.example`.
- Toast: padronizar em `sonner`; remover `react-hot-toast` e `react-toastify`
  após migrar os call sites.
- UI: remover `tabs-fixed.tsx` e `ScrollArea.tsx` duplicados (migrar consumidores
  para `Tabs.tsx`/`scroll-area.tsx`); exportar `SimpleTooltip({content, children})`
  de `components/ui/Tooltip.tsx` e substituir os wrappers ad-hoc
  (VehicleCommands, Sidebar, VehicleCard).
- Deps: remover dependências sem importadores (verificar com knip/depcheck).

## Alternatives Considered
- **RBAC via claims no JWT**: rejeitado — exigiria re-login para mudança de papel
  e diverge do modelo que as rotas já consultam.
- **Fila (BullMQ) para geração de relatórios**: adiado — volume atual não
  justifica; a decisão 2 mantém a porta aberta (status em tabela).
- **Mock do tracker-server para e2e**: aceito parcialmente — o e2e usa o
  simulador já existente no repositório.

## Affected Components
| Componente | Mudança | Motivo |
|---|---|---|
| `migrations/`, `src/lib/schema.ts` | + roles, profiles.role_id, notifications, user_settings, reports | Decisões 1, 2, 4 |
| `/api/vehicles/positions`, `/api/settings/*`, `/api/reports/*`, `/api/geofences` | Completar com Drizzle | Decisão 2 |
| `/api/commands*`, `tracker-server/` | Despacho + máquina de estados | Decisão 3 |
| `/api/notifications`, WebSocket | Persistência real | Decisão 4 |
| CI, `jest.config.js`, novo `e2e/` | Testcontainers + Playwright | Decisão 5 |
| `src/lib/database.ts`, componentes de UI, `package.json` | TLS, consolidações | Decisão 6 |

## Migration Strategy
1. Migrações de banco primeiro (aditivas, com seeds idempotentes).
2. Rotas completadas por capacidade, cada uma com testes de integração no mesmo PR.
3. Despacho de comandos atrás de feature flag; ligar em staging antes de produção.
4. Consolidações de UI/deps por último (sem dependências das demais).

## Rollback Plan
- Migrações com `down` documentado; seeds idempotentes permitem re-execução.
- Feature flag desliga o despacho sem revert de código.
- Consolidações de UI revertíveis por commit isolado.

## Testing Strategy
- Cada tarefa inclui testes de integração próprios (Testcontainers).
- Suíte do baseline (typecheck, lint, unit, build) permanece obrigatória.
- E2E como smoke gate no CI após merge.

## Remaining Risks
| Risco | Impacto | Mitigação |
|---|---|---|
| Protocolo do tracker-server exigir extensão maior que o previsto | Médio | Spike técnico (tarefa 3.1) antes de comprometer a integração |
| Seeds de RBAC em ambientes já populados | Baixo | Seed idempotente por nome de papel |
| Playwright flakiness no CI | Baixo | Fluxo único, retries=1, artefatos de trace |
