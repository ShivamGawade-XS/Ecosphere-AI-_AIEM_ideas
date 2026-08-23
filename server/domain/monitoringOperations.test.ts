import { describe, expect, it } from "vitest";
import { evaluateScheduledMonitoringHealth } from "./monitoringOperations";

describe("scheduled monitoring health", () => {
  const now = new Date("2026-08-22T08:00:00.000Z");
  const target = { isEnabled: true, staleAfterMinutes: 45 };

  it("reports not enabled when no active expected schedule exists", () => {
    expect(evaluateScheduledMonitoringHealth({ target: null, latestRun: null, now })).toEqual({ state: "not_enabled", ageMinutes: null });
  });

  it("reports stale with no scheduled run or an old completed run", () => {
    expect(evaluateScheduledMonitoringHealth({ target, latestRun: null, now })).toEqual({ state: "stale", ageMinutes: null });
    expect(evaluateScheduledMonitoringHealth({ target, latestRun: { status: "completed", startedAt: new Date("2026-08-22T07:14:00.000Z") }, now })).toEqual({ state: "stale", ageMinutes: 46 });
  });

  it("reports a recent successful run as healthy and a failed run as failed", () => {
    expect(evaluateScheduledMonitoringHealth({ target, latestRun: { status: "completed", startedAt: new Date("2026-08-22T07:30:00.000Z") }, now })).toEqual({ state: "healthy", ageMinutes: 30 });
    expect(evaluateScheduledMonitoringHealth({ target, latestRun: { status: "failed", startedAt: new Date("2026-08-22T07:59:00.000Z") }, now })).toEqual({ state: "failed", ageMinutes: 1 });
  });
});
