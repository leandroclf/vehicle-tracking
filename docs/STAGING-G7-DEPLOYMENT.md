# Manual staging deployment — operator checklist

This workflow is an **opt-in staging deployment**. It must not be run before
independent staging infrastructure and access controls are configured.

## Prerequisites

1. GitHub environment `staging` exists, has explicit reviewer protection and
   a deployment branch restriction to `main`.
2. `STAGING_CLOUDFLARE_ACCOUNT_ID` and `STAGING_CLOUDFLARE_API_TOKEN` are
   **staging environment secrets** only. Use a Cloudflare token narrowly scoped
   to the staging Worker/resources; do not reuse production credentials.
3. `STAGING_HEALTH_URL` is an **environment variable** with an HTTPS hostname
   controlled by the team, pointing to staging only. Verify DNS and TLS.
4. `PLATFORM_READ_TOKEN` is a short-lived, read-only token capable of checking
   out the *private* `leandroclf/product-platform` repository. Keep it in the
   staging environment; prefer a narrowly scoped GitHub App token.
5. Review `wrangler.toml`, routes, DNS, bindings, associated services and
   runtime secrets; ensure staging cannot mutate production resources. The
   workflow does not run database migrations.
6. Require a manual `workflow_dispatch` from `main`. Never run this on
   untrusted pull request code. The platform verifier is pinned to the
   immutable merged G7 commit (`28d8d6c815b511b5e73002db3317dbdfd5f813f4`).

## Execution

The workflow validates the product, builds the Worker, deploys only
`--env staging`, then runs G7 with three consecutive HTTP 200 checks out of
five attempts. A failing probe fails the workflow, but it **does not rollback**
an already executed deployment.

## Explicit limitations and next gate

- This does not use G6's full release plan/rollback contract yet and does not
  prove the Cloudflare deployed revision matches the locally built commit.
- HTTP 200 is a point-in-time availability signal, not release identification.
- Before production promotion, add provider-authenticated deployment identity,
  an immutable artifact binding and a verified previous release/rollback path.
- When first testing, use independent staging resources with disposable data;
  inspect GitHub Actions output and Cloudflare deployment metadata manually.
- GitHub Actions is not executed automatically when this PR is merged.
- No production workflow, environment or secret is intentionally modified.
