export type TargetDirection = "at_most" | "at_least";
export type TargetAssessmentState = "achieved" | "at_risk" | "off_track" | "no_data";
export type TargetFreshness = "fresh" | "stale" | "unknown";

export function targetDirectionForType(targetType: "energy" | "water" | "waste" | "carbon" | "ecoscore"): TargetDirection {
  return targetType === "ecoscore" ? "at_least" : "at_most";
}

export function assessTarget(input: { targetValue: number; achievedValue: number | null; direction: TargetDirection; latestObservedAt: Date | null; now?: Date }) {
  const now = input.now ?? new Date();
  const ageHours = input.latestObservedAt ? Math.max(0, (now.getTime() - input.latestObservedAt.getTime()) / 3_600_000) : null;
  const freshness: TargetFreshness = ageHours === null ? "unknown" : ageHours <= 24 ? "fresh" : "stale";
  if (input.achievedValue === null || !Number.isFinite(input.achievedValue) || input.targetValue <= 0) {
    return { state: "no_data" as const, freshness, ageHours, progressPct: null, remainingValue: null };
  }
  const progressPct = input.direction === "at_most"
    ? (input.achievedValue / input.targetValue) * 100
    : (input.achievedValue / input.targetValue) * 100;
  const state: TargetAssessmentState = input.direction === "at_most"
    ? input.achievedValue <= input.targetValue ? "achieved" : input.achievedValue <= input.targetValue * 1.1 ? "at_risk" : "off_track"
    : input.achievedValue >= input.targetValue ? "achieved" : input.achievedValue >= input.targetValue * 0.9 ? "at_risk" : "off_track";
  const remainingValue = input.direction === "at_most" ? input.targetValue - input.achievedValue : input.achievedValue - input.targetValue;
  return { state, freshness, ageHours, progressPct: Math.round(progressPct * 10_000) / 10_000, remainingValue: Math.round(remainingValue * 10_000) / 10_000 };
}
