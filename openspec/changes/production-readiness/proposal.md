# Proposal: Production Readiness Baseline

## Change ID
`production-readiness`

## Status
Implemented — validated on 2026-07-02 (see `VALIDATION.md`)

## Context
This repository already contains a substantial vehicle tracking product with authentication, vehicle management, tracking, geofences, alerts, analytics, reports, user management, and operational monitoring.

The current codebase also shows clear signs of incomplete production hardening:
- build validation is bypassed in the Next.js configuration;
- type safety is not enforced end-to-end;
- lint output still reports warnings treated as blockers;
- several capabilities expose legacy and modern contracts at the same time;
- production behavior is not yet frozen in an explicit spec set.

## Problem
The product is functionally broad, but its current behavior is not fully specified or validated as a production baseline.

That creates three risks:
- implementation drift across capabilities and contracts;
- release confidence based on build success instead of verified correctness;
- unclear scope for what is actually supported in production.

## Goals
- Establish a production baseline for the current vehicle tracking product.
- Freeze observable behavior for the capabilities already present in the codebase.
- Remove ambiguity around supported contracts, dependencies, and operational expectations.
- Prepare the repository for implementation work that can be validated against specs and tests.

## Non-Goals
- Rewriting the entire application architecture.
- Introducing new product capabilities not already represented in the codebase.
- Choosing a new stack or migrating to a different hosting model.
- Implementing all technical fixes in this change proposal itself.

## Users / Actors Impacted
- End users of the tracking platform.
- Fleet administrators.
- Dispatch or operations staff.
- Drivers.
- Support and operations teams.
- Engineering teams maintaining the product.

## Scope
### In scope
- Authentication and session behavior.
- Vehicle lifecycle behavior.
- Tracking and telemetry behavior.
- Geofence monitoring behavior.
- Alert generation and acknowledgment behavior.
- Analytics and reporting behavior.
- User and driver administration behavior.
- Operational monitoring and health behavior.
- Contract clarification for legacy vs current APIs.

### Out of scope
- Full UI redesign.
- New third-party vendor selection.
- Infrastructure migration.
- Performance tuning beyond what is needed to define supportable behavior.
- Product features not already visible in the repository.

## Product Requirements Summary
- The platform must support authenticated vehicle tracking workflows end-to-end.
- Core dashboard capabilities must remain consistent across screens and APIs.
- Operational behavior must be explicit enough for automated validation.
- Ambiguous legacy contracts must be resolved or marked as unsupported.

## Business Rules
- Authentication SHALL be required for protected operations.
- Vehicle records SHALL remain scoped to the authenticated user or tenant boundary defined by the product.
- Tracking events SHALL preserve the latest known state when real-time delivery is unavailable.
- Geofence violations and other alerts SHALL be attributable to a concrete vehicle or operational entity when data exists.
- Reports and analytics SHALL be reproducible from defined input scopes.

## Affected Capabilities
- `auth`
- `vehicles`
- `tracking`
- `geofences`
- `alerts`
- `analytics`
- `reports`
- `users-drivers`
- `monitoring`

## Expected Impact
### Code
- Existing routes, services, contexts, and UI contracts will need alignment with the frozen behavior.
- Legacy compatibility branches may need to be removed or isolated.

### Data
- Data contracts for vehicles, alerts, tracking, and MFA may need normalization.
- Retention and uniqueness rules may need explicit validation.

### APIs / Contracts
- Several route handlers will need deterministic request and response shapes.
- Route parameter conventions must be consistent with the framework runtime.

### Integrations
- Realtime delivery, maps, database access, and any OTP/MFA integration must be explicitly scoped.

### Operations
- Health and dependency reporting must be defined for production support.
- Build-time validation should not be bypassed in the final baseline.

### Security / Privacy
- Authentication, authorization, and session handling must be explicitly verified.
- Sensitive data exposure in logs, exports, and monitoring outputs must be bounded.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| The current codebase contains overlapping legacy and modern contracts. | High | Freeze supported behavior per capability and mark unsupported compatibility paths explicitly. |
| Production readiness may be assumed from build success even when validation is bypassed. | High | Require explicit lint/type/test validation in the baseline and remove bypasses from the final spec. |
| Scope is broad across many capabilities. | High | Split the baseline into capability deltas after proposal approval. |

## Success Criteria
- Each affected capability has a spec delta or explicit confirmation that no behavioral change is needed.
- Open questions that block production behavior are either answered or isolated as follow-up work.
- The baseline can be validated by tests or equivalent checks mapped to the frozen behavior.
- Unsupported legacy behavior is documented as out of scope or deprecated.

## Assumptions
- The repository is the source of truth for current product scope.
- Existing dashboard and API surfaces are intended to remain supported unless explicitly removed.
- The current codebase reflects a brownfield system rather than a greenfield rebuild.

## Open Questions
- Which legacy contracts are still intended to be supported in production?
- Which capabilities are mandatory for the first production baseline?
- Should validation focus on current behavior first, or should unsupported legacy paths be removed from the spec immediately?
