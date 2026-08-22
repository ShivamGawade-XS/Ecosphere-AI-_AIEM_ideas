export type RecoveryLifecycleStatus = "open" | "retrying" | "resolved";

export function planRecoveryRetry(input: { status: RecoveryLifecycleStatus; retryRunKey: string | null; attemptCount: number; requestedRunKey: string }) {
  if (input.status === "retrying") return { kind: "reuse" as const, retryRunKey: input.retryRunKey, attemptCount: input.attemptCount };
  if (input.status === "open") return { kind: "start" as const, retryRunKey: input.requestedRunKey, attemptCount: input.attemptCount + 1 };
  return { kind: "unavailable" as const };
}

export function planRecoveryFailure(input: { retryingRecoveryExists: boolean; errorSummary: string }) {
  return input.retryingRecoveryExists
    ? { kind: "reopen" as const, reason: `Retry failed: ${input.errorSummary}`.slice(0, 500) }
    : { kind: "open" as const, reason: input.errorSummary.slice(0, 500) };
}

export function shouldResolveRecovery(input: { status: RecoveryLifecycleStatus; retryRunKey: string | null; completedRunKey: string }) {
  return input.status === "retrying" && input.retryRunKey === input.completedRunKey;
}
