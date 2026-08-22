import { calculateCarbonForReading, calculateEcoScore, detectReadingAnomaly, evaluateReadingQuality } from "./monitoring";
import { describe, expect, it } from "vitest";

describe("deterministic monitoring domain", () => {
  it("records a future timestamp as a warning while retaining the other quality rule outcomes", () => {
    const now = new Date("2026-08-22T00:00:00.000Z");
    const findings = evaluateReadingQuality({ value: 80, unit: "kWh", canonicalUnit: "kWh", resourceType: "energy", observedAt: new Date("2026-08-22T00:06:00.000Z"), now });

    expect(findings).toContainEqual(expect.objectContaining({ ruleId: "future-timestamp", status: "warning" }));
    expect(findings).toContainEqual(expect.objectContaining({ ruleId: "required-value", status: "passed" }));
    expect(findings).toContainEqual(expect.objectContaining({ ruleId: "canonical-unit", status: "passed" }));
  });

  it("uses the documented ten-percent fallback dispersion for a zero-variance baseline", () => {
    expect(detectReadingAnomaly({ observedValue: 170, history: [100, 100, 100] })).toMatchObject({
      detected: true,
      severity: "critical",
      baselineMean: 100,
      baselineStdDev: 10,
      zScore: 7,
    });
  });

  it("does not create a detection before three baseline readings exist", () => {
    expect(detectReadingAnomaly({ observedValue: 500, history: [100, 100] })).toEqual({ detected: false, reason: "insufficient-baseline", historySize: 2 });
  });

  it("applies the explicit pilot electricity factor only to energy readings", () => {
    expect(calculateCarbonForReading({ resourceType: "energy", value: 100 })).toMatchObject({ emittedKgCo2e: 82, emissionFactor: 0.82, calculationVersion: "pilot-carbon-v1" });
    expect(calculateCarbonForReading({ resourceType: "water", value: 100 })).toBeNull();
  });

  it("uses an approved governed factor when one is supplied by the monitoring worker", () => {
    expect(calculateCarbonForReading({
      resourceType: "energy",
      value: 100,
      factor: { emittedKgCo2ePerUnit: 0.71, factorVersion: "goa-electricity-2026-v1", calculationVersion: "factor-library-carbon-v1" },
    })).toMatchObject({ emittedKgCo2e: 71, emissionFactor: 0.71, factorVersion: "goa-electricity-2026-v1", calculationVersion: "factor-library-carbon-v1" });
  });

  it("calculates a traceable EcoScore penalty composition", () => {
    expect(calculateEcoScore({
      qualityStatuses: ["failed", "warning"],
      openAnomalySeverities: ["medium"],
      latestEnergyCarbonKg: 150,
      previousEnergyCarbonKg: [100, 100, 100],
    })).toMatchObject({ score: 57, components: { qualityPenalty: 25, anomalyPenalty: 8, carbonTrendPenalty: 10 } });
  });
});
