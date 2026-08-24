export const SCHEDULER_READINESS = "not_activated_in_this_environment" as const;

export function createLivenessPayload(now: Date = new Date()) {
  return {
    ok: true,
    service: "ecosphere-ai",
    timestamp: now.toISOString(),
  };
}

export function createReadinessResponse(
  databaseAvailable: boolean,
  now: Date = new Date(),
  authenticationConfigured = true,
) {
  const body = {
    ok: databaseAvailable && authenticationConfigured,
    service: "ecosphere-ai",
    dependencies: {
      database: databaseAvailable ? "configured" : "unavailable",
      authentication: authenticationConfigured ? "configured" : "unavailable",
      scheduler: SCHEDULER_READINESS,
    },
    timestamp: now.toISOString(),
  };

  return { status: body.ok ? 200 : 503, body };
}
