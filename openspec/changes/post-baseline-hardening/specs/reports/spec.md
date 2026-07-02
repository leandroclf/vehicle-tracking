# Delta for reports

## MODIFIED Requirements

### Requirement: Report generation
The system SHALL generate reports from real persisted data (`events`, `trips`,
`alerts`) and persist report metadata so reports can be listed and downloaded
after generation.

#### Scenario: Generate and download
- GIVEN an authenticated user with tracked vehicles
- WHEN they generate a report for a period with data
- THEN the report SHALL be persisted, listed, and downloadable

#### Scenario: No fabricated data
- GIVEN a report request over a period with no data
- WHEN the report is generated
- THEN it SHALL reflect the empty period, never sample/static data

## ADDED Requirements

### Requirement: Settings persistence
The system SHALL persist user preferences and notification settings so they
survive re-authentication.

#### Scenario: Preference round-trip
- GIVEN a user updates a preference
- WHEN they log out and log in again
- THEN the persisted preference SHALL be returned
