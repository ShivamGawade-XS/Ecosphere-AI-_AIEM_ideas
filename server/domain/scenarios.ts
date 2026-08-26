import type { ScenarioAssumptions, ScenarioResults } from "../../drizzle/schema";
import { calculateScenarioSdgImpact } from "./sdgImpact";

/**
 * Pilot factor set v1. These are explicitly prototype defaults, not regional
 * emission-factor claims or procurement quotations. Server calculation keeps
 * every displayed output deterministic and reproducible from its saved inputs.
 */
export const SCENARIO_CALCULATION_VERSION = "pilot-v1";
export const PILOT_FACTORS = {
  electricityKgCo2PerKwh: 0.82,
  waterKgCo2PerM3: 0.344,
  wasteKgCo2PerKg: 0.615,
  electricityCostInrPerKwh: 9.6,
  waterCostInrPerM3: 52,
  wasteCostInrPerKg: 8,
} as const;

export function getScenarioMethodology() {
  return {
    calculationVersion: SCENARIO_CALCULATION_VERSION,
    factors: PILOT_FACTORS,
    formulas: {
      projectedResource: "baseline resource × (1 − reduction percentage)",
      projectedCarbon: "projected energy × electricity factor × (1 − renewable share) + projected water × water factor + projected waste × waste factor × (1 − recycling percentage)",
      annualSavings: "resource reduction × displayed resource cost factor, summed across energy, water, and waste",
      roi: "((three years of modeled annual savings − investment) ÷ investment) × 100",
      payback: "investment ÷ modeled annual savings",
    },
    sensitivity: "Conservative, base, and favorable cases vary only the displayed delivery performance, capex, tariff, and carbon-factor multipliers. They are server-calculated deterministic ranges.",
    limitations: "Pilot factors are prototype defaults, not regional emissions-factor claims, procurement quotations, predictive guarantees, certified reporting, or realized savings.",
  };
}

const round = (value: number) => Math.round(value * 10_000) / 10_000;

export function calculateScenario(assumptions: ScenarioAssumptions): ScenarioResults {
  const energyMultiplier = 1 - assumptions.energyReductionPct / 100;
  const waterMultiplier = 1 - assumptions.waterReductionPct / 100;
  const wasteMultiplier = 1 - assumptions.wasteReductionPct / 100;
  const renewableMultiplier = 1 - assumptions.renewableSharePct / 100;
  const recyclingMultiplier = 1 - assumptions.recyclingPct / 100;

  const projectedEnergyKwh = assumptions.baselineEnergyKwh * energyMultiplier;
  const projectedWaterM3 = assumptions.baselineWaterM3 * waterMultiplier;
  const projectedWasteKg = assumptions.baselineWasteKg * wasteMultiplier;
  const baselineCarbonKg = assumptions.baselineEnergyKwh * PILOT_FACTORS.electricityKgCo2PerKwh
    + assumptions.baselineWaterM3 * PILOT_FACTORS.waterKgCo2PerM3
    + assumptions.baselineWasteKg * PILOT_FACTORS.wasteKgCo2PerKg;
  const projectedCarbonKg = projectedEnergyKwh * PILOT_FACTORS.electricityKgCo2PerKwh * renewableMultiplier
    + projectedWaterM3 * PILOT_FACTORS.waterKgCo2PerM3
    + projectedWasteKg * PILOT_FACTORS.wasteKgCo2PerKg * recyclingMultiplier;
  const annualSavingsInr = (assumptions.baselineEnergyKwh - projectedEnergyKwh) * PILOT_FACTORS.electricityCostInrPerKwh
    + (assumptions.baselineWaterM3 - projectedWaterM3) * PILOT_FACTORS.waterCostInrPerM3
    + (assumptions.baselineWasteKg - projectedWasteKg) * PILOT_FACTORS.wasteCostInrPerKg;
  const roiPct = assumptions.investmentInr > 0 ? ((annualSavingsInr * 3 - assumptions.investmentInr) / assumptions.investmentInr) * 100 : null;
  const paybackYears = assumptions.investmentInr > 0 && annualSavingsInr > 0 ? assumptions.investmentInr / annualSavingsInr : null;

  const resultsWithoutSdg = {
    projectedEnergyKwh: round(projectedEnergyKwh),
    projectedWaterM3: round(projectedWaterM3),
    projectedWasteKg: round(projectedWasteKg),
    baselineCarbonKg: round(baselineCarbonKg),
    projectedCarbonKg: round(projectedCarbonKg),
    carbonReductionKg: round(Math.max(0, baselineCarbonKg - projectedCarbonKg)),
    annualSavingsInr: round(Math.max(0, annualSavingsInr)),
    roiPct: roiPct === null ? null : round(roiPct),
    paybackYears: paybackYears === null ? null : round(paybackYears),
  };
  return { ...resultsWithoutSdg, sdgImpact: calculateScenarioSdgImpact({ assumptions, results: resultsWithoutSdg }) };
}
