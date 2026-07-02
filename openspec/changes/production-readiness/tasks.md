# Tasks: Production Readiness Baseline

## 1. Spec and contract alignment

- [ ] 1.1 Freeze canonical auth contracts
  - Objective: align auth context, session state, and supported MFA behavior.
  - Likely files/components: `src/lib/auth/*`, `src/app/api/auth/*`, auth-related pages and providers.
  - Depends on: `openspec/changes/production-readiness/specs/auth/spec.md`
  - Validation: contract, integration
  - Completion criteria: protected consumers use one supported auth shape and unsupported paths are explicit.

- [ ] 1.2 Freeze canonical vehicle contracts
  - Objective: align vehicle model fields across API, service, client, and dashboard screens.
  - Likely files/components: vehicle services, client stores, dashboard vehicle pages.
  - Depends on: `openspec/changes/production-readiness/specs/vehicles/spec.md`
  - Validation: unit, integration, contract
  - Completion criteria: vehicle consumers no longer rely on conflicting field names.

- [ ] 1.3 Freeze tracking and realtime contracts
  - Objective: standardize live position, history, and realtime event behavior.
  - Likely files/components: tracking services, realtime hooks, map screens.
  - Depends on: `openspec/changes/production-readiness/specs/tracking/spec.md`
  - Validation: integration, e2e, manual
  - Completion criteria: last known state and supported realtime updates behave as specified.

## 2. Operational capabilities

- [ ] 2.1 Normalize geofence behavior
  - Objective: make geofence lifecycle and monitoring behavior explicit.
  - Likely files/components: geofence APIs, map components, geofence utilities.
  - Depends on: `openspec/changes/production-readiness/specs/geofences/spec.md`
  - Validation: integration, contract
  - Completion criteria: geofence creation and monitoring follow one supported contract.

- [ ] 2.2 Normalize alert behavior
  - Objective: align alert generation, retrieval, and acknowledgment flows.
  - Likely files/components: alert APIs, alert provider, dashboard alerts page.
  - Depends on: `openspec/changes/production-readiness/specs/alerts/spec.md`
  - Validation: integration, e2e
  - Completion criteria: alerts can be generated, listed, and acknowledged consistently.

- [ ] 2.3 Normalize analytics and report contracts
  - Objective: align dashboard metrics, exports, and report flows.
  - Likely files/components: analytics services, report routes, export UI.
  - Depends on: `openspec/changes/production-readiness/specs/analytics/spec.md`, `openspec/changes/production-readiness/specs/reports/spec.md`
  - Validation: contract, integration
  - Completion criteria: analytics/report consumers share stable supported payloads.

## 3. Administration and monitoring

- [ ] 3.1 Normalize users and drivers contracts
  - Objective: make user, driver, and assignment behavior explicit.
  - Likely files/components: user routes, driver routes, profile pages.
  - Depends on: `openspec/changes/production-readiness/specs/users-drivers/spec.md`
  - Validation: integration, e2e
  - Completion criteria: admin flows use one supported identity model.

- [ ] 3.2 Normalize monitoring and health behavior
  - Objective: define runtime and dependency health outputs.
  - Likely files/components: health endpoint, monitoring routes, logging paths.
  - Depends on: `openspec/changes/production-readiness/specs/monitoring/spec.md`
  - Validation: integration, observability
  - Completion criteria: health reflects real runtime conditions and configured dependencies.

## 4. Release validation

- [ ] 4.1 Remove validation bypasses from production baseline
  - Objective: ensure build confidence is based on real validation.
  - Likely files/components: Next config, CI validation entry points.
  - Depends on: design approval
  - Validation: build, lint, typecheck
  - Completion criteria: production baseline does not depend on build-time validation bypasses.

- [ ] 4.2 Re-run full validation suite
  - Objective: verify the final baseline against automated checks.
  - Likely files/components: repository-wide.
  - Depends on: all previous tasks
  - Validation: unit, integration, contract, e2e, observability
  - Completion criteria: targeted validation passes and residual risks are documented.
