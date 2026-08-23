export type ScheduledMonitoringTarget = {
  isEnabled: boolean;
  staleAfterMinutes: number;
} | null;

export type ScheduledMonitoringRun = {
  startedAt: Date;
  status: "running" | "completed" | "failed" | "skipped";
} | null;

export function evaluateScheduledMonitoringHealth(input: { target: ScheduledMonitoringTarget; latestRun: ScheduledMonitoringRun; now: Date }) {
  const { target, latestRun, now } = input;
  const ageMinutes = latestRun ? Math.max(0, Math.floor((now.getTime() - latestRun.startedAt.getTime()) / 60_000)) : null;
  const state = !target || !target.isEnabled
    ? "not_enabled"
    : !latestRun
      ? "stale"
      : latestRun.status === "failed"
        ? "failed"
        : ageMinutes !== null && ageMinutes > target.staleAfterMinutes
          ? "stale"
          : "healthy";
  return { state, ageMinutes } as const;
}
