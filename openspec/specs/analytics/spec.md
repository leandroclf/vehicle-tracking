# Spec: Analytics

## Context
- Fato: o produto expõe dashboard analítico com filtros, exportação e cards de métricas.
- Fato: há métricas de frota, uso, segurança e alertas.
- Premissa: analytics consolida dados operacionais para decisão.

## Behavior Contract
### Requirement: Dashboard metrics
The system SHALL provide consolidated fleet metrics for the selected scope and time range.

### Requirement: Dashboard filtering
The system SHALL allow filtering analytics data by the supported filter dimensions.

### Requirement: Data export
The system SHALL allow exporting analytics results in the supported formats.

### Requirement: Security metrics
The system SHALL expose security-related metrics when the underlying data is available.

## Open Questions
- Quais filtros são obrigatórios no contrato público?
- Quais formatos de exportação são oficialmente suportados?
- Há limites de volume para consultas analíticas?

