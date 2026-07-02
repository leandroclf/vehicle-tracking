# Delta for tracking

## MODIFIED Requirements

### Requirement: Position history
The system SHALL serve vehicle position history from the persisted `events`
table, scoped to the authenticated user's vehicles, with time-window filtering
and pagination.

#### Scenario: History with data
- GIVEN a vehicle with recorded events
- WHEN the user requests its position history for a window
- THEN the system SHALL return the real recorded positions in that window

## ADDED Requirements

### Requirement: Command dispatch to device
The system SHALL deliver confirmed commands to the tracking device through the
tracker server and reflect the real outcome in the command state machine
(`sent_to_device` → `executed` with device response, or → `failed` with an
error message; timeout implies `failed`). Dispatch SHALL be controllable by a
feature flag; when disabled, commands remain recorded and auditable without
delivery.

#### Scenario: Successful execution
- GIVEN a confirmed command and dispatch enabled
- WHEN the device acknowledges execution
- THEN the command status SHALL become `executed` with the device response

#### Scenario: Timeout
- GIVEN a confirmed command and dispatch enabled
- WHEN no device response arrives within the configured timeout
- THEN the command status SHALL become `failed` with a timeout error message
