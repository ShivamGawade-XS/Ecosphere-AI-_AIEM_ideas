import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mysql = vi.hoisted(() => ({ drizzle: vi.fn() }));
vi.mock("drizzle-orm/mysql2", () => mysql);

type FakeDatabase = {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

function createDatabase(selectResults: unknown[][]) {
  const updates: Record<string, unknown>[] = [];
  const database: FakeDatabase = {
    select: vi.fn(() => {
      const result = selectResults.shift() ?? [];
      const chain = {
        from: vi.fn(() => chain),
        where: vi.fn(() => chain),
        limit: vi.fn(async () => result),
        then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(result).then(resolve),
      };
      return chain;
    }),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        updates.push(values);
        return { where: vi.fn(async () => undefined) };
      }),
    })),
  };
  return { database, updates };
}

describe("monitoring recovery persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DATABASE_URL = "mysql://recovery-test";
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.clearAllMocks();
  });

  it("persists open → retrying once and reuses the original retry key for repeated requests", async () => {
    const first = createDatabase([[{ id: 9, organizationId: 8, status: "open", retryRunKey: null, attemptCount: 0 }]]);
    mysql.drizzle.mockReturnValue(first.database);
    const firstDb = await import("./db");
    await expect(firstDb.markMonitoringRecoveryRetry({ organizationId: 8, recoveryEventId: 9, retryRunKey: "recovery:8:9:first" })).resolves.toMatchObject({ started: true, retryRunKey: "recovery:8:9:first", attemptCount: 1 });
    expect(first.updates).toContainEqual(expect.objectContaining({ status: "retrying", retryRunKey: "recovery:8:9:first", attemptCount: 1 }));

    vi.resetModules();
    const duplicate = createDatabase([[{ id: 9, organizationId: 8, status: "retrying", retryRunKey: "recovery:8:9:first", attemptCount: 1 }]]);
    mysql.drizzle.mockReturnValue(duplicate.database);
    const duplicateDb = await import("./db");
    await expect(duplicateDb.markMonitoringRecoveryRetry({ organizationId: 8, recoveryEventId: 9, retryRunKey: "recovery:8:9:second" })).resolves.toMatchObject({ started: false, retryRunKey: "recovery:8:9:first", attemptCount: 1 });
    expect(duplicate.updates).toHaveLength(0);
  });

  it("reopens the matching retry record after failure and resolves only the matching completed retry", async () => {
    const failure = createDatabase([[{ id: 9, organizationId: 8, status: "retrying", retryRunKey: "recovery:8:9:first", attemptCount: 1 }]]);
    mysql.drizzle.mockReturnValue(failure.database);
    const failureDb = await import("./db");
    await failureDb.failMonitoringRun({ organizationId: 8, runKey: "recovery:8:9:first", errorSummary: "Upstream data source timeout" });
    expect(failure.updates).toContainEqual(expect.objectContaining({ status: "open", reason: "Retry failed: Upstream data source timeout" }));

    vi.resetModules();
    const success = createDatabase([[{ id: 9, organizationId: 8, status: "retrying", retryRunKey: "recovery:8:9:first", attemptCount: 1 }]]);
    mysql.drizzle.mockReturnValue(success.database);
    const successDb = await import("./db");
    await successDb.resolveMonitoringRecoveryForRun({ organizationId: 8, runKey: "recovery:8:9:first" });
    expect(success.updates).toContainEqual(expect.objectContaining({ status: "resolved" }));
  });
});

describe("recommendation action attribution persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DATABASE_URL = "mysql://recommendation-attribution-test";
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    vi.clearAllMocks();
  });

  it("writes persisted scenario and comparison evidence onto the accepted action and audit record", async () => {
    const inserts: Record<string, unknown>[] = [];
    const updates: Record<string, unknown>[] = [];
    const tx = {
      insert: vi.fn(() => ({ values: vi.fn((values: Record<string, unknown>) => { inserts.push(values); return { $returningId: vi.fn(async () => [{ id: 71 }]) }; }) })),
      update: vi.fn(() => ({ set: vi.fn((values: Record<string, unknown>) => { updates.push(values); return { where: vi.fn(async () => undefined) }; }) })),
    };
    const database = {
      select: vi.fn(() => { const chain = { from: vi.fn(() => chain), where: vi.fn(() => chain), limit: vi.fn(async () => [{ id: 19, actionId: null, siteId: 3, title: "Investigate HVAC variance", rationale: "Review persisted evidence.", priority: "high", evidence: { scenario: { id: 84 }, comparison: { id: 12 } } }]) }; return chain; }),
      transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    mysql.drizzle.mockReturnValue(database);
    const db = await import("./db");

    await expect(db.acceptRecommendationAsAction({ organizationId: 8, recommendationId: 19, userId: 17 })).resolves.toEqual({ actionId: 71, idempotent: false });
    expect(inserts[0]).toMatchObject({ organizationId: 8, siteId: 3, scenarioId: 84, comparisonId: 12, source: "recommendation" });
    expect(updates).toContainEqual({ status: "accepted", actionId: 71 });
    expect(inserts[1]).toMatchObject({ eventType: "recommendation.accepted_as_action", payload: { actionId: 71, scenarioId: 84, comparisonId: 12 } });
  });
});
