import type { OutcomeMeasurementResults } from "../../drizzle/schema";

export type OutcomeMeasurementStatus = "comparable" | "simulated_evidence";

export type OutcomeMeasurementComparisonInput = {
  baselineValue: number;
  outcomeValue: number;
  modeledProjectedValue: number;
  includesSimulatedEvidence: boolean;
};

export type OutcomeMeasurementComparison = {
  status: OutcomeMeasurementStatus;
  results: OutcomeMeasurementResults;
};

const round = (value: number) => Math.round(value * 10_000) / 10_000;

/**
 * Compare evidence-only aggregates. This function intentionally avoids carbon,
 * currency, ROI, and “realized savings” language: a post-action meter window
 * is not proof of causation, certification, or financial realization.
 */
export function compareOutcomeMeasurement(input: OutcomeMeasurementComparisonInput): OutcomeMeasurementComparison {
  if (!Number.isFinite(input.baselineValue) || input.baselineValue <= 0) throw new Error("Outcome measurement requires a positive baseline aggregate.");
  if (!Number.isFinite(input.outcomeValue) || input.outcomeValue < 0) throw new Error("Outcome measurement requires a non-negative outcome aggregate.");
  if (!Number.isFinite(input.modeledProjectedValue) || input.modeledProjectedValue < 0) throw new Error("Outcome measurement requires a non-negative modeled projection.");

  const modeledReductionValue = round(input.baselineValue - input.modeledProjectedValue);
  const observedReductionValue = round(input.baselineValue - input.outcomeValue);
  const observedReductionPct = round((observedReductionValue / input.baselineValue) * 100);
  const varianceFromModeledValue = round(observedReductionValue - modeledReductionValue);
  const status: OutcomeMeasurementStatus = input.includesSimulatedEvidence ? "simulated_evidence" : "comparable";
  const disclosure = input.includesSimulatedEvidence
    ? "This comparison includes explicitly simulated evidence and must not be described as a realized operational outcome."
    : "This comparison reports accepted-reading aggregates against a saved model. It does not prove causation, certified reduction, realized savings, or financial performance.";

  return {
    status,
    results: { modeledProjectedValue: round(input.modeledProjectedValue), modeledReductionValue, observedReductionValue, observedReductionPct, varianceFromModeledValue, disclosure },
  };
}
