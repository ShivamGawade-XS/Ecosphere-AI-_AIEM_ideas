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
  qualityStatuses?: string[];
  forecast?: { id: number; status: string; calculationVersion: string; inputReadingCount: number } | null;
  carbon?: { emittedKgCo2ePerUnit: number; factorVersion: string; calculationVersion: string } | null;
  scenario?: { id: number; name: string; calculationVersion: string; carbonReductionKg: number } | null;
  comparison?: { id: number; name: string; rankingVersion: string } | null;
};

export type DeterministicRecommendation = {
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  rationale: string;
  confidence: number;
  expectedImpact: { excessValue: number; unit: string; carbonOrSavingsEstimate: { excessKgCo2e: number; factorVersion: string; calculationVersion: string } | null; disclosure: string };
  evidence: { anomalyId: number; baselineMean: number; observedValue: number; excessValue: number; zScore: number; detectedAt: string; qualityStatuses: string[]; forecast: AnomalyEvidenceInput["forecast"]; scenario: AnomalyEvidenceInput["scenario"]; comparison: AnomalyEvidenceInput["comparison"] };
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
  const carbonOrSavingsEstimate = input.carbon ? {
    excessKgCo2e: Math.round(excessValue * input.carbon.emittedKgCo2ePerUnit * 10_000) / 10_000,
    factorVersion: input.carbon.factorVersion,
    calculationVersion: input.carbon.calculationVersion,
  } : null;
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
      carbonOrSavingsEstimate,
      disclosure: carbonOrSavingsEstimate ? "The CO2e estimate is the observed excess multiplied by the persisted factor used for this reading; it is not a savings guarantee." : "No carbon or savings estimate is supplied because this recommendation has no persisted carbon factor for this reading.",
    },
    evidence: {
      anomalyId: input.anomalyId,
      baselineMean: input.baselineMean,
      observedValue: input.observedValue,
      excessValue,
      zScore: input.zScore,
      detectedAt: input.detectedAt.toISOString(),
      qualityStatuses: input.qualityStatuses ?? [],
      forecast: input.forecast ?? null,
      scenario: input.scenario ?? null,
      comparison: input.comparison ?? null,
    },
  };
}
