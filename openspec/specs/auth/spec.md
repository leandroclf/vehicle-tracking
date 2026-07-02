# Spec: Authentication

## Context
- Fato: o repositório expõe login, registro, logout, recuperação de senha, atualização de senha, MFA e autenticação por telefone.
- Fato: a aplicação usa contexto de autenticação cliente e rotas `/api/auth/*`.
- Premissa: a autenticação é um capability central e afeta múltiplas áreas do produto.

## Behavior Contract
### Requirement: User sign-in
The system SHALL authenticate an existing user with valid credentials and establish an authenticated session.

### Requirement: User sign-up
The system SHALL allow creation of a new user account when the submitted data is valid and the account does not already exist.

### Requirement: Session termination
The system SHALL invalidate the active session when the user signs out.

### Requirement: Password recovery
The system SHALL support password reset flows for users who can prove ownership of the account.

### Requirement: MFA setup and verification
The system SHALL support multi-factor authentication setup and verification for supported providers.

### Requirement: Phone OTP flow
The system SHALL support phone-based OTP request and verification flows when the required integration is available.

## Open Questions
- Quais provedores sociais precisam permanecer oficialmente suportados?
- MFA é obrigatório para algum perfil específico?
- O fluxo de telefone é produção-ready ou apenas compatível com legado?

