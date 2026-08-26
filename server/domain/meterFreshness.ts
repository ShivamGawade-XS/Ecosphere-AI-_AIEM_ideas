export type MeterFreshnessState = "fresh" | "aging" | "stale" | "no_accepted_evidence";

export function assessMeterFreshness(latestAcceptedObservedAt: Date | null, now: Date) {
  if (!latestAcceptedObservedAt) return { state: "no_accepted_evidence" as const, ageHours: null, disclosure: "No accepted, non-superseded reading is available for this active meter." };
  const ageHours = Math.max(0, (now.getTime() - latestAcceptedObservedAt.getTime()) / 3_600_000);
  if (ageHours <= 24) return { state: "fresh" as const, ageHours, disclosure: "Latest accepted evidence is within the 24-hour operational freshness threshold." };
  if (ageHours <= 72) return { state: "aging" as const, ageHours, disclosure: "Latest accepted evidence is 24–72 hours old; confirm source cadence before using it for timely operations." };
  return { state: "stale" as const, ageHours, disclosure: "Latest accepted evidence is older than 72 hours; do not treat this meter as current operational evidence." };
}
