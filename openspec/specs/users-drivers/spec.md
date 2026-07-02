# Spec: Users and Drivers

## Context
- Fato: o produto possui gestão de usuários e motoristas.
- Fato: há páginas para listagem, atribuição e perfil.
- Premissa: os dois conceitos podem ter regras distintas.

## Behavior Contract
### Requirement: User administration
The system SHALL allow authorized management of users within the permitted scope.

### Requirement: Driver administration
The system SHALL allow authorized management of drivers within the permitted scope.

### Requirement: Driver assignment
The system SHALL allow an authorized user to assign a driver to a vehicle when the assignment is valid.

### Requirement: Role management
The system SHALL enforce role-based access control for management actions.

## Open Questions
- Usuário e motorista são entidades distintas ou o mesmo registro com papéis?
- Quais papéis existem oficialmente?
- Há vínculo obrigatório entre motorista e veículo?

