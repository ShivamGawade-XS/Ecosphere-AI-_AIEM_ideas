import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  beginMonitoringRun: vi.fn(),
  listReadingsForMonitoring: vi.fn(),
  listUnprocessedReadingsForMonitoring: vi.fn(),
  listApprovedEmissionFactors: vi.fn(),
  upsertQualityFindings: vi.fn(),
  createAnomalyIfAbsent: vi.fn(),
  createMonitoringAlertIfAbsent: vi.fn(),
  upsertCarbonCalculation: vi.fn(),
  listOpenAnomalySeverities: vi.fn(),
  createEcoScoreSnapshot: vi.fn(),
  generateAnomalyRecommendations: vi.fn(),
  evaluateAlertEscalations: vi.fn(),
  completeMonitoringRun: vi.fn(),
  resolveMonitoringRecoveryForRun: vi.fn(),
  failMonitoringRun: vi.fn(),
  listOrganizationsForMonitoring: vi.fn(),
}));

vi.mock("../db", () => database);

import { runMonitoringForOrganization } from "./monitoringWorker";

function reading(id: number, value: number, minute: number) {
  return {
    reading: { id, siteId: 7, meterId: 3, value: value.toFixed(4), unit: "kWh", observedAt: new Date(`2026-08-22T00:0${minute}:00.000Z`) },
    meter: { id: 3, displayName: "HVAC Electricity", resourceType: "energy" as const, canonicalUnit: "kWh" },
  };
}

describe("monitoring worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.upsertQualityFindings.mockResolvedValue({ created: 4 });
    database.listOpenAnomalySeverities.mockResolvedValue([]);
    database.listApprovedEmissionFactors.mockResolvedValue([]);
  });

  it("skips an existing idempotency key without rescanning readings", async () => {
    database.beginMonitoringRun.mockResolvedValue({ created: false, summary: { readingsScanned: 4, qualityFindingsCreated: 16, anomaliesCreated: 1, alertsCreated: 1, ecoScoresUpdated: 1, latestEcoScore: 72 } });

    const result = await runMonitoringForOrganization({ organizationId: 8, runKey: "manual:existing-run", trigger: "manual" });

    expect(result).toMatchObject({ status: "skipped", readingsScanned: 4, latestEcoScore: 72 });
    expect(database.listReadingsForMonitoring).not.toHaveBeenCalled();
  });

  it("persists quality, carbon, a score snapshot, and a completed summary for unprocessed readings", async () => {
    const rows = [reading(1, 100, 1), reading(2, 100, 2), reading(3, 100, 3), reading(4, 101, 4)];
    database.beginMonitoringRun.mockResolvedValue({ created: true });
    database.listReadingsForMonitoring.mockResolvedValue(rows);
    database.listUnprocessedReadingsForMonitoring.mockResolvedValue(rows);

    const result = await runMonitoringForOrganization({ organizationId: 8, runKey: "manual:new-run", trigger: "manual" });

    expect(result).toMatchObject({ status: "completed", readingsScanned: 4, qualityFindingsCreated: 16, anomaliesCreated: 0, ecoScoresUpdated: 1, latestEcoScore: 100 });
    expect(database.upsertCarbonCalculation).toHaveBeenCalledTimes(4);
    expect(database.createEcoScoreSnapshot).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, score: 100 }));
    expect(database.generateAnomalyRecommendations).not.toHaveBeenCalled();
    expect(database.evaluateAlertEscalations).toHaveBeenCalledWith(8);
    expect(database.completeMonitoringRun).toHaveBeenCalledWith(expect.objectContaining({ runKey: "manual:new-run", readingsScanned: 4 }));
  });

  it("selects the newest valid approved energy factor and persists its governed version on carbon calculations", async () => {
    const rows = [reading(1, 100, 1), reading(2, 100, 2), reading(3, 100, 3), reading(4, 100, 4)];
    database.beginMonitoringRun.mockResolvedValue({ created: true });
    database.listReadingsForMonitoring.mockResolvedValue(rows);
    database.listUnprocessedReadingsForMonitoring.mockResolvedValue(rows);
    database.listApprovedEmissionFactors.mockResolvedValue([
      { id: 3, resourceType: "energy", inputUnit: "kWh", emittedKgCo2ePerUnit: "0.82", factorVersion: "regional-2025", validFrom: new Date("2025-01-01T00:00:00.000Z"), validTo: null },
      { id: 4, resourceType: "energy", inputUnit: "kwh", emittedKgCo2ePerUnit: "0.70", factorVersion: "regional-2026", validFrom: new Date("2026-08-01T00:00:00.000Z"), validTo: null },
      { id: 5, resourceType: "energy", inputUnit: "kWh", emittedKgCo2ePerUnit: "0.60", factorVersion: "future-factor", validFrom: new Date("2026-09-01T00:00:00.000Z"), validTo: null },
    ]);

    await runMonitoringForOrganization({ organizationId: 8, runKey: "manual:governed-factor", trigger: "manual" });

    expect(database.upsertCarbonCalculation).toHaveBeenCalledWith(expect.objectContaining({
      readingId: 1,
      emittedKgCo2e: 70,
      emissionFactor: 0.7,
      factorVersion: "regional-2026",
      calculationVersion: "factor-library-carbon-v1",
    }));
  });

  it("generates evidence-linked recommendations only after a newly persisted anomaly", async () => {
    const rows = [reading(1, 100, 1), reading(2, 100, 2), reading(3, 100, 3), reading(4, 170, 4)];
    database.beginMonitoringRun.mockResolvedValue({ created: true });
    database.listReadingsForMonitoring.mockResolvedValue(rows);
    database.listUnprocessedReadingsForMonitoring.mockResolvedValue(rows);
    database.createAnomalyIfAbsent.mockResolvedValue({ created: true, anomalyId: 88 });
    database.createMonitoringAlertIfAbsent.mockResolvedValue({ created: false, alertId: 0 });

    const result = await runMonitoringForOrganization({ organizationId: 8, runKey: "manual:spike-with-recommendation", trigger: "manual" });

    expect(result).toMatchObject({ status: "completed", anomaliesCreated: 1 });
    expect(database.generateAnomalyRecommendations).toHaveBeenCalledWith({ organizationId: 8 });
  });
});
