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

  it("uses only supplied persisted quality, forecast, and carbon-factor evidence for its disclosed impact", () => {
    const recommendation = buildAnomalyRecommendation({
      anomalyId: 12, resourceType: "energy", meterName: "HVAC Electricity", severity: "high", baselineMean: 100, observedValue: 130, zScore: 4.1, detectedAt: new Date("2026-01-01T10:00:00Z"),
      qualityStatuses: ["passed", "warning"],
      forecast: { id: 44, status: "ready", calculationVersion: "moving-average-v1", inputReadingCount: 12 },
      carbon: { emittedKgCo2ePerUnit: 0.71, factorVersion: "goa-grid-v1", calculationVersion: "factor-library-carbon-v1" },
      scenario: { id: 91, name: "HVAC controls option", calculationVersion: "pilot-v1", carbonReductionKg: 886 },
      comparison: { id: 7, name: "Campus HVAC comparison", rankingVersion: "scenario-impact-rank-v1" },
    });

    expect(recommendation.expectedImpact.carbonOrSavingsEstimate).toEqual({ excessKgCo2e: 21.3, factorVersion: "goa-grid-v1", calculationVersion: "factor-library-carbon-v1" });
    expect(recommendation.evidence).toMatchObject({ qualityStatuses: ["passed", "warning"], forecast: { id: 44, status: "ready" }, scenario: { id: 91, name: "HVAC controls option", carbonReductionKg: 886 }, comparison: { id: 7, name: "Campus HVAC comparison" } });
    expect(recommendation.expectedImpact.disclosure).toContain("persisted factor");
  });
});
