import type { ScenarioAssumptions, ScenarioResults } from "../../drizzle/schema";

export const SDG_IMPACT_CALCULATION_VERSION = "pilot-sdg-impact-v1" as const;

export type SdgContribution = {
  sdg: 7 | 9 | 11 | 12 | 13;
  title: string;
  contributionIndex: number;
  evidence: string;
  modeledMetrics: Record<string, number | boolean>;
};

export type SdgImpact = {
  calculationVersion: typeof SDG_IMPACT_CALCULATION_VERSION;
  disclosure: string;
  contributions: SdgContribution[];
};

const clampIndex = (value: number) => Math.max(0, Math.min(100, Math.round(value * 10_000) / 10_000));

/**
 * Translates transparent pilot scenario inputs and results into a contribution
 * index. It does not certify SDG achievement or measure realised impact; every
 * result remains a modeled planning disclosure tied to the saved scenario.
 */
export function calculateScenarioSdgImpact(input: { assumptions: ScenarioAssumptions; results: Omit<ScenarioResults, "sdgImpact"> }): SdgImpact {
  const { assumptions, results } = input;
  const carbonReductionPct = results.baselineCarbonKg > 0 ? (results.carbonReductionKg / results.baselineCarbonKg) * 100 : 0;
  const energyReductionKwh = Math.max(0, assumptions.baselineEnergyKwh - results.projectedEnergyKwh);
  const waterReductionM3 = Math.max(0, assumptions.baselineWaterM3 - results.projectedWaterM3);
  const wasteReductionKg = Math.max(0, assumptions.baselineWasteKg - results.projectedWasteKg);
  const resourceEfficiencyIndex = Math.max(assumptions.wasteReductionPct, assumptions.recyclingPct);

  return {
    calculationVersion: SDG_IMPACT_CALCULATION_VERSION,
    disclosure: "Modeled pilot contribution indices translate this scenario’s saved assumptions and deterministic outputs. They are not certified SDG achievement, verified campus outcomes, or a guarantee of savings.",
    contributions: [
      {
        sdg: 13,
        title: "Climate Action",
        contributionIndex: clampIndex(carbonReductionPct),
        evidence: `${results.carbonReductionKg.toFixed(1)} kgCO₂e modeled reduction against the scenario baseline.`,
        modeledMetrics: { carbonReductionKg: results.carbonReductionKg, carbonReductionPct: clampIndex(carbonReductionPct) },
      },
      {
        sdg: 7,
        title: "Affordable & Clean Energy",
        contributionIndex: clampIndex(assumptions.energyReductionPct * 0.65 + assumptions.renewableSharePct * 0.35),
        evidence: `${energyReductionKwh.toFixed(1)} kWh modeled energy reduction and ${assumptions.renewableSharePct.toFixed(1)}% renewable share.`,
        modeledMetrics: { energyReductionKwh, energyReductionPct: assumptions.energyReductionPct, renewableSharePct: assumptions.renewableSharePct },
      },
      {
        sdg: 9,
        title: "Industry, Innovation & Infrastructure",
        contributionIndex: clampIndex(assumptions.investmentInr > 0 ? Math.min(100, 20 + Math.log10(assumptions.investmentInr + 1) * 13) : 0),
        evidence: assumptions.investmentInr > 0 ? `${assumptions.investmentInr.toFixed(0)} INR recorded as modeled implementation investment.` : "No modeled implementation investment was recorded.",
        modeledMetrics: { investmentInr: assumptions.investmentInr, hasInvestment: assumptions.investmentInr > 0 },
      },
      {
        sdg: 11,
        title: "Sustainable Cities & Communities",
        contributionIndex: clampIndex(assumptions.waterReductionPct),
        evidence: `${waterReductionM3.toFixed(1)} m³ modeled water reduction from the saved scenario.`,
        modeledMetrics: { waterReductionM3, waterReductionPct: assumptions.waterReductionPct },
      },
      {
        sdg: 12,
        title: "Responsible Consumption & Production",
        contributionIndex: clampIndex(resourceEfficiencyIndex),
        evidence: `${wasteReductionKg.toFixed(1)} kg modeled waste reduction with ${assumptions.recyclingPct.toFixed(1)}% recycling assumption.`,
        modeledMetrics: { wasteReductionKg, wasteReductionPct: assumptions.wasteReductionPct, recyclingPct: assumptions.recyclingPct },
      },
    ],
  };
}
