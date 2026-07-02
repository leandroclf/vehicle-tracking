# Delta for users-drivers

## ADDED Requirements

### Requirement: Persisted role model
The system SHALL persist user roles in the database (`roles`,
`profiles.role_id`) and evaluate administrative permissions server-side from
that model.

#### Scenario: Admin lists users
- GIVEN a user whose profile role is `Administrador`
- WHEN they request the user list
- THEN the system SHALL return the users within scope

#### Scenario: Non-admin is rejected
- GIVEN an authenticated user without the `Administrador` role
- WHEN they request an administrative operation
- THEN the system SHALL reject with 403

#### Scenario: Role model absent
- GIVEN the RBAC tables are not provisioned
- WHEN any administrative operation is requested
- THEN the system SHALL fail closed (no access granted)

### Requirement: Role assignment
The system SHALL allow an administrator to change another user's role, and the
change SHALL take effect without requiring the target user to re-authenticate.

#### Scenario: Assign role
- GIVEN an administrator and an existing target user
- WHEN the administrator assigns a valid role
- THEN the system SHALL persist `profiles.role_id` and return the updated value
