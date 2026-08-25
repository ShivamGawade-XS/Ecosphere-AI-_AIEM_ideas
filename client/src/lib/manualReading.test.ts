import { describe, expect, it } from "vitest";
import { createManualReadingIdempotencyKey } from "./manualReading";

describe("createManualReadingIdempotencyKey", () => {
  it("derives a stable canonical key that permits the same measurement to be retried", () => {
    const input = { meterId: 12, observedAt: new Date("2026-08-24T10:00:00.000Z"), value: 112.5, unit: "kWh" };
    expect(createManualReadingIdempotencyKey(input)).toBe("manual-v1:12:2026-08-24T10:00:00.000Z:112.5:kwh");
    expect(createManualReadingIdempotencyKey({ ...input, value: 112.5_000_000 })).toBe(createManualReadingIdempotencyKey(input));
  });

  it("rejects malformed manual submission inputs rather than creating ambiguous keys", () => {
    expect(() => createManualReadingIdempotencyKey({ meterId: 0, observedAt: new Date(), value: 1, unit: "kWh" })).toThrow(/valid meter/i);
    expect(() => createManualReadingIdempotencyKey({ meterId: 1, observedAt: new Date("bad"), value: 1, unit: "kWh" })).toThrow(/observation time/i);
  });
});
