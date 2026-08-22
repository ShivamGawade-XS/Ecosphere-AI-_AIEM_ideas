import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const database = vi.hoisted(() => ({
  getOrganizationMembership: vi.fn(),
  getMeterById: vi.fn(),
  ingestReading: vi.fn(),
  listOrganizationsForUser: vi.fn(),
  listSites: vi.fn(),
  createSustainabilityAction: vi.fn(),
  getOperationsOverview: vi.fn(),
  createSustainabilityScenario: vi.fn(),
}));

vi.mock("./db", () => database);

import { appRouter } from "./routers";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 17,
      openId: "ecosystem-user",
      name: "AIEM Operator",
      email: "operator@example.test",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("EcoSphere core API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.getOrganizationMembership.mockResolvedValue({ organizationId: 8, userId: 17, role: "operator" });
    database.getMeterById.mockResolvedValue({ id: 44, organizationId: 8, siteId: 13, canonicalUnit: "kWh", isActive: true });
    database.ingestReading.mockResolvedValue({ reading: { id: 99 }, idempotent: false });
    database.listOrganizationsForUser.mockResolvedValue([{ organization: { id: 8, name: "AIEM Campus" }, membership: { role: "owner" } }]);
    database.listSites.mockResolvedValue([{ id: 13, organizationId: 8, name: "AIEM Main Campus" }]);
    database.createSustainabilityAction.mockResolvedValue({ id: 71 });
    database.getOperationsOverview.mockResolvedValue({ siteCount: 1, meterCount: 1, readingCount: 0, actionCount: 0, activeActionCount: 0, latestReadingAt: null });
    database.createSustainabilityScenario.mockResolvedValue({ id: 84 });
  });

  it("persists an authenticated reading with a server-owned user identifier", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const observedAt = new Date("2026-08-22T03:00:00.000Z");

    const result = await caller.readings.ingest({
      organizationId: 8,
      siteId: 13,
      meterId: 44,
      observedAt,
      value: 112.5,
      unit: "kWh",
      source: "manual",
      idempotencyKey: "meter-44-2026-08-22t0300",
      provenance: { entryMethod: "test" },
    });

    expect(result).toEqual({ reading: { id: 99 }, idempotent: false });
    expect(database.ingestReading).toHaveBeenCalledWith(expect.objectContaining({ userId: 17, meterId: 44, observedAt, unit: "kWh" }));
  });

  it("rejects a reading when its unit is inconsistent with the registered meter", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.readings.ingest({
      organizationId: 8,
      siteId: 13,
      meterId: 44,
      observedAt: new Date("2026-08-22T03:00:00.000Z"),
      value: 1,
      unit: "m³",
      source: "manual",
      idempotencyKey: "invalid-unit-entry",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });
    expect(database.ingestReading).not.toHaveBeenCalled();
  });

  it("refuses an operator action outside the caller's organization", async () => {
    database.getOrganizationMembership.mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.readings.ingest({
      organizationId: 9,
      siteId: 13,
      meterId: 44,
      observedAt: new Date("2026-08-22T03:00:00.000Z"),
      value: 1,
      unit: "kWh",
      source: "manual",
      idempotencyKey: "cross-tenant-denial",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(database.getMeterById).not.toHaveBeenCalled();
  });

  it("returns the implementation inventory only after authentication", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.implementation.status();

    expect(result.summary).toMatchObject({ total: expect.any(Number), organizationCount: 1 });
    expect(result.items.some((item) => item.id === "ingestion" && item.status === "complete")).toBe(true);
  });

  it("creates an accountable action with the authenticated actor and a tenant-owned site", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.actions.create({
      organizationId: 8,
      siteId: 13,
      title: "Inspect HVAC schedule",
      description: "Review operating hours after a verified energy signal.",
      priority: "high",
      expectedCarbonReductionKg: 120.5,
    });

    expect(result).toEqual({ id: 71 });
    expect(database.createSustainabilityAction).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, siteId: 13, userId: 17, priority: "high" }));
  });

  it("keeps unimplemented analytics explicit in the intelligence readiness response", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.intelligence.readiness({ organizationId: 8 });

    expect(result.pipeline).toContainEqual(expect.objectContaining({ id: "analytics", state: "planned" }));
    expect(result.pipeline).toContainEqual(expect.objectContaining({ id: "readings", state: "waiting", evidence: "0 persisted readings" }));
  });

  it("calculates a deterministic server-owned scenario preview", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.scenarios.preview({
      organizationId: 8,
      assumptions: { baselineEnergyKwh: 100, baselineWaterM3: 10, baselineWasteKg: 10, energyReductionPct: 10, renewableSharePct: 0, waterReductionPct: 0, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 1_000 },
    });

    expect(result.calculationVersion).toBe("pilot-v1");
    expect(result.results).toMatchObject({ projectedEnergyKwh: 90, baselineCarbonKg: 91.59, projectedCarbonKg: 83.39, carbonReductionKg: 8.2 });
  });

  it("persists a scenario with the server calculation and authenticated actor", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const assumptions = { baselineEnergyKwh: 100, baselineWaterM3: 10, baselineWasteKg: 10, energyReductionPct: 10, renewableSharePct: 0, waterReductionPct: 0, wasteReductionPct: 0, recyclingPct: 0, investmentInr: 1_000 };
    const result = await caller.scenarios.save({ organizationId: 8, name: "HVAC option", assumptions });

    expect(result.scenario).toEqual({ id: 84 });
    expect(database.createSustainabilityScenario).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, name: "HVAC option", userId: 17, calculationVersion: "pilot-v1", results: expect.objectContaining({ carbonReductionKg: 8.2 }) }));
  });
});
