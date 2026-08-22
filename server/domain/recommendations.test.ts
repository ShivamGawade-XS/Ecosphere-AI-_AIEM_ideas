import { describe, expect, it } from "vitest";
import { buildAnomalyRecommendation } from "./recommendations";

describe("buildAnomalyRecommendation", () => {
  it("preserves anomaly evidence and refuses to invent carbon or savings estimates", () => {
    const recommendation = buildAnomalyRecommendation({
      anomalyId: 12,
      resourceType: "energy",
      meterName: "HVAC Electricity",
      severity: "critical",
      baselineMean: 100,
      observedValue: 250,
      zScore: 5.2,
      detectedAt: new Date("2026-01-01T10:00:00Z"),
    });

    expect(recommendation.priority).toBe("critical");
    expect(recommendation.expectedImpact).toMatchObject({ excessValue: 150, carbonOrSavingsEstimate: null });
    expect(recommendation.evidence).toMatchObject({ anomalyId: 12, zScore: 5.2 });
  });
});
