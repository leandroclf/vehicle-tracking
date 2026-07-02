# Delta for analytics

## MODIFIED Requirements

### Requirement: Dashboard metrics
The system SHALL provide consolidated fleet metrics for the selected scope and time range using a documented contract.

#### Scenario: Supported filters
- GIVEN a valid scope and time range
- WHEN the user opens the analytics dashboard
- THEN the system SHALL return metrics for that selection

### Requirement: Data export
The system SHALL allow exporting analytics results in the supported production formats only.

#### Scenario: Export request
- GIVEN a valid analytics selection
- WHEN the user requests export
- THEN the system SHALL return an export in a supported format

## ADDED Requirements

### Requirement: Analytics contract stability
The system SHALL keep analytics component inputs aligned with the public analytics data contract.

#### Scenario: Dashboard cards
- GIVEN an analytics card or chart component
- WHEN it receives dashboard data
- THEN it SHALL not depend on undocumented field aliases

