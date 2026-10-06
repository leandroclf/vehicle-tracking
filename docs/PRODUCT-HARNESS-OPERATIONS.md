# Product Harness operations

## Runtime flags

The Product Harness is safe by default.

- `POSTHOG_PROJECT_TOKEN`: enables server-side PostHog delivery. When absent, structured logs remain active.
- `POSTHOG_HOST`: optional PostHog ingest host.
- `POSTHOG_TIMEOUT_MS`: optional bounded delivery timeout; default 1500 ms.
- `FREE_GEOFENCE_LIMIT`: enables geofence entitlement enforcement. When absent, no geofence limit is applied.
- `HUBSPOT_ACCESS_TOKEN`: reserved for the CRM delivery worker. Do not expose it to the browser.

## Required database migration before enabling a geofence limit

Apply:

`migrations/20261006_sales_signal_outbox.sql`

before setting `FREE_GEOFENCE_LIMIT`. The limit path persists a deduplicated commercial signal in PostgreSQL.

## Privacy boundaries

Generic Product Events use opaque identifiers only. Do not add email, phone, name, GPS coordinates, address, plate, VIN, IMEI, SIM, tokens or command payloads.

Commercial PII is resolved server-side only at the CRM delivery boundary.

## Delivery state

PostHog delivery is active when configured.

HubSpot delivery is intentionally not connected to request handlers. Commercial signals are persisted in `sales_signal_outbox`; a bounded outbox worker must claim pending rows, deliver them through `HubSpotSalesSignalSink`, and mark success/failure before production CRM automation is considered enabled.

## Funnel milestones

- `signup_completed`: successful account registration.
- `activation_completed`: successful first-class activation action; currently vehicle creation.
- `limit_reached`: server-side entitlement denial.
- `feedback_submitted`: used by products that persist explicit feedback.

Do not infer revenue or conversion metrics until production telemetry is configured and measured.
