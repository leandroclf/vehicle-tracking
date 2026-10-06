# Repository boundary and lineage

Status: canonical candidate for the current Yukz vehicle-tracking product.

## Canonical scope

This repository owns the actively maintained vehicle-tracking application: authentication, fleet dashboard, realtime tracking, maps, geofences, alerts, reports and the runtime/integration surface required by those capabilities.

## Related repositories

- `vehicle-tracking-v2`: predecessor/reference implementation. Preserve unique connector or backend ideas until a capability comparison is complete; do not develop a second product line there.
- `yukz-track-palma-5708cc2d`: early frontend/reference implementation, especially historical Google Maps/Supabase decisions.
- `trakio-fleet-track`: prototype/reference; not a canonical Yukz runtime.
- `site-yukz` and `site-yukz-v2`: company/API-marketplace web properties, not predecessors of this tracking runtime.
- `yukz-flow`: workflow-automation product with a separate bounded context.

## Evolution rule

New vehicle-tracking work should land here unless a capability is intentionally extracted into a clearly reusable service. Before archiving a predecessor, compare connectors, migrations, operational scripts and documentation and migrate only unique capabilities that remain required.

Do not merge unrelated Yukz products into this repository merely to reduce repository count.
