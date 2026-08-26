export const DATA_QUALITY_VERSION = "pilot-quality-v1";
export const ANOMALY_DETECTOR_VERSION = "pilot-zscore-v1";
export const CARBON_CALCULATION_VERSION = "pilot-carbon-v1";
export const ECO_SCORE_CALCULATION_VERSION = "pilot-ecoscore-v1";
export const PILOT_ELECTRICITY_FACTOR_KG_CO2E_PER_KWH = 0.82;

export type ResourceType = "energy" | "water" | "waste" | "fuel" | "renewable";
export type QualityStatus = "passed" | "warning" | "failed";
export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export type QualityFindingInput = {
  ruleId: string;
  status: QualityStatus;
  message: string;
  details: Record<string, unknown>;
};

const PILOT_SAFETY_CEILINGS: Record<ResourceType, number> = {
  energy: 1_000_000,
  water: 100_000,
  waste: 100_000,
  fuel: 100_000,
  renewable: 1_000_000,
};

function round(value: number, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function evaluateReadingQuality(input: {
  value: number;
  unit: string;
  canonicalUnit: string;
  resourceType: ResourceType;
  observedAt: Date;
  now?: Date;
  ruleProfile?: { id: number; version: number; highValueCeiling: number; futureToleranceMinutes: number };
}): QualityFindingInput[] {
  const now = input.now ?? new Date();
  const futureToleranceMinutes = input.ruleProfile?.futureToleranceMinutes ?? 5;
  const highValueCeiling = input.ruleProfile?.highValueCeiling ?? PILOT_SAFETY_CEILINGS[input.resourceType];
  const isFiniteValue = Number.isFinite(input.value);
  const requiredStatus: QualityStatus = isFiniteValue && input.value >= 0 ? "passed" : "failed";
  const canonicalStatus: QualityStatus = input.unit === input.canonicalUnit ? "passed" : "failed";
  const futureStatus: QualityStatus = input.observedAt.getTime() > now.getTime() + futureToleranceMinutes * 60_000 ? "warning" : "passed";
  const highValueStatus: QualityStatus = isFiniteValue && input.value > highValueCeiling ? "warning" : "passed";

  return [
    {
      ruleId: "required-value",
      status: requiredStatus,
      message: requiredStatus === "passed" ? "Reading has a finite, non-negative value." : "Reading value must be finite and non-negative.",
      details: { value: input.value },
    },
    {
      ruleId: "canonical-unit",
      status: canonicalStatus,
      message: canonicalStatus === "passed" ? "Reading unit matches the registered meter unit." : "Reading unit does not match the registered meter unit.",
      details: { unit: input.unit, canonicalUnit: input.canonicalUnit },
    },
    {
      ruleId: "future-timestamp",
      status: futureStatus,
      message: futureStatus === "passed" ? "Reading timestamp is not materially ahead of processing time." : "Reading timestamp exceeds the configured future tolerance.",
      details: { observedAt: input.observedAt.toISOString(), evaluatedAt: now.toISOString(), futureToleranceMinutes, ruleProfileId: input.ruleProfile?.id ?? null, ruleProfileVersion: input.ruleProfile?.version ?? null },
    },
    {
      ruleId: "high-absolute-value",
      status: highValueStatus,
      message: highValueStatus === "passed" ? "Reading is within the active safety ceiling." : "Reading exceeds the active safety ceiling and requires review.",
      details: { resourceType: input.resourceType, ceiling: highValueCeiling, value: input.value, ruleProfileId: input.ruleProfile?.id ?? null, ruleProfileVersion: input.ruleProfile?.version ?? null },
    },
  ];
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function sampleStdDev(values: number[], average: number) {
  if (values.length < 2) return 0;
  const variance = values.reduce((total, value) => total + (value - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function detectReadingAnomaly(input: { observedValue: number; history: number[] }) {
  const history = input.history.slice(-30).filter(Number.isFinite);
  if (history.length < 3) {
    return { detected: false as const, reason: "insufficient-baseline", historySize: history.length };
  }

  const baselineMean = mean(history);
  const measuredStdDev = sampleStdDev(history, baselineMean);
  const fallbackStdDev = Math.max(Math.abs(baselineMean) * 0.1, 0.0001);
  const baselineStdDev = measuredStdDev > 0 ? measuredStdDev : fallbackStdDev;
  const zScore = (input.observedValue - baselineMean) / baselineStdDev;
  const magnitude = Math.abs(zScore);
  const severity: AnomalySeverity | null = magnitude >= 6 ? "critical" : magnitude >= 4.5 ? "high" : magnitude >= 3.5 ? "medium" : magnitude >= 2.5 ? "low" : null;

  return {
    detected: severity !== null,
    severity,
    baselineMean: round(baselineMean),
    baselineStdDev: round(baselineStdDev),
    zScore: round(zScore),
    historySize: history.length,
  };
}

export function calculateCarbonForReading(input: {
  resourceType: ResourceType;
  value: number;
  factor?: { emittedKgCo2ePerUnit: number; factorVersion: string; calculationVersion?: string };
}) {
  if (input.resourceType !== "energy") return null;
  const emissionFactor = input.factor?.emittedKgCo2ePerUnit ?? PILOT_ELECTRICITY_FACTOR_KG_CO2E_PER_KWH;
  return {
    emittedKgCo2e: round(input.value * emissionFactor),
    emissionFactor,
    factorVersion: input.factor?.factorVersion ?? "pilot-electricity-factor-v1",
    calculationVersion: input.factor?.calculationVersion ?? CARBON_CALCULATION_VERSION,
  };
}

export function calculateEcoScore(input: {
  qualityStatuses: QualityStatus[];
  openAnomalySeverities: AnomalySeverity[];
  latestEnergyCarbonKg?: number | null;
  previousEnergyCarbonKg?: number[];
}) {
  const failedCount = input.qualityStatuses.filter((status) => status === "failed").length;
  const warningCount = input.qualityStatuses.filter((status) => status === "warning").length;
  const qualityPenalty = Math.min(40, failedCount * 20) + Math.min(20, warningCount * 5);
  const severityPenalty: Record<AnomalySeverity, number> = { low: 3, medium: 8, high: 15, critical: 25 };
  const anomalyPenalty = Math.min(50, input.openAnomalySeverities.reduce((total, severity) => total + severityPenalty[severity], 0));
  const previous = (input.previousEnergyCarbonKg ?? []).filter(Number.isFinite);
  const averageCarbon = previous.length ? mean(previous) : null;
  const carbonTrendPenalty = input.latestEnergyCarbonKg != null && averageCarbon != null && input.latestEnergyCarbonKg > averageCarbon * 1.2 ? 10 : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - qualityPenalty - anomalyPenalty - carbonTrendPenalty)));

  return {
    score,
    components: {
      startingScore: 100,
      qualityPenalty,
      anomalyPenalty,
      carbonTrendPenalty,
      failedQualityFindings: failedCount,
      warningQualityFindings: warningCount,
      openAnomalyCount: input.openAnomalySeverities.length,
      carbonBaselineKg: averageCarbon == null ? null : round(averageCarbon),
      latestEnergyCarbonKg: input.latestEnergyCarbonKg ?? null,
    },
    calculationVersion: ECO_SCORE_CALCULATION_VERSION,
  };
}
