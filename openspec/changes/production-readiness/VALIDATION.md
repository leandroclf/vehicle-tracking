# Validation Report: Production Readiness Baseline

Data: 2026-07-02
Change: `production-readiness`

## Resultado da suíte de validação

| Verificação | Comando | Resultado |
|---|---|---|
| Typecheck | `pnpm run typecheck` | 0 erros (baseline inicial: 566) |
| Lint | `pnpm run lint` (`--max-warnings=0`) | limpo |
| Testes | `pnpm test` | 5 suítes, 12 testes, todos passando |
| Build de produção | `pnpm run build` | sucesso, 59 páginas, sem bypasses |

`next.config.js` não usa `ignoreBuildErrors` nem `ignoreDuringBuilds` — o build de produção
executa validação real de tipos e lint (Decisão 3 do design).

## Principais decisões de contrato aplicadas

- **Auth**: serviço canônico `AuthService` (JWT + Drizzle) em `src/lib/auth/auth-service.ts`.
  O shim legado `src/lib/auth-middleware.ts` (usado por ~21 rotas) deixou de validar tokens com
  mock e passou a delegar ao serviço real. Todos os mocks de auth/usuários/banco foram removidos.
- **Veículos**: contrato cliente único em `src/lib/vehicles-client.tsx`; status cadastral
  (`active`/`inactive`/`maintenance`) separado do estado de conexão (`connection_status`).
  CRUD de veículos na UI usa a API real (antes era simulado com `setTimeout`).
- **Comandos**: `/api/commands` e `/api/commands/confirm` foram implementados de verdade sobre a
  tabela `commands` (eram esqueletos da era Supabase que sempre retornavam 404); token de
  confirmação e auditoria (IP/user-agent) persistidos em `parameters` (jsonb).
- **Alertas**: escopo por usuário via join `alerts.vehicle_id → vehicles.user_id`
  (a tabela `alerts` não tem `user_id`).
- **Caminhos não suportados são explícitos (501)**: OTP por telefone, escrita de telemetria via
  HTTP (`PUT/POST /api/vehicles/status`), partes do fluxo de reset de senha e agendamento de
  relatórios (falha explícita no contexto de reports).

## Riscos residuais documentados

1. **Modelo de RBAC não provisionado**: as rotas administrativas (`/api/roles`,
   `/api/users/[id]/role`, gate de admin de `/api/users`) consultam tabelas `roles` e coluna
   `profiles.role_id` que **não existem** nas migrações (`migrations/init.sql`). O comportamento é
   fail-closed (403/erro), nunca concessão indevida — mas os fluxos de administração de papéis só
   funcionarão após uma migração de RBAC. Follow-up recomendado: criar migração para `roles` +
   `profiles.role_id` e semear o papel `Administrador`.
2. **Rotas com TODOs de dados**: algumas rotas (`/api/vehicles/positions`, `/api/settings`,
   partes de `/api/reports/*`, `/api/geofences`) ainda contêm trechos herdados da migração
   Supabase→PostgreSQL com dados incompletos. Elas compilam e respondem com shapes estáveis,
   mas nem todas persistem/retornam dados reais. Cada uma exige verificação funcional individual.
3. **Integração de envio de comandos ao dispositivo**: o envio real ao rastreador (GPS/MQTT) está
   fora do baseline; comandos são registrados e marcados como `sent_to_device` para rastreabilidade,
   mas não há confirmação do dispositivo.
4. **Notificações**: `/api/notifications` usa auth real, porém ainda retorna **dados estáticos de
   exemplo** (não há tabela `notifications` nas migrações). O shape do payload está estável para a
   UI; a persistência real é follow-up.
5. **Testes**: a suíte automatizada cobre serviços núcleo (12 testes). Fluxos e2e de UI
   (login → dashboard → comando) não têm cobertura automatizada; validação foi por typecheck,
   lint, build e revisão de contrato.

## Sugestões de melhoria (fora do escopo do baseline)

- Migração de RBAC (`roles`, `profiles.role_id`) + seeds.
- Tabelas de `notifications` e persistência de configurações de dashboard.
- Testes de integração de API com banco efêmero (Testcontainers) para as rotas críticas.
- Substituir `ssl: { rejectUnauthorized: false }` em produção por CA verificada.
- Remover as dependências não usadas (`react-day-picker`, `xlsx` se não referenciada) e
  consolidar bibliotecas de toast (há `sonner`, `react-hot-toast` e `react-toastify`).
- Unificar os componentes duplicados de UI com case divergente (`Tabs.tsx` vs `tabs-fixed.tsx`,
  `ScrollArea.tsx` vs `scroll-area.tsx`).
