import { describe, expect, it } from "vitest";
import { buildRequestTelemetry } from "./observability";

describe("operational request telemetry", () => {
  it("creates a stable, bounded structured record without request payload fields", () => {
    expect(buildRequestTelemetry({
      requestId: "request-123",
      method: "POST",
      path: "/api/scheduled/monitoring",
      statusCode: 500,
      durationMs: 12.6,
      timestamp: new Date("2026-08-22T08:50:00.000Z"),
    })).toEqual({
      event: "http.request.completed",
      requestId: "request-123",
      method: "POST",
      path: "/api/scheduled/monitoring",
      statusCode: 500,
      durationMs: 13,
      timestamp: "2026-08-22T08:50:00.000Z",
    });
  });

  it("does not emit a negative duration when a clock source is skewed", () => {
    expect(buildRequestTelemetry({ requestId: "request-124", method: "GET", path: "/readyz", statusCode: 200, durationMs: -4, timestamp: new Date("2026-08-22T08:50:00.000Z") }).durationMs).toBe(0);
  });
});
