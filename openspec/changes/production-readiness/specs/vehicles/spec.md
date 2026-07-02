# Delta for vehicles

## MODIFIED Requirements

### Requirement: Vehicle list
The system SHALL return the authenticated user's vehicles using one canonical vehicle contract.

#### Scenario: Owned vehicles
- GIVEN an authenticated user
- WHEN the user requests vehicle list data
- THEN the system SHALL return only vehicles within that user's scope

### Requirement: Vehicle creation
The system SHALL create a vehicle when the submitted payload is valid and the canonical uniqueness rules are satisfied.

#### Scenario: Duplicate plate
- GIVEN a vehicle plate that already exists in the relevant scope
- WHEN the user submits a create request
- THEN the system SHALL reject the request

### Requirement: Vehicle detail retrieval
The system SHALL return the vehicle fields required by the dashboard and tracking views through the canonical contract.

#### Scenario: Vehicle detail page
- GIVEN an existing vehicle
- WHEN a user opens the detail view
- THEN the system SHALL return the data needed by the supported UI

## ADDED Requirements

### Requirement: Vehicle contract normalization
The system SHALL expose a consistent vehicle shape across APIs, client state, dashboard views, and tracking views.

#### Scenario: Shared consumers
- GIVEN a vehicle returned by an API
- WHEN a client dashboard or tracking screen consumes it
- THEN the same supported fields SHALL be available without requiring alternate legacy property names

