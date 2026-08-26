import type { ScenarioAssumptions } from "../../drizzle/schema";
import { calculateScenario } from "./scenarios";

export const SCENARIO_SENSITIVITY_VERSION = "pilot-sensitivity-v1" as const;

export type SensitivityCase = {
  label: "conservative" | "base" | "favorable";
  performancePct: number;
  capexMultiplier: number;
  tariffMultiplier: number;
  carbonFactorMultiplier: number;
};

export type SensitivityCaseResult = {
  label: SensitivityCase["label"];
  inputs: Omit<SensitivityCase, "label">;
  annualSavingsInr: number;
  carbonReductionKg: number;
  projectedCarbonKg: number;
  roiPct: number | null;
  paybackYears: number | null;
};

const round = (value: number) => Math.round(value * 10_000) / 10_000;

export function calculateScenarioSensitivity(input: {
  assumptions: ScenarioAssumptions;
  conservative: Omit<SensitivityCase, "label">;
  favorable: Omit<SensitivityCase, "label">;
}) {
  const cases: SensitivityCase[] = [
    { label: "conservative", ...input.conservative },
    { label: "base", performancePct: 100, capexMultiplier: 1, tariffMultiplier: 1, carbonFactorMultiplier: 1 },
    { label: "favorable", ...input.favorable },
  ];
  const results: SensitivityCaseResult[] = cases.map((sensitivityCase) => {
    const performance = sensitivityCase.performancePct / 100;
    const modeled = calculateScenario({
      ...input.assumptions,
      energyReductionPct: input.assumptions.energyReductionPct * performance,
      waterReductionPct: input.assumptions.waterReductionPct * performance,
      wasteReductionPct: input.assumptions.wasteReductionPct * performance,
      recyclingPct: input.assumptions.recyclingPct * performance,
      renewableSharePct: input.assumptions.renewableSharePct * performance,
      investmentInr: input.assumptions.investmentInr * sensitivityCase.capexMultiplier,
    });
    const annualSavingsInr = round(modeled.annualSavingsInr * sensitivityCase.tariffMultiplier);
    const carbonReductionKg = round(modeled.carbonReductionKg * sensitivityCase.carbonFactorMultiplier);
    const projectedCarbonKg = round(Math.max(0, modeled.baselineCarbonKg * sensitivityCase.carbonFactorMultiplier - carbonReductionKg));
    const adjustedInvestment = input.assumptions.investmentInr * sensitivityCase.capexMultiplier;
    const roiPct = adjustedInvestment > 0 ? round(((annualSavingsInr * 3 - adjustedInvestment) / adjustedInvestment) * 100) : null;
    const paybackYears = adjustedInvestment > 0 && annualSavingsInr > 0 ? round(adjustedInvestment / annualSavingsInr) : null;
    return { label: sensitivityCase.label, inputs: { performancePct: sensitivityCase.performancePct, capexMultiplier: sensitivityCase.capexMultiplier, tariffMultiplier: sensitivityCase.tariffMultiplier, carbonFactorMultiplier: sensitivityCase.carbonFactorMultiplier }, annualSavingsInr, carbonReductionKg, projectedCarbonKg, roiPct, paybackYears };
  });
  return {
    version: SCENARIO_SENSITIVITY_VERSION,
    results,
    disclosure: "Sensitivity cases are deterministic model ranges driven only by the displayed performance, capex, tariff, and carbon-factor multipliers. They are not probabilities, forecasts, procurement quotations, certified emissions factors, or realized outcomes.",
  };
}
