# Delta for tracking

## MODIFIED Requirements

### Requirement: Live vehicle position
The system SHALL expose the latest available position for a tracked vehicle when telemetry exists and the vehicle is within the supported scope.

#### Scenario: Telemetry available
- GIVEN a tracked vehicle with position data
- WHEN the dashboard or tracking view requests its latest state
- THEN the system SHALL return the latest known position

### Requirement: Real-time updates
The system SHALL propagate tracking updates to connected clients through the supported realtime channel.

#### Scenario: New telemetry arrives
- GIVEN an active realtime client
- WHEN new telemetry is received
- THEN the client SHALL be eligible to receive the update

## ADDED Requirements

### Requirement: Tracking state consistency
The system SHALL keep the last known tracking state available when realtime delivery is unavailable.

#### Scenario: Realtime interruption
- GIVEN a temporary realtime interruption
- WHEN the user views the vehicle
- THEN the system SHALL preserve the last known state instead of failing silently

