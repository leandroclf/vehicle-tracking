# Delta for monitoring

## MODIFIED Requirements

### Requirement: Health check
The system SHALL expose a health indicator for runtime availability without requiring unsupported build-time bypasses.

#### Scenario: Runtime probe
- GIVEN the application is running
- WHEN a health probe is executed
- THEN the system SHALL return a health result

### Requirement: Dependency health
The system SHALL expose health status for critical configured dependencies.

#### Scenario: Database availability
- GIVEN the database dependency is configured
- WHEN health is evaluated
- THEN the system SHALL report the dependency state

## ADDED Requirements

### Requirement: Operational traceability
The system SHALL record operational events needed for debugging and auditability within the supported logging model.

#### Scenario: Important operation
- GIVEN an important operational event
- WHEN the event occurs
- THEN the system SHALL emit a traceable record

