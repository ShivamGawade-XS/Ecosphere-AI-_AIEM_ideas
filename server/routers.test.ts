import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const database = vi.hoisted(() => ({
  getOrganizationMembership: vi.fn(),
  getMeterById: vi.fn(),
  ingestReading: vi.fn(),
  listOrganizationsForUser: vi.fn(),
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
});
