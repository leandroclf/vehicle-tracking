# Spec: Reports

## Context
- Fato: o produto possui geração, listagem, download e relatórios customizados.
- Fato: relatórios aparecem no dashboard e em APIs próprias.
- Premissa: relatórios precisam ser rastreáveis e reproduzíveis.

## Behavior Contract
### Requirement: Report generation
The system SHALL generate a report when the requested parameters are valid.

### Requirement: Report listing
The system SHALL list reports available to the authenticated user.

### Requirement: Report download
The system SHALL provide a downloadable representation of an existing report.

### Requirement: Custom report creation
The system SHALL allow users to create custom report requests within the supported scope.

## Open Questions
- Relatório é instantâneo, assíncrono ou ambos?
- Há expiração ou retenção de relatórios?
- Quais campos são obrigatórios para geração?

