# Product event contract

This repository is the first reference implementation of the portfolio Product Harness.

The schema in `contracts/product-event.schema.json` defines the stable envelope. It deliberately excludes arbitrary properties so sensitive domain data cannot casually leak into product analytics.

## Privacy boundary

Do not add raw GPS coordinates, IMEI, email, phone, access tokens or vehicle/person identifiers to this generic event. Use opaque user/account IDs and product-owned operational telemetry for domain diagnostics.

## Next implementation slice

1. create a small server-side emitter interface;
2. emit `activation_completed` after the first successful tracking setup;
3. emit `feature_used` for selected high-value capabilities;
4. add a server-side entitlement contract;
5. emit idempotent `limit_reached` events;
6. connect the event adapter to the selected analytics provider only after contract tests pass.
