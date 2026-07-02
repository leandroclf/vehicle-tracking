# Spec: Tracking

## Context
- Fato: existe experiência de tracking em tempo real, mapa e histórico.
- Fato: o produto trabalha com posição, ignição, movimento, velocidade e trajetória.
- Premissa: tracking é um capability operacional de alta criticidade.

## Behavior Contract
### Requirement: Live vehicle position
The system SHALL expose the latest available position for a tracked vehicle when telemetry exists.

### Requirement: Vehicle movement state
The system SHALL represent whether a vehicle is moving or stationary based on the tracked telemetry.

### Requirement: Telemetry history
The system SHALL provide historical tracking data for a vehicle when requested.

### Requirement: Real-time updates
The system SHALL propagate tracking updates to connected clients when new telemetry is received.

### Requirement: Tracking degradation
The system SHALL preserve last known tracking state when real-time delivery is temporarily unavailable.

## Open Questions
- Qual é a fonte de verdade da posição: API, websocket, banco ou cache?
- Qual atraso máximo é aceitável para “tempo real”?
- O sistema deve armazenar trilha histórica ilimitada ou com retenção?

