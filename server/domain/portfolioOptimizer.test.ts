import { describe, expect, it } from "vitest";
import { optimizeInterventionPortfolio } from "./portfolioOptimizer";

const candidates = [
  { scenarioId: 1, name: "LED", investmentInr: 20_000, carbonReductionKg: 80, annualSavingsInr: 6_000, paybackYears: 3 },
  { scenarioId: 2, name: "HVAC", investmentInr: 35_000, carbonReductionKg: 160, annualSavingsInr: 9_000, paybackYears: 4 },
  { scenarioId: 3, name: "Solar", investmentInr: 70_000, carbonReductionKg: 300, annualSavingsInr: 10_000, paybackYears: 7 },
];

describe("optimizeInterventionPortfolio", () => {
  it("selects the highest carbon-reduction portfolio within the stated budget and count", () => {
    const result = optimizeInterventionPortfolio({ candidates, budgetInr: 55_000, maxInterventions: 2, objective: "carbon_reduction" });
    expect(result.selected.map((item) => item.scenarioId)).toEqual([1, 2]);
    expect(result.totals).toEqual({ investmentInr: 55_000, carbonReductionKg: 240, annualSavingsInr: 15_000 });
    expect(result.excluded).toEqual([expect.objectContaining({ scenarioId: 3, reason: "over_budget" })]);
  });

  it("uses the alternate modeled annual-savings objective and never selects a budget-breaking combination", () => {
    const result = optimizeInterventionPortfolio({ candidates, budgetInr: 70_000, maxInterventions: 2, objective: "annual_savings" });
    expect(result.selected.map((item) => item.scenarioId)).toEqual([1, 2]);
    expect(result.totals.investmentInr).toBeLessThanOrEqual(70_000);
  });

  it("rejects unbounded candidate sets, duplicate scenarios, invalid budgets, and invalid counts", () => {
    expect(() => optimizeInterventionPortfolio({ candidates: candidates.slice(0, 1), budgetInr: 1, maxInterventions: 1, objective: "carbon_reduction" })).toThrow("between two and ten");
    expect(() => optimizeInterventionPortfolio({ candidates: [candidates[0], candidates[0]], budgetInr: 1, maxInterventions: 1, objective: "carbon_reduction" })).toThrow("unique");
    expect(() => optimizeInterventionPortfolio({ candidates, budgetInr: -1, maxInterventions: 1, objective: "carbon_reduction" })).toThrow("non-negative");
    expect(() => optimizeInterventionPortfolio({ candidates, budgetInr: 1, maxInterventions: 7, objective: "carbon_reduction" })).toThrow("between one and six");
  });
});
