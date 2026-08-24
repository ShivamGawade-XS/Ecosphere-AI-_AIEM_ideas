import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  getIotDeviceForTelemetry: vi.fn(),
  iotDeviceCredentialMatches: vi.fn(),
  getIotTelemetryReceipt: vi.fn(),
  ingestReading: vi.fn(),
  recordIotTelemetryReceipt: vi.fn(),
}));

vi.mock("../db", () => database);

import { acceptIotTelemetry, IotTelemetryError, telemetryTimestampIsAcceptable } from "./telemetry";

const now = new Date("2026-08-24T10:00:00.000Z");
const payload = { messageId: "msg-20260824-001", observedAt: "2026-08-24T09:55:00.000Z", value: 42.5, unit: "kWh" };

describe("IoT telemetry ingress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.getIotDeviceForTelemetry.mockResolvedValue({
      device: { id: 201, organizationId: 8, siteId: 13, meterId: 44, deviceKey: "aiem-hvac-gateway-01", credentialHash: "hash", credentialVersion: 1, status: "active", createdByUserId: 17 },
      meter: { id: 44, organizationId: 8, siteId: 13, canonicalUnit: "kWh", isActive: true },
    });
    database.iotDeviceCredentialMatches.mockReturnValue(true);
    database.getIotTelemetryReceipt.mockResolvedValue(undefined);
    database.ingestReading.mockResolvedValue({ reading: { id: 501 }, idempotent: false });
    database.recordIotTelemetryReceipt.mockResolvedValue({ id: 301 });
  });

  it("accepts a valid active device reading and persists deterministic connector provenance", async () => {
    await expect(acceptIotTelemetry({ organizationId: 8, deviceKey: "aiem-hvac-gateway-01", credential: "device-secret", payload, now })).resolves.toEqual({ status: "accepted", organizationId: 8, readingId: 501 });
    expect(database.getIotDeviceForTelemetry).toHaveBeenCalledWith(8, "aiem-hvac-gateway-01");
    expect(database.ingestReading).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, siteId: 13, meterId: 44, source: "connector", idempotencyKey: "iot:201:msg-20260824-001" }));
    expect(database.recordIotTelemetryReceipt).toHaveBeenCalledWith(expect.objectContaining({ deviceId: 201, readingId: 501, messageId: "msg-20260824-001" }));
  });

  it("rejects stale or future device clocks before reading any device record", async () => {
    expect(telemetryTimestampIsAcceptable(new Date("2026-07-01T00:00:00.000Z"), now)).toBe(false);
    await expect(acceptIotTelemetry({ organizationId: 8, deviceKey: "aiem-hvac-gateway-01", credential: "device-secret", payload: { ...payload, observedAt: "2026-09-24T10:00:00.000Z" }, now })).rejects.toMatchObject<IotTelemetryError>({ statusCode: 422 });
    expect(database.getIotDeviceForTelemetry).not.toHaveBeenCalled();
  });

  it("rejects inactive device, mismatched unit, and bad credentials without writing a reading", async () => {
    database.iotDeviceCredentialMatches.mockReturnValue(false);
    await expect(acceptIotTelemetry({ organizationId: 8, deviceKey: "aiem-hvac-gateway-01", credential: "bad", payload, now })).rejects.toMatchObject<IotTelemetryError>({ statusCode: 401 });

    database.iotDeviceCredentialMatches.mockReturnValue(true);
    database.getIotDeviceForTelemetry.mockResolvedValueOnce({
      device: { id: 201, organizationId: 8, siteId: 13, meterId: 44, deviceKey: "aiem-hvac-gateway-01", credentialHash: "hash", credentialVersion: 1, status: "suspended", createdByUserId: 17 },
      meter: { id: 44, organizationId: 8, siteId: 13, canonicalUnit: "kWh", isActive: true },
    });
    await expect(acceptIotTelemetry({ organizationId: 8, deviceKey: "aiem-hvac-gateway-01", credential: "device-secret", payload, now })).rejects.toMatchObject<IotTelemetryError>({ statusCode: 403 });

    await expect(acceptIotTelemetry({ organizationId: 8, deviceKey: "aiem-hvac-gateway-01", credential: "device-secret", payload: { ...payload, unit: "m³" }, now })).rejects.toMatchObject<IotTelemetryError>({ statusCode: 422 });
    expect(database.ingestReading).not.toHaveBeenCalled();
  });

  it("returns a replay result without a second write when the device message already has a receipt", async () => {
    database.getIotTelemetryReceipt.mockResolvedValue({ readingId: 501 });
    await expect(acceptIotTelemetry({ organizationId: 8, deviceKey: "aiem-hvac-gateway-01", credential: "device-secret", payload, now })).resolves.toEqual({ status: "duplicate", organizationId: 8, readingId: 501 });
    expect(database.ingestReading).not.toHaveBeenCalled();
  });
});
