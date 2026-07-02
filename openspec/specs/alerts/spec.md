# Spec: Alerts

## Context
- Fato: existem telas, cards e APIs de alertas.
- Fato: alertas cobrem eventos como velocidade, geofence, bateria e operação.
- Premissa: alertas são consumidos por dashboard e notificações.

## Behavior Contract
### Requirement: Alert generation
The system SHALL create an alert when a configured rule is violated.

### Requirement: Alert retrieval
The system SHALL list alerts available to the authenticated user.

### Requirement: Alert acknowledgment
The system SHALL allow an authorized user to mark an alert as read or acknowledged.

### Requirement: Bulk acknowledgment
The system SHALL allow an authorized user to mark all visible alerts as read or acknowledged.

### Requirement: Alert prioritization
The system SHALL expose a severity or priority level for each alert.

## Open Questions
- "Read" e "acknowledged" são o mesmo conceito?
- Quais categorias de alerta são canônicas?
- Há SLA para geração e entrega do alerta?

