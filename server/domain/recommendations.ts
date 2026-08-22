export const RECOMMENDATION_VERSION = "evidence-rules-v1" as const;

export type AnomalyEvidenceInput = {
  anomalyId: number;
  resourceType: "energy" | "water" | "waste" | "fuel" | "renewable";
  meterName: string;
  severity: "low" | "medium" | "high" | "critical";
  baselineMean: number;
  observedValue: number;
  zScore: number;
  detectedAt: Date;
};

export type DeterministicRecommendation = {
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  rationale: string;
  confidence: number;
  expectedImpact: { excessValue: number; unit: string; carbonOrSavingsEstimate: null; disclosure: string };
  evidence: { anomalyId: number; baselineMean: number; observedValue: number; excessValue: number; zScore: number; detectedAt: string };
};

const units: Record<AnomalyEvidenceInput["resourceType"], string> = {
  energy: "canonical energy units",
  water: "canonical water units",
  waste: "canonical waste units",
  fuel: "canonical fuel units",
  renewable: "canonical renewable units",
};

export function buildAnomalyRecommendation(input: AnomalyEvidenceInput): DeterministicRecommendation {
  const excessValue = Math.max(0, Math.round((input.observedValue - input.baselineMean) * 10_000) / 10_000);
  const priority = input.severity;
  const resourceLabel = input.resourceType === "energy" ? "energy" : input.resourceType;
  const action = input.resourceType === "energy"
    ? "Inspect operating schedules, controls, and equipment runtime before approving an intervention."
    : `Inspect the ${resourceLabel} source and validate the reading before selecting an intervention.`;

  return {
    priority,
    title: `Investigate ${input.meterName} variance`,
    rationale: `${input.meterName} recorded ${input.observedValue} against a historical mean of ${input.baselineMean} (z-score ${input.zScore}). ${action}`,
    confidence: input.severity === "critical" ? 0.9 : input.severity === "high" ? 0.8 : input.severity === "medium" ? 0.7 : 0.6,
    expectedImpact: {
      excessValue,
      unit: units[input.resourceType],
      carbonOrSavingsEstimate: null,
      disclosure: "No carbon or savings estimate is supplied because this recommendation has no approved factor or intervention scenario attached.",
    },
    evidence: {
      anomalyId: input.anomalyId,
      baselineMean: input.baselineMean,
      observedValue: input.observedValue,
      excessValue,
      zScore: input.zScore,
      detectedAt: input.detectedAt.toISOString(),
    },
  };
}
