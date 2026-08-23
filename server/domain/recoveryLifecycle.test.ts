import { describe, expect, it } from "vitest";
import { planRecoveryFailure, planRecoveryRetry, shouldResolveRecovery } from "./recoveryLifecycle";

describe("monitoring recovery lifecycle", () => {
  it("moves an open recovery into one owned retry and reuses that retry for duplicate requests", () => {
    expect(planRecoveryRetry({ status: "open", retryRunKey: null, attemptCount: 0, requestedRunKey: "recovery:8:9:one" })).toEqual({ kind: "start", retryRunKey: "recovery:8:9:one", attemptCount: 1 });
    expect(planRecoveryRetry({ status: "retrying", retryRunKey: "recovery:8:9:one", attemptCount: 1, requestedRunKey: "recovery:8:9:two" })).toEqual({ kind: "reuse", retryRunKey: "recovery:8:9:one", attemptCount: 1 });
  });

  it("reopens the same retry after failure and opens a fresh recovery only for a non-retry failure", () => {
    expect(planRecoveryFailure({ retryingRecoveryExists: true, errorSummary: "Database timeout" })).toEqual({ kind: "reopen", reason: "Retry failed: Database timeout" });
    expect(planRecoveryFailure({ retryingRecoveryExists: false, errorSummary: "Database timeout" })).toEqual({ kind: "open", reason: "Database timeout" });
  });

  it("resolves only the recovery owned by the successful matching retry run", () => {
    expect(shouldResolveRecovery({ status: "retrying", retryRunKey: "recovery:8:9:one", completedRunKey: "recovery:8:9:one" })).toBe(true);
    expect(shouldResolveRecovery({ status: "retrying", retryRunKey: "recovery:8:9:one", completedRunKey: "recovery:8:10:one" })).toBe(false);
    expect(shouldResolveRecovery({ status: "open", retryRunKey: "recovery:8:9:one", completedRunKey: "recovery:8:9:one" })).toBe(false);
  });
});
