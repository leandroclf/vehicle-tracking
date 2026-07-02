# Design: Production Readiness Baseline

## Context
The repository is a brownfield Next.js vehicle tracking product with broad feature coverage and substantial contract drift between UI, API, and service layers.

The current state indicates:
- multiple supported capabilities already exist;
- some contracts are duplicated or outdated;
- build-time validation is partially bypassed;
- type and lint validation still expose large gaps.

## Goals and Constraints
### Goals
- Freeze the behavior of the capabilities already present in the product.
- Reduce ambiguity in shared contracts.
- Keep the scope incremental and production-oriented.
- Preserve supported user flows while marking unsupported legacy behavior explicitly.

### Constraints
- Do not redesign the product from scratch.
- Do not introduce new business capabilities.
- Prefer compatibility where the behavior is already in use.
- Avoid solutions that rely on bypassing validation.

## Proposed Architecture
Use the existing repository structure as the implementation boundary and normalize contracts around the currently supported runtime surfaces:
- App Router pages remain the main UI entry points.
- `/api/*` routes remain the contract boundary for server behavior.
- Shared domain and client contracts must be converged where the same entity is consumed in multiple layers.
- Legacy shims should be isolated or deprecated rather than silently kept as implied behavior.

## Technical Decisions
### Decision 1: Brownfield baseline over rewrite
Decision: stabilize the current product instead of rebuilding architecture.
Rationale: the repository already has business coverage and the main risk is drift, not lack of features.
Trade-offs: contract cleanup is broader than a greenfield spec, but lower risk than replacement.
Consequences: multiple capability deltas are needed before implementation work begins.

### Decision 2: Canonical contracts per entity
Decision: define one supported contract for auth, vehicle, alert, report, and monitoring consumers.
Rationale: type errors show that the same data is represented differently across layers.
Trade-offs: some legacy aliases may be removed from supported behavior.
Consequences: downstream UI and API code must align with the canonical shape.

### Decision 3: Validation must be explicit
Decision: production readiness cannot rely on `ignoreBuildErrors` or `ignoreDuringBuilds`.
Rationale: a build that skips validation does not prove correctness.
Trade-offs: the baseline may require additional cleanup work before release.
Consequences: CI and local validation become part of the definition of done.

## Alternatives Considered
### Alternative 1: Rewrite to a new stack
Description: replace the current app with a fresh implementation.
Why not chosen: too expensive and unnecessary for the current problem.

### Alternative 2: Keep legacy contracts indefinitely
Description: preserve all current shapes and compatibility paths.
Why not chosen: it perpetuates ambiguity and makes production validation unreliable.

## Affected Components
| Component | Change | Reason |
|---|---|---|
| Auth context and auth routes | Normalize supported session and MFA contracts | Current consumers reference divergent fields |
| Vehicle services and views | Align entity shape across server and client | Multiple vehicle property names are in use |
| Tracking and realtime layer | Preserve last known state and supported event contracts | Product depends on live telemetry |
| Geofences and alerts | Define supported event and acknowledgment behavior | These flows feed monitoring and dashboard surfaces |
| Analytics and reports | Freeze dashboard/export/report contracts | These are user-facing decision surfaces |
| Monitoring and health endpoints | Make operational readiness observable | Production support requires clear health status |

## Main Flows
### Flow 1: Authenticated user loads dashboard
1. User signs in.
2. Session state is established.
3. Dashboard reads the canonical auth context.
4. User sees the capabilities supported by the baseline.

### Flow 2: Vehicle tracking update
1. Telemetry arrives for a tracked vehicle.
2. The tracking state is updated.
3. Realtime clients receive the supported event.
4. The UI keeps the last known state if realtime delivery is interrupted.

### Flow 3: Alert and geofence handling
1. A tracked vehicle violates a supported rule.
2. The system records the relevant event.
3. The alert is returned to the authenticated user.
4. The user can acknowledge it.

## Error Flows
### Error Flow 1: Unsupported legacy request
1. Client invokes a deprecated or unsupported contract.
2. The system rejects the request or returns a clear unsupported response.
3. The unsupported path is not treated as production baseline behavior.

### Error Flow 2: Missing dependency
1. A critical dependency is unavailable.
2. Health reflects the degraded condition.
3. The UI or operator path can infer production risk from the health output.

## API / Contract Design
- Keep current route families as the public boundary.
- Standardize request/response contracts per capability.
- Normalize route context handling for parameterized App Router handlers.
- Explicitly define which legacy endpoints remain supported.

## Data Model and Persistence
- Vehicles, alerts, geofences, reports, and MFA state require explicit contract alignment with persistence.
- The design should preserve existing database usage while eliminating shape ambiguity.
- Retention and uniqueness rules should be documented before changing storage behavior.

## Authentication and Authorization
- Protected pages and APIs must depend on one documented auth context.
- Role checks must be explicit for management flows.
- Unsupported privilege paths must be rejected rather than inferred.

## Security and Privacy
- Sensitive values must not be logged in plain text.
- Build and runtime secrets must remain environment-driven.
- Exported reports and analytics should only expose authorized scope.
- Auditability must not leak unnecessary PII.

## Observability
### Logs
- Record key operational actions and failures.
- Avoid logging secrets or raw tokens.

### Metrics
- Track health and dependency availability.
- Track high-level feature health where available.

### Tracing
- Preserve traceable request flow across API and realtime operations when possible.

### Alerts
- Notify on dependency degradation and critical runtime failure conditions.

## Testing Strategy
- Unit tests for canonical contracts and pure business rules.
- Integration tests for API routes and database-related flows.
- Contract tests for parameterized routes and shared entity shapes.
- End-to-end validation for the primary dashboard, tracking, and auth flows.
- Manual validation only where external services cannot be fully mocked.

## Migration Strategy
- Introduce contract normalization incrementally.
- Keep temporary compatibility only where required to avoid breaking supported flows.
- Deprecate unsupported legacy paths in a controlled manner.

## Rollback Plan
- Revert contract changes per capability if a baseline delta introduces regression.
- Restore previous supported shapes only when the rollback is part of a tested compatibility path.
- Keep migrations reversible where data changes are introduced.

## Compatibility
- Existing consumers may depend on legacy aliases.
- Compatibility must be explicit, temporary, and documented.
- Unsupported legacy paths should not be silently preserved in the final baseline.

## Operational Considerations
- Remove build-time bypasses for validation before release.
- Keep the health endpoint and dependency checks aligned with actual runtime requirements.
- Ensure release validation includes lint, typecheck, tests, and build.

## Remaining Risks
| Risk | Impact | Mitigation | Owner/Decision |
|---|---|---|---|
| Large number of type mismatches across the codebase | High | Normalize contracts incrementally by capability | Engineering |
| Legacy and current shapes coexist | High | Freeze canonical contracts and mark unsupported aliases | Product + Engineering |
| Build validation is currently bypassed | High | Remove bypasses before release | Engineering |
| External dependencies may block end-to-end validation | Medium | Provide mocked or local test paths for validation | Engineering |

## Open Questions
- Which legacy aliases remain acceptable for the baseline?
- Which capabilities must be fully green before production approval?
- Should unsupported routes be removed now or deprecated first?
