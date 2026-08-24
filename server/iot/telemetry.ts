import { createHash } from "node:crypto";
import { z } from "zod";
import * as db from "../db";

const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MAX_HISTORICAL_AGE_MS = 31 * 24 * 60 * 60 * 1000;

export const iotTelemetrySchema = z.object({
  messageId: z.string().trim().regex(/^[A-Za-z0-9_.:-]{8,128}$/),
  observedAt: z.coerce.date(),
  value: z.number().finite().min(0).max(999_999_999),
  unit: z.string().trim().min(1).max(24),
});

export class IotTelemetryError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export function telemetryTimestampIsAcceptable(observedAt: Date, now = new Date()) {
  const delta = observedAt.getTime() - now.getTime();
  return delta <= MAX_FUTURE_SKEW_MS && delta >= -MAX_HISTORICAL_AGE_MS;
}

function stablePayloadHash(input: z.infer<typeof iotTelemetrySchema>) {
  return createHash("sha256").update(JSON.stringify({
    messageId: input.messageId,
    observedAt: input.observedAt.toISOString(),
    value: input.value,
    unit: input.unit,
  })).digest("hex");
}

export async function acceptIotTelemetry(input: {
  organizationId: number;
  deviceKey: string;
  credential: string;
  payload: unknown;
  now?: Date;
}) {
  const telemetry = iotTelemetrySchema.safeParse(input.payload);
  if (!telemetry.success) throw new IotTelemetryError(400, "Telemetry payload is invalid.");
  if (!Number.isInteger(input.organizationId) || input.organizationId < 1) throw new IotTelemetryError(400, "Organization identifier is required.");
  if (!input.deviceKey || !input.credential) throw new IotTelemetryError(401, "Device credentials are required.");
  if (!telemetryTimestampIsAcceptable(telemetry.data.observedAt, input.now)) {
    throw new IotTelemetryError(422, "Telemetry timestamp is outside the accepted device window.");
  }

  const resolved = await db.getIotDeviceForTelemetry(input.organizationId, input.deviceKey);
  if (!resolved || !db.iotDeviceCredentialMatches(input.credential, resolved.device.credentialHash)) {
    throw new IotTelemetryError(401, "Device credentials are invalid.");
  }
  if (resolved.device.status !== "active") throw new IotTelemetryError(403, "Device is not active.");
  if (resolved.device.organizationId !== input.organizationId || resolved.device.organizationId !== resolved.meter.organizationId || resolved.device.siteId !== resolved.meter.siteId) {
    throw new IotTelemetryError(403, "Device tenant mapping is invalid.");
  }
  if (telemetry.data.unit !== resolved.meter.canonicalUnit) {
    throw new IotTelemetryError(422, "Telemetry unit does not match the registered meter.");
  }

  const existingReceipt = await db.getIotTelemetryReceipt(resolved.device.id, telemetry.data.messageId);
  if (existingReceipt) {
    return { status: "duplicate" as const, organizationId: resolved.device.organizationId, readingId: existingReceipt.readingId };
  }

  const payloadHash = stablePayloadHash(telemetry.data);
  const persisted = await db.ingestReading({
    organizationId: resolved.device.organizationId,
    siteId: resolved.device.siteId,
    meterId: resolved.meter.id,
    userId: resolved.device.createdByUserId,
    observedAt: telemetry.data.observedAt,
    value: telemetry.data.value,
    unit: telemetry.data.unit,
    source: "connector",
    idempotencyKey: `iot:${resolved.device.id}:${telemetry.data.messageId}`,
    sourceReference: `iot:${resolved.device.deviceKey}`,
    provenance: {
      integration: "iot_gateway_v1",
      deviceKey: resolved.device.deviceKey,
      credentialVersion: resolved.device.credentialVersion,
      messageId: telemetry.data.messageId,
      payloadHash,
    },
  });
  const readingId = Number(persisted.reading.id);

  try {
    await db.recordIotTelemetryReceipt({
      organizationId: resolved.device.organizationId,
      deviceId: resolved.device.id,
      readingId,
      messageId: telemetry.data.messageId,
      observedAt: telemetry.data.observedAt,
      payloadHash,
      actorUserId: resolved.device.createdByUserId,
    });
  } catch {
    const racedReceipt = await db.getIotTelemetryReceipt(resolved.device.id, telemetry.data.messageId);
    if (racedReceipt) return { status: "duplicate" as const, organizationId: resolved.device.organizationId, readingId: racedReceipt.readingId };
    throw new IotTelemetryError(503, "Telemetry receipt could not be recorded. Retry the same message later.");
  }

  return { status: persisted.idempotent ? "duplicate" as const : "accepted" as const, organizationId: resolved.device.organizationId, readingId };
}
