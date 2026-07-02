# Delta for monitoring

## ADDED Requirements

### Requirement: Automated release confidence
The system SHALL be validated by automated integration tests against an
ephemeral database and by at least one end-to-end happy-path flow, executed in
CI as merge/release gates, in addition to the baseline suite
(typecheck, lint, unit tests, production build).

#### Scenario: Integration suite
- GIVEN the CI pipeline runs for a change
- WHEN the integration suite executes against an ephemeral PostgreSQL
- THEN failures SHALL block the merge

#### Scenario: E2E smoke
- GIVEN a merged change
- WHEN the e2e happy path (login → dashboard → command) runs
- THEN a failure SHALL block the release

### Requirement: Verified database TLS in production
The system SHALL connect to the production database with certificate
verification enabled (trusted CA), never with `rejectUnauthorized: false`.

#### Scenario: Production connection
- GIVEN the production environment provides a CA certificate
- WHEN the application connects to PostgreSQL
- THEN the connection SHALL verify the server certificate against that CA
