# Delta for alerts

## ADDED Requirements

### Requirement: Persisted notifications
The system SHALL persist user notifications in the database and derive them
from real operational events (alert creation), scoped to the owning user via
the vehicle relationship.

#### Scenario: Alert generates notification
- GIVEN an alert is created for a vehicle owned by a user
- WHEN the alert is persisted
- THEN a notification row SHALL be created for that user

#### Scenario: Mark notification as read
- GIVEN an unread notification
- WHEN the user marks it as read
- THEN the system SHALL persist the read state (visible after reload)

#### Scenario: No fabricated data
- GIVEN a user with no operational events
- WHEN they list notifications
- THEN the system SHALL return an empty list, never sample/static data
