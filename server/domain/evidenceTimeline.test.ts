import { describe, expect, it } from "vitest";
import { orderEvidenceTimeline } from "./evidenceTimeline";

describe("orderEvidenceTimeline", () => {
  it("orders only valid persisted events newest first and applies a bounded limit", () => {
    const ordered = orderEvidenceTimeline([
      { id: "action:4", stage: "action", occurredAt: new Date("2026-08-24T10:00:00.000Z"), title: "Inspect HVAC", status: "proposed", detail: "Recommendation-linked action" },
      { id: "anomaly:3", stage: "anomaly", occurredAt: new Date("2026-08-24T11:00:00.000Z"), title: "HVAC deviation", status: "open", detail: "Persisted detector event" },
      { id: "invalid", stage: "quality", occurredAt: new Date("invalid"), title: "Invalid", status: "failed", detail: "Must not render" },
    ], 1);
    expect(ordered).toEqual([expect.objectContaining({ id: "anomaly:3" })]);
  });
});
