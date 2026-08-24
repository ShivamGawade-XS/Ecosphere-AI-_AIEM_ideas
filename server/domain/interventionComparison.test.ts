import { describe, expect, it } from "vitest";
import { rankScenarioInterventions } from "./interventionComparison";

const results = (overrides: Partial<{ carbonReductionKg: number; annualSavingsInr: number; roiPct: number | null; paybackYears: number | null }> = {}) => ({
  projectedEnergyKwh: 100,
  projectedWaterM3: 10,
  projectedWasteKg: 10,
  baselineCarbonKg: 200,
  projectedCarbonKg: 100,
  carbonReductionKg: 100,
  annualSavingsInr: 50_000,
  roiPct: 25,
  paybackYears: 4,
  ...overrides,
});

describe("rankScenarioInterventions", () => {
  it("ranks only supplied persisted outputs with a transparent deterministic score", () => {
    const ranking = rankScenarioInterventions([
      { id: 2, name: "Controls", assumptions: { investmentInr: 200_000 }, results: results() },
      { id: 1, name: "Solar", assumptions: { investmentInr: 180_000 }, results: results({ carbonReductionKg: 180, annualSavingsInr: 90_000, roiPct: 45 }) },
    ]);

    expect(ranking.map((item) => [item.name, item.rank])).toEqual([["Solar", 1], ["Controls", 2]]);
    expect(ranking[0].disclosure).toContain("carbon reduction 45%");
    expect(ranking[0].scoreComponents).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "carbonReduction", weightPct: 45, contributionPoints: 45 }),
      expect.objectContaining({ key: "annualSavings", weightPct: 25, contributionPoints: 25 }),
    ]));
  });

  it("rejects a comparison without two persisted scenarios", () => {
    expect(() => rankScenarioInterventions([{ id: 1, name: "Only", assumptions: { investmentInr: 1 }, results: results() }])).toThrow("At least two persisted scenarios");
  });
});
