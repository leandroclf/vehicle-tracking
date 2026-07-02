# Spec: Vehicles

## Context
- Fato: o produto possui listagem, criação, atualização, exclusão e detalhes de veículos.
- Fato: veículos aparecem no dashboard, mapa, tracking e comandos remotos.
- Premissa: veículo é a unidade principal de rastreamento do domínio.

## Behavior Contract
### Requirement: Vehicle list
The system SHALL return the authenticated user's vehicles.

### Requirement: Vehicle creation
The system SHALL create a vehicle when the submitted payload is valid and the license plate is unique in the relevant scope.

### Requirement: Vehicle update
The system SHALL update an existing vehicle when the authenticated user owns the record.

### Requirement: Vehicle deletion
The system SHALL delete a vehicle when the authenticated user owns the record and the record exists.

### Requirement: Vehicle detail retrieval
The system SHALL return a vehicle detail view that includes the data required by dashboard and tracking screens.

## Open Questions
- Quais atributos são canônicos: `plate`, `licensePlate`, `deviceImei`, `deviceId`, `status`?
- O domínio suporta soft delete ou exclusão física?
- Placa e IMEI são únicos globalmente ou por tenant/usuário?

