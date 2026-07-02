# Delta for alerts

## MODIFIED Requirements

### Requirement: Alert generation
The system SHALL create an alert when a supported rule is violated and sufficient source data is available.

#### Scenario: Supported rule violation
- GIVEN an alert rule configured in the baseline
- WHEN the related condition is violated
- THEN the system SHALL create an alert

### Requirement: Alert retrieval
The system SHALL list alerts available to the authenticated user using the canonical alert contract.

#### Scenario: Dashboard load
- GIVEN an authenticated user
- WHEN the user opens the alerts view
- THEN the system SHALL return the alerts within scope

## ADDED Requirements

### Requirement: Alert acknowledgment
The system SHALL allow an authorized user to mark an alert as read or acknowledged.

#### Scenario: Single alert
- GIVEN an unread alert
- WHEN the user acknowledges it
- THEN the system SHALL persist the updated state

### Requirement: Bulk acknowledgment
The system SHALL allow an authorized user to acknowledge all visible alerts in one operation.

#### Scenario: Bulk action
- GIVEN multiple visible alerts
- WHEN the user marks all as read
- THEN the system SHALL update all applicable alerts

