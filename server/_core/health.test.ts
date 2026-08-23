import { describe, expect, it } from "vitest";
import { createLivenessPayload, createReadinessResponse, SCHEDULER_READINESS } from "./health";

const at = new Date("2026-08-22T08:40:00.000Z");

describe("operational health contracts", () => {
  it("returns a dependency-free liveness payload", () => {
    expect(createLivenessPayload(at)).toEqual({
      ok: true,
      service: "ecosphere-ai",
      timestamp: "2026-08-22T08:40:00.000Z",
    });
  });

  it("reports readiness when the database is configured and scheduler activation is intentionally pending", () => {
    expect(createReadinessResponse(true, at)).toEqual({
      status: 200,
      body: {
        ok: true,
        service: "ecosphere-ai",
        dependencies: {
          database: "configured",
          scheduler: SCHEDULER_READINESS,
        },
        timestamp: "2026-08-22T08:40:00.000Z",
      },
    });
  });

  it("fails readiness without concealing a database dependency failure", () => {
    expect(createReadinessResponse(false, at)).toEqual({
      status: 503,
      body: {
        ok: false,
        service: "ecosphere-ai",
        dependencies: {
          database: "unavailable",
          scheduler: SCHEDULER_READINESS,
        },
        timestamp: "2026-08-22T08:40:00.000Z",
      },
    });
  });
});
