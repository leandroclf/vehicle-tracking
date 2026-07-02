# Spec: Geofences

## Context
- Fato: há criação, listagem, edição e monitoramento de cercas virtuais.
- Fato: geofences aparecem no mapa e geram eventos/alertas.
- Premissa: violações de geofence são um evento de negócio relevante.

## Behavior Contract
### Requirement: Geofence lifecycle
The system SHALL allow authorized users to create, view, update, and remove geofences.

### Requirement: Geofence validation
The system SHALL reject invalid geofence geometry or incomplete definitions.

### Requirement: Geofence monitoring
The system SHALL detect when a tracked vehicle enters or exits an active geofence.

### Requirement: Geofence violation event
The system SHALL record a violation event when a monitored geofence rule is breached.

## Open Questions
- Geofences são por usuário, por frota ou globais?
- O monitoramento ocorre em tempo real ou por processamento assíncrono?
- Quais formatos geométricos são suportados?

