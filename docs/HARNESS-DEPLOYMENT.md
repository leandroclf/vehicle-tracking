# Harness-aware deployment sequence

The product pins an immutable `harness-v*` release of the platform repository (`leandroclf/product-platform`), verified by SHA-256 (see `vendor/README.md`). The Harness is embedded in the application; it is not independently deployed.

## Production sequence

1. install frozen dependencies and verify pinned Harness version
2. validate product-platform-kit/product-platform-harness contracts
3. unit + integration + build
4. build immutable application artifact
5. apply backward-compatible EXPAND migrations
6. deploy application
7. health check
8. smoke test
9. synthetic Harness checks (entitlement + usage; payment webhook in safe test environment)
10. observe error/latency/payment failure indicators

## Rollback

Application rollback must remain possible after EXPAND. Do not automatically run destructive down migrations.

## Contract phase

Destructive cleanup/column removal is a separate CONTRACT release after all deployed versions no longer require the old schema.

## Worker

The optional Harness worker is deployed from the same product release and must use the same schema compatibility window. Deploy application-compatible worker code only after EXPAND migrations.
