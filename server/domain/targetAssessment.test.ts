import { describe, expect, it } from "vitest";
import { assessTarget, targetDirectionForType } from "./targetAssessment";

describe("sustainability target assessment", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");

  it("uses lower-is-better resource targets and explicitly marks a near miss at risk", () => {
    expect(targetDirectionForType("energy")).toBe("at_most");
    expect(assessTarget({ targetValue: 100, achievedValue: 100, direction: "at_most", latestObservedAt: new Date("2026-08-24T10:00:00.000Z"), now })).toMatchObject({ state: "achieved", freshness: "fresh", remainingValue: 0 });
    expect(assessTarget({ targetValue: 100, achievedValue: 106, direction: "at_most", latestObservedAt: new Date("2026-08-23T10:00:00.000Z"), now })).toMatchObject({ state: "at_risk", freshness: "stale" });
  });

  it("uses higher-is-better EcoScore targets and never fabricates a status for missing evidence", () => {
    expect(targetDirectionForType("ecoscore")).toBe("at_least");
    expect(assessTarget({ targetValue: 80, achievedValue: 76, direction: "at_least", latestObservedAt: new Date("2026-08-24T11:00:00.000Z"), now })).toMatchObject({ state: "at_risk", progressPct: 95 });
    expect(assessTarget({ targetValue: 80, achievedValue: null, direction: "at_least", latestObservedAt: null, now })).toMatchObject({ state: "no_data", freshness: "unknown", progressPct: null });
  });
});
