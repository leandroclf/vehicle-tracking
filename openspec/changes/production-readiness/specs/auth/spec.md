# Delta for auth

## MODIFIED Requirements

### Requirement: User sign-in
The system SHALL authenticate an existing user with valid credentials and establish an authenticated session using the supported session contract.

#### Scenario: Valid credentials
- GIVEN an existing user account
- WHEN the user submits valid credentials
- THEN the system SHALL create or return an authenticated session

#### Scenario: Invalid credentials
- GIVEN an existing user account
- WHEN the user submits invalid credentials
- THEN the system SHALL reject authentication

### Requirement: MFA setup and verification
The system SHALL support multi-factor authentication setup and verification only for the providers defined as supported in the current baseline.

#### Scenario: Supported provider
- GIVEN a supported MFA provider
- WHEN the user starts setup
- THEN the system SHALL return the expected setup response for that provider

### Requirement: Phone OTP flow
The system SHALL expose phone OTP behavior only if the phone OTP path is explicitly supported in the baseline.

#### Scenario: Unsupported legacy path
- GIVEN a phone OTP integration that is not part of the production baseline
- WHEN a client attempts to rely on unsupported behavior
- THEN the system SHALL return a clear failure or unsupported response

## ADDED Requirements

### Requirement: Authentication contract consistency
The system SHALL use a single documented authentication context shape for protected UI and API consumers.

#### Scenario: Protected UI consumption
- GIVEN a protected page or component
- WHEN it reads authentication state
- THEN it SHALL use the same supported context fields as the rest of the application

