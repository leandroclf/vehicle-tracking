# Delta for geofences

## MODIFIED Requirements

### Requirement: Geofence lifecycle
The system SHALL allow authorized users to create, view, update, and remove geofences within the supported ownership model.

#### Scenario: Authorized management
- GIVEN an authorized user
- WHEN the user manages a geofence
- THEN the system SHALL apply the operation if the geofence belongs to the allowed scope

### Requirement: Geofence monitoring
The system SHALL detect when a tracked vehicle enters or exits an active geofence using the supported telemetry inputs.

#### Scenario: Boundary crossing
- GIVEN a tracked vehicle and an active geofence
- WHEN the vehicle crosses the boundary
- THEN the system SHALL record the corresponding monitoring outcome

