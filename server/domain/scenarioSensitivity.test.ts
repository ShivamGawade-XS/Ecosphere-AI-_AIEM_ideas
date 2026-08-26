import { describe, expect, it } from "vitest";
import { calculateScenarioSensitivity } from "./scenarioSensitivity";

const assumptions = { baselineEnergyKwh: 100, baselineWaterM3: 10, baselineWasteKg: 10, energyReductionPct: 20, renewableSharePct: 0, waterReductionPct: 10, wasteReductionPct: 10, recyclingPct: 0, investmentInr: 1_000 };

describe("calculateScenarioSensitivity", () => {
  it("returns conservative, base, and favorable deterministic cases with explicit inputs", () => {
    const sensitivity = calculateScenarioSensitivity({ assumptions, conservative: { performancePct: 70, capexMultiplier: 1.2, tariffMultiplier: 0.9, carbonFactorMultiplier: 0.9 }, favorable: { performancePct: 110, capexMultiplier: 0.8, tariffMultiplier: 1.1, carbonFactorMultiplier: 1.1 } });
    expect(sensitivity.version).toBe("pilot-sensitivity-v1");
    expect(sensitivity.results.map((result) => result.label)).toEqual(["conservative", "base", "favorable"]);
    expect(sensitivity.results[0]).toMatchObject({ inputs: { performancePct: 70, capexMultiplier: 1.2 }, annualSavingsInr: expect.any(Number) });
    expect(sensitivity.results[1]).toMatchObject({ inputs: { performancePct: 100, capexMultiplier: 1, tariffMultiplier: 1, carbonFactorMultiplier: 1 } });
    expect(sensitivity.results[2].annualSavingsInr).toBeGreaterThan(sensitivity.results[0].annualSavingsInr);
  });

  it("keeps the result framed as a model range rather than a forecast or realized outcome", () => {
    const sensitivity = calculateScenarioSensitivity({ assumptions, conservative: { performancePct: 50, capexMultiplier: 1.5, tariffMultiplier: 0.8, carbonFactorMultiplier: 0.8 }, favorable: { performancePct: 120, capexMultiplier: 0.7, tariffMultiplier: 1.2, carbonFactorMultiplier: 1.2 } });
    expect(sensitivity.disclosure).toMatch(/not probabilities, forecasts.*realized outcomes/i);
  });
});
