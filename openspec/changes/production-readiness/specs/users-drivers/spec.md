# Delta for users-drivers

## MODIFIED Requirements

### Requirement: User administration
The system SHALL allow authorized management of users within the permitted scope using a single user identity contract.

#### Scenario: Administrative access
- GIVEN an authorized administrator
- WHEN the administrator manages users
- THEN the system SHALL apply the operation to users in scope

### Requirement: Driver administration
The system SHALL allow authorized management of drivers within the permitted scope using a single driver identity contract.

#### Scenario: Driver record
- GIVEN an authorized administrator
- WHEN the administrator manages a driver
- THEN the system SHALL persist the supported driver fields

### Requirement: Driver assignment
The system SHALL allow an authorized user to assign a driver to a vehicle when the assignment is valid.

#### Scenario: Valid assignment
- GIVEN a vehicle and a driver within scope
- WHEN the user assigns the driver
- THEN the system SHALL persist the assignment

