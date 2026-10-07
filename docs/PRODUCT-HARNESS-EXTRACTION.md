# Product Harness extraction boundary

Canonical reusable owner: the `harness` package of `leandroclf/product-platform` (`packages/harness`), consumed through `harness-v*` releases.

## Move to product-platform-harness

### core
- product-platform-harness/events.ts generic runtime behavior
- product-platform-harness/entitlements.ts
- composite sink behavior

### growth
- posthog adapter
- sales-signals
- sales outbox and worker
- HubSpot adapter
- commercial identity boundary (interface; product-specific DB resolver stays in product)

### commerce
- payments/gateway.ts
- payments/types.ts
- payments/http.ts
- payments/factory.ts
- Stripe adapter
- Mercado Pago adapter
- webhook verification/normalization
- generic inbox/idempotency/payment ledger behavior

### economics
- generic FinOps queries/projections after authoritative fee/cost fields exist

## Stay in vehicle-tracking

- users/vehicles/trips/events/alerts/geofences/commands
- Teltonika tracker/protocol
- vehicle-specific capability names and limits
- Next.js route wiring
- database connection bootstrap
- resolver mapping vehicle user/account to Harness tenant context
- deployment configuration

## Removal gate

No local reusable implementation is deleted until:
1. product-platform-harness package exists at an immutable version;
2. equivalent unit/contract/integration tests are green there;
3. vehicle-tracking consumes the pinned package;
4. vehicle integration tests and build are green;
5. deployment migrations are backward compatible.

## Runtime topology

The Harness is linked into the existing product process. It is not a new HTTP service. The sales/outbox worker may remain a second process but consumes the same product-owned PostgreSQL database.
