# Teltonika predecessor capability gap

The predecessor repository `vehicle-tracking-v2` contains a broader GPS/Teltonika integration surface than the current canonical repository:

- connector abstraction and registry;
- `TeltonikaConnector`;
- TCP handler/server manager;
- position model/provider boundary;
- Teltonika tests and a connection validation script;
- GPS implementation documentation.

The canonical `vehicle-tracking` repository currently exposes a `tracker-server/teltonika-decoder.js`, but the predecessor capabilities above must be compared before `vehicle-tracking-v2` is archived.

## Migration decision

Do **not** copy the predecessor backend wholesale. First compare protocol coverage, authentication/IMEI handling, framing/ACK behavior, reconnect semantics and tests against the current tracker server. Migrate only missing behavior into the current tracker-server boundary.

## Exit criteria for predecessor archival

1. current Teltonika decoder/server covers every still-required protocol behavior;
2. deterministic tests cover representative frames and malformed input;
3. connection/authentication behavior is documented;
4. no production configuration or migration remains unique to the predecessor.

Until these criteria pass, `vehicle-tracking-v2` is frozen as a reference repository rather than archived.
