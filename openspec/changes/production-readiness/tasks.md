# Tasks: Production Readiness Baseline

## 1. Spec and contract alignment

- [x] 1.1 Freeze canonical auth contracts
  - Objective: align auth context, session state, and supported MFA behavior.
  - Likely files/components: `src/lib/auth/*`, `src/app/api/auth/*`, auth-related pages and providers.
  - Depends on: `openspec/changes/production-readiness/specs/auth/spec.md`
  - Validation: contract, integration
  - Completion criteria: protected consumers use one supported auth shape and unsupported paths are explicit.
  - Result: canonical server auth is `@/lib/auth/auth-middleware` + `AuthService` (JWT real + Drizzle).
    The legacy shim `@/lib/auth-middleware` now delegates to the real `AuthService` (it previously used a mock);
    its `AuthResult` contract is frozen as `{ user, error?, status? }` and all consumers were migrated off
    `success`/`userId` aliases. Client auth is `useAuth` from `@/lib/auth/auth-context`. Phone OTP and other
    unsupported paths return explicit 501 responses. All auth mocks (`auth-service-mock`, `database-mock`,
    `users-service-mock`) were removed from the codebase.

- [x] 1.2 Freeze canonical vehicle contracts
  - Objective: align vehicle model fields across API, service, client, and dashboard screens.
  - Validation: unit, integration, contract
  - Completion criteria: vehicle consumers no longer rely on conflicting field names.
  - Result: one canonical client contract in `@/lib/vehicles-client` (`Vehicle` with cadastral `status`
    'active'|'inactive'|'maintenance' plus realtime fields `connection_status`, `ignition`, `is_moving`,
    `speed`, `last_position`, …) mapped from the real API payload (vehicles + vehicle_status via
    `VehiclesService`). The duplicate legacy `src/lib/vehicles.tsx` provider (mounted but never consumed)
    was deleted. Vehicle pages now call the real API for create/update/delete (previously simulated with
    `setTimeout`), and `VehicleForm` gained the `name` field required by the API.

- [x] 1.3 Freeze tracking and realtime contracts
  - Objective: standardize live position, history, and realtime event behavior.
  - Validation: integration, e2e, manual
  - Completion criteria: last known state and supported realtime updates behave as specified.
  - Result: last known state comes from `vehicle_status`; position history from `events`. The tracking
    hooks (`use-tracking`, `useMultiVehicleTracking`) and map components share the `Position`/`VehicleStatus`
    contracts exported from `tracking-service`. `ConnectionState` is frozen to
    'CONNECTING'|'CONNECTED'|'DISCONNECTED'|'RECONNECTING'|'FAILED'. HTTP write of telemetry
    (`PUT/POST /api/vehicles/status`) is explicitly unsupported (501) — telemetry is fed by the tracker server.

## 2. Operational capabilities

- [x] 2.1 Normalize geofence behavior
  - Completion criteria: geofence creation and monitoring follow one supported contract.
  - Result: geofences are scoped by `geofences.user_id`; the dashboard pages consume the
    `useGeofences` context contract; UI variants aligned to the shared component APIs.

- [x] 2.2 Normalize alert behavior
  - Completion criteria: alerts can be generated, listed, and acknowledged consistently.
  - Result: alerts have no `user_id` column — user scoping is via `vehicle_id → vehicles.user_id` join.
    The alerts page consumes the canonical `Alert` contract (`type`, `severity`, `acknowledged`) from
    `@/lib/alerts`; acknowledgment (single and bulk) flows through `markAsRead`/`markAllAsRead`.

- [x] 2.3 Normalize analytics and report contracts
  - Completion criteria: analytics/report consumers share stable supported payloads.
  - Result: analytics/report routes were reworked off nonexistent tables (`gpsPositions`,
    `dashboardConfigs`, `maintenanceSchedules`) onto the real schema (`events`, `vehicle_status`, `trips`).
    Report scheduling has no backend support and now fails explicitly (`scheduleReport`/`cancelSchedule`
    return `false` with an explicit error) instead of crashing.

## 3. Administration and monitoring

- [x] 3.1 Normalize users and drivers contracts
  - Completion criteria: admin flows use one supported identity model.
  - Result: `/api/users` now reads from the real `users` table with real JWT verification; the admin
    gate uses the same roles/profiles convention as the other admin routes and fails closed when RBAC
    tables are absent (see residual risks). Driver assignment flows read vehicles from
    `/api/vehicles/status` (canonical `{ vehicles }` payload).

- [x] 3.2 Normalize monitoring and health behavior
  - Completion criteria: health reflects real runtime conditions and configured dependencies.
  - Result: `/api/health` probes PostgreSQL (`SELECT 1`) and Redis (`PING`) and reports per-dependency
    state plus uptime/environment, matching the monitoring spec delta.

## 4. Release validation

- [x] 4.1 Remove validation bypasses from production baseline
  - Completion criteria: production baseline does not depend on build-time validation bypasses.
  - Result: `next.config.js` has `eslint.ignoreDuringBuilds: false` and `typescript.ignoreBuildErrors: false`.
    The build therefore runs full type checking and linting.

- [x] 4.2 Re-run full validation suite
  - Completion criteria: targeted validation passes and residual risks are documented.
  - Result (2026-07-02):
    - `pnpm run typecheck` → 0 errors (was 566 at the start of implementation)
    - `pnpm run lint` (`--max-warnings=0`) → clean
    - `pnpm test` → 5 suites, 12 tests, all passing
    - `pnpm run build` → compiled successfully, 59 pages generated
  - Residual risks: see `openspec/changes/production-readiness/VALIDATION.md`.
