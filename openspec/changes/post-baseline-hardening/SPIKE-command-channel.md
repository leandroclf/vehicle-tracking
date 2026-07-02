# Spike 3.1 — Canal de comandos do tracker-server

Data: 2026-07-02 · Decisão: **GO** para a tarefa 3.2

## Fatos levantados
- O tracker-server mantém conexões TCP em `tcpConnections: Map<socket, {imei, protocol}>`
  para três protocolos (Teltonika, Queclink, Concox) — é possível localizar o socket de um
  dispositivo pelo IMEI.
- Os decoders Queclink e Concox já interpretam pacotes `command_response` do dispositivo;
  o server.js apenas não os roteava.
- Não existia nenhum canal API → tracker-server (sem HTTP, sem LISTEN/NOTIFY, sem polling).
- API e tracker-server compartilham o mesmo PostgreSQL.

## Contrato adotado (implementado na 3.2)
- **Fila = banco**: a API grava `commands.status = 'sent_to_device'`; o
  `CommandDispatcher` (tracker-server/src/services/commands.js) faz polling
  (`COMMANDS_POLL_INTERVAL_MS`, default 5s) e entrega ao socket do IMEI.
- **Máquina de estados**: `sent_to_device → executed` (ao receber
  `command_response`, com o payload em `commands.response`) ou `→ failed`
  (dispositivo sem IMEI, protocolo sem encoder, erro de escrita ou timeout
  `COMMANDS_TIMEOUT_MS`, default 60s — varrido no próprio banco).
- **Encoding**: Queclink usa comandos ASCII (templates padrão da família GV,
  sobrescrevíveis por env `QUECLINK_CMD_<TYPE>`); qualquer protocolo aceita
  comando cru em `parameters.metadata.raw_command`. Teltonika (Codec12) e
  Concox (frame 0x80) não têm encoder — comandos nesses protocolos falham
  explicitamente com mensagem clara (nunca silenciosamente).
- **Feature flag**: `COMMANDS_DISPATCH_ENABLED=true` liga o despachante;
  desligado (default), o comportamento do baseline (registro auditável) é mantido.

## Riscos conhecidos
- Templates Queclink variam por modelo do dispositivo (mitigado por env).
- Correlação resposta↔comando usa o comando em voo mais antigo do IMEI
  (protocolos não ecoam id) — suficiente para 1 comando por vez por veículo.
