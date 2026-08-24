import { describe, expect, it } from "vitest";
import { calculateScenario } from "./scenarios";
import { calculateScenarioSdgImpact } from "./sdgImpact";

describe("deterministic scenario SDG contribution impact", () => {
  it("maps transparent scenario evidence to every competition SDG without claiming certified achievement", () => {
    const assumptions = { baselineEnergyKwh: 7200, baselineWaterM3: 480, baselineWasteKg: 980, energyReductionPct: 15, renewableSharePct: 25, waterReductionPct: 10, wasteReductionPct: 12, recyclingPct: 40, investmentInr: 400000 };
    const results = calculateScenario(assumptions);
    const impact = calculateScenarioSdgImpact({ assumptions, results });

    expect(impact.calculationVersion).toBe("pilot-sdg-impact-v1");
    expect(impact.contributions.map((item) => item.sdg)).toEqual([13, 7, 9, 11, 12]);
    expect(impact.contributions.find((item) => item.sdg === 13)).toMatchObject({ contributionIndex: expect.any(Number), modeledMetrics: expect.objectContaining({ carbonReductionKg: results.carbonReductionKg }) });
    expect(impact.contributions.find((item) => item.sdg === 7)).toMatchObject({ modeledMetrics: expect.objectContaining({ energyReductionPct: 15, renewableSharePct: 25 }) });
    expect(impact.disclosure).toMatch(/not certified SDG achievement/i);
  });

  it("returns zero contribution indices when a scenario records no modeled change or investment", () => {
    const assumptions = { baselineEnergyKwh: 100, baselineWaterM3: 10, baselineWasteKg: 20, energyReductionPct: 0, renewableSharePct: 0, waterReductionPct: 0, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 0 };
    const impact = calculateScenarioSdgImpact({ assumptions, results: calculateScenario(assumptions) });
    expect(impact.contributions.every((item) => item.contributionIndex === 0)).toBe(true);
  });
});
