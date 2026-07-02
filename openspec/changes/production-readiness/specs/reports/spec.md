# Delta for reports

## MODIFIED Requirements

### Requirement: Report generation
The system SHALL generate a report when the requested parameters are valid and within the supported scope.

#### Scenario: Valid request
- GIVEN valid report parameters
- WHEN the user requests generation
- THEN the system SHALL produce a report artifact or job result

### Requirement: Report download
The system SHALL provide a downloadable representation of an existing report if the report exists and is accessible.

#### Scenario: Existing report
- GIVEN an existing report
- WHEN the user requests download
- THEN the system SHALL provide the file or a supported download response

## ADDED Requirements

### Requirement: Report contract consistency
The system SHALL expose a consistent report shape to list, detail, and download flows.

#### Scenario: Shared report usage
- GIVEN a report displayed in the dashboard
- WHEN the user opens details or downloads it
- THEN the same report identity and metadata SHALL be used

