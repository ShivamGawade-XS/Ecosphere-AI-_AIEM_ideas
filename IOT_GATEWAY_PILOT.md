# EcoSphere AI IoT Gateway Pilot

> **Pilot status:** The secure ingestion foundation is implemented and database-migrated. It is not a claim that AIEM devices are connected, calibrated, or authorized. Keep all real-device work read-only until facilities approval and meter validation are complete.

## What Is Implemented

The application now supports an owner-governed device registry, one-time device-secret issuance, lifecycle states (`active`, `suspended`, `revoked`, and `decommissioned`), tenant/site/meter binding, SHA-256 credential hashing, constant-time credential comparison, immutable device-message receipts, and deterministic connector reading provenance. The schema migration `0013_black_carlie_cooper.sql` has been applied to the managed database and verified to create `iot_devices` and `iot_telemetry_receipts`.

| Control | Implementation behavior |
|---|---|
| Tenant isolation | A registered device is bound to one organization, site, and active meter. The incoming device can only write to that bound meter. |
| Device identity | Owners call `iot.registerDevice`; the plaintext credential is shown only in that response and only its SHA-256 hash is persisted. |
| Lifecycle | Owners may suspend, revoke, or decommission a device. Only `active` devices can submit telemetry. |
| Replay control | Each device message ID is immutable and unique. A replay returns the original reading ID without creating another reading. |
| Data integrity | The server enforces canonical meter unit, finite non-negative value, message-ID syntax, 5-minute future skew, and 31-day maximum historical window. |
| Provenance | Accepted readings use source `connector` and include `iot_gateway_v1`, device key, credential version, message ID, and payload hash. |
| Traffic bound | The public endpoint has a 120-request/minute in-process IP limit in addition to the application-wide request protections. |

## Owner Device Registration

An authenticated tenant owner uses the protected tRPC operation `iot.registerDevice` with the organization, site, active meter, a stable device key, and a display name. The returned credential must be copied directly into a secure gateway secret store; it must never be embedded in a browser, committed to source control, or sent through chat.

```json
{
  "organizationId": 8,
  "siteId": 13,
  "meterId": 44,
  "deviceKey": "aiem-hvac-gateway-01",
  "displayName": "AIEM HVAC gateway"
}
```

The creation response has this shape. Treat `credential` as a one-time secret.

```json
{
  "device": { "id": 201 },
  "credential": "one-time-device-secret",
  "credentialVersion": 1
}
```

If a gateway is replaced, leaked, or has left the approved network boundary, an owner must call `iot.rotateDeviceCredential`. The operation replaces the stored hash, increments the credential version in audit evidence, and returns the replacement plaintext credential **once**. Revoked and decommissioned devices cannot be reactivated through secret rotation.

## Gateway Telemetry Request

Post a JSON reading to the server-side endpoint. Use TLS only.

```http
POST /api/iot/telemetry
Content-Type: application/json
X-EcoSphere-Device-Key: aiem-hvac-gateway-01
X-EcoSphere-Device-Secret: <one-time-device-secret>
X-EcoSphere-Organization-Id: 8
```

```json
{
  "messageId": "hvac-01-20260824-000001",
  "observedAt": "2026-08-24T09:55:00.000Z",
  "value": 42.5,
  "unit": "kWh"
}
```

`202 Accepted` means a reading was accepted. `200 OK` with `status: "duplicate"` means the exact message was safely replayed and no second reading was created. `401`, `403`, `422`, and `429` identify invalid credentials, inactive/misbound devices, validation failures, and traffic throttling respectively.

## Pilot Execution Sequence

Begin with one approved electricity meter and a gateway that can buffer messages locally while offline. Configure a device key and secret only after the production database/OAuth environment is active. Send a short controlled sequence with unique message IDs, replay one message, suspend the device, and confirm that subsequent requests receive `403`. Compare three days of accepted interval totals with a trusted meter export before using results in a public sustainability claim.

Do not connect HVAC, pumps, or any building controller for actuation. This pilot is read-only telemetry only. MQTT brokers such as AWS IoT Core, ThingsBoard, or EMQX can be introduced later as an upstream device transport; the EcoSphere endpoint remains the normalized tenant-aware ingestion boundary.[1] [2] [3]

## References

[1] [AWS IoT Core MQTT documentation](https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html)

[2] [ThingsBoard MQTT telemetry API](https://thingsboard.io/docs/pe/reference/mqtt-api/telemetry/)

[3] [EMQX authentication documentation](https://docs.emqx.com/en/emqx/latest/access-control/authn/authn.html)
