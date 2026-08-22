import type { ScenarioResults } from "../../drizzle/schema";

export const INTERVENTION_COMPARISON_VERSION = "scenario-impact-rank-v1" as const;

export type ScenarioComparisonInput = { id: number; name: string; assumptions: { investmentInr: number }; results: ScenarioResults };
export type RankedIntervention = {
  scenarioId: number;
  name: string;
  rank: number;
  score: number;
  carbonReductionKg: number;
  annualSavingsInr: number;
  investmentInr: number;
  roiPct: number | null;
  paybackYears: number | null;
  disclosure: string;
};

const round = (value: number) => Math.round(value * 100) / 100;
const max = (values: number[]) => Math.max(0, ...values);

export function rankScenarioInterventions(scenarios: ScenarioComparisonInput[]): RankedIntervention[] {
  if (scenarios.length < 2) throw new Error("At least two persisted scenarios are required for a comparison.");
  const carbonMaximum = max(scenarios.map((item) => item.results.carbonReductionKg));
  const savingsMaximum = max(scenarios.map((item) => item.results.annualSavingsInr));

  return scenarios.map((scenario) => {
    const carbon = carbonMaximum ? scenario.results.carbonReductionKg / carbonMaximum : 0;
    const savings = savingsMaximum ? scenario.results.annualSavingsInr / savingsMaximum : 0;
    const roi = scenario.results.roiPct === null ? 0 : Math.max(0, Math.min(1, scenario.results.roiPct / 100));
    const investmentEfficiency = scenario.assumptions.investmentInr === 0
      ? (scenario.results.annualSavingsInr > 0 ? 1 : 0)
      : Math.max(0, Math.min(1, scenario.results.annualSavingsInr / scenario.assumptions.investmentInr));
    const score = round((carbon * 0.45 + savings * 0.25 + roi * 0.2 + investmentEfficiency * 0.1) * 100);
    return {
      scenarioId: scenario.id,
      name: scenario.name,
      rank: 0,
      score,
      carbonReductionKg: scenario.results.carbonReductionKg,
      annualSavingsInr: scenario.results.annualSavingsInr,
      investmentInr: scenario.assumptions.investmentInr,
      roiPct: scenario.results.roiPct,
      paybackYears: scenario.results.paybackYears,
      disclosure: `Ranked by ${INTERVENTION_COMPARISON_VERSION}: carbon reduction 45%, annual savings 25%, ROI 20%, and annual-savings-to-investment efficiency 10%. This is a modeled comparison, not a savings guarantee.`,
    };
  }).sort((a, b) => b.score - a.score || b.carbonReductionKg - a.carbonReductionKg || a.scenarioId - b.scenarioId)
    .map((result, index) => ({ ...result, rank: index + 1 }));
}
