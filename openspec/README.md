# OpenSpec Index

This repository contains initial capability specs derived from the existing codebase.

## Specs
- `openspec/specs/auth/spec.md`
- `openspec/specs/vehicles/spec.md`
- `openspec/specs/tracking/spec.md`
- `openspec/specs/geofences/spec.md`
- `openspec/specs/alerts/spec.md`
- `openspec/specs/analytics/spec.md`
- `openspec/specs/reports/spec.md`
- `openspec/specs/users-drivers/spec.md`
- `openspec/specs/monitoring/spec.md`

## Changes
- `openspec/changes/production-readiness/` — **Implemented** (validated 2026-07-02;
  see `VALIDATION.md` in the change for results and residual risks).
- `openspec/changes/post-baseline-hardening/` — **Implemented** (validated
  2026-07-02; see `VALIDATION.md`): RBAC provisioned, data-complete routes,
  command dispatch behind feature flag, persisted notifications, integration
  test suite + CI, TLS and UI/deps hardening.

## Notes
- These are template specs, not implementation plans.
- They capture observable behavior, known facts, and open questions.
- Fill the open questions before freezing behavior for delivery.
