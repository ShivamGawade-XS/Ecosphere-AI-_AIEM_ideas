import { describe, expect, it } from "vitest";
import { materializeReportSnapshot } from "./reportSnapshots";

describe("materializeReportSnapshot", () => {
  it("pins tenant scope, bounds evidence collections, and discloses governed factors", () => {
    const result = materializeReportSnapshot({ organizationId: 8, generatedAt: new Date("2026-08-22T00:00:00.000Z"), overview: { siteCount: 1 }, monitoring: { openAlertCount: 0 }, forecasts: Array.from({ length: 11 }, (_, id) => ({ id })), recommendations: Array.from({ length: 21 }, (_, id) => ({ id })), comparisons: Array.from({ length: 11 }, (_, id) => ({ id })), approvedFactors: [{ factorVersion: "goa-grid-v1", sourceName: "Campus factor library" }] });
    expect(result.criteria).toMatchObject({ organizationId: 8, scope: "current tenant-bound persisted records" });
    expect(result.evidence).toMatchObject({ forecasts: expect.any(Array), recommendations: expect.any(Array), comparisons: expect.any(Array) });
    expect(result.evidence.forecasts).toHaveLength(10);
    expect(result.evidence.recommendations).toHaveLength(20);
    expect(result.evidence.comparisons).toHaveLength(10);
    expect(result.factorDisclosure).toContain("goa-grid-v1");
  });
});
