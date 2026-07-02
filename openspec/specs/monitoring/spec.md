# Spec: Monitoring

## Context
- Fato: existem endpoints e telas de health/monitoring.
- Fato: o sistema depende de banco, realtime e integrações externas.
- Premissa: observabilidade é necessária para operação em produção.

## Behavior Contract
### Requirement: Health check
The system SHALL expose a health indicator for runtime availability.

### Requirement: Dependency health
The system SHALL expose health status for critical dependencies when configured.

### Requirement: Operational events
The system SHALL record operational events needed for debugging and auditability.

### Requirement: Exported monitoring data
The system SHALL allow exporting monitoring information when requested by authorized users.

## Open Questions
- Quais integrações são consideradas críticas para o health check?
- Quais eventos precisam ser auditados obrigatoriamente?
- Há requisitos formais de métricas e alertas?

