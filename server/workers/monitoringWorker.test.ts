import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  beginMonitoringRun: vi.fn(),
  listReadingsForMonitoring: vi.fn(),
  listUnprocessedReadingsForMonitoring: vi.fn(),
  listApprovedEmissionFactors: vi.fn(),
  listDataQualityRuleProfiles: vi.fn(),
  listActiveOperatingCalendarWindows: vi.fn(),
  upsertQualityFindings: vi.fn(),
  createAnomalyIfAbsent: vi.fn(),
  createMonitoringAlertIfAbsent: vi.fn(),
  getActiveMaintenanceWindow: vi.fn(),
  markAnomalyAlertSuppressed: vi.fn(),
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

import { ANALYTICS_HISTORY_WINDOW, appendBoundedHistory, runMonitoringForOrganization } from "./monitoringWorker";

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
    database.listDataQualityRuleProfiles.mockResolvedValue([]);
    database.listActiveOperatingCalendarWindows.mockResolvedValue([]);
    database.getActiveMaintenanceWindow.mockResolvedValue(null);
  });

  it("skips an existing idempotency key without rescanning readings", async () => {
    database.beginMonitoringRun.mockResolvedValue({ created: false, summary: { readingsScanned: 4, qualityFindingsCreated: 16, anomaliesCreated: 1, alertsCreated: 1, ecoScoresUpdated: 1, latestEcoScore: 72 } });

    const result = await runMonitoringForOrganization({ organizationId: 8, runKey: "manual:existing-run", trigger: "manual" });

    expect(result).toMatchObject({ status: "skipped", readingsScanned: 4, latestEcoScore: 72 });
    expect(database.listReadingsForMonitoring).not.toHaveBeenCalled();
  });

  it("retains only the exact detector window with a stable in-place history reference", () => {
    const history: number[] = [];
    const reference = history;
    for (let value = 1; value <= ANALYTICS_HISTORY_WINDOW + 12; value += 1) appendBoundedHistory(history, value);
    expect(history).toBe(reference);
    expect(history).toHaveLength(ANALYTICS_HISTORY_WINDOW);
    expect(history[0]).toBe(13);
    expect(history.at(-1)).toBe(ANALYTICS_HISTORY_WINDOW + 12);
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
    expect(database.createAnomalyIfAbsent).toHaveBeenCalledWith(expect.objectContaining({ evidence: expect.objectContaining({ operatingCalendar: { state: "unconfigured", baselineBucket: "unconfigured", matchedWindowIds: [] } }) }));
  });

  it("partitions the anomaly baseline by configured off-hours without suppressing the resulting alert path", async () => {
    const rows = [reading(1, 100, 1), reading(2, 100, 2), reading(3, 100, 3), reading(4, 170, 4)];
    database.beginMonitoringRun.mockResolvedValue({ created: true });
    database.listReadingsForMonitoring.mockResolvedValue(rows);
    database.listUnprocessedReadingsForMonitoring.mockResolvedValue(rows);
    database.listActiveOperatingCalendarWindows.mockResolvedValue([{ id: 45, meterId: 3, timezone: "Asia/Kolkata", weekdays: [0, 1, 2, 3, 4, 5, 6], startMinuteLocal: 9 * 60, endMinuteLocal: 18 * 60, isActive: true }]);
    database.createAnomalyIfAbsent.mockResolvedValue({ created: true, anomalyId: 88 });
    database.createMonitoringAlertIfAbsent.mockResolvedValue({ created: false, alertId: 0 });

    await runMonitoringForOrganization({ organizationId: 8, runKey: "manual:off-hours-context", trigger: "manual" });

    expect(database.createAnomalyIfAbsent).toHaveBeenCalledWith(expect.objectContaining({ evidence: expect.objectContaining({ operatingCalendar: { state: "outside_configured_hours", baselineBucket: "outside_configured_hours", matchedWindowIds: [] } }) }));
    expect(database.createMonitoringAlertIfAbsent).toHaveBeenCalled();
  });

  it("retains a newly detected anomaly but suppresses its alert when the reading occurs inside a persisted maintenance window", async () => {
    const rows = [reading(1, 100, 1), reading(2, 100, 2), reading(3, 100, 3), reading(4, 170, 4)];
    database.beginMonitoringRun.mockResolvedValue({ created: true });
    database.listReadingsForMonitoring.mockResolvedValue(rows);
    database.listUnprocessedReadingsForMonitoring.mockResolvedValue(rows);
    database.createAnomalyIfAbsent.mockResolvedValue({ created: true, anomalyId: 88 });
    database.getActiveMaintenanceWindow.mockResolvedValue({ id: 77, meterId: 3, label: "HVAC maintenance" });

    const result = await runMonitoringForOrganization({ organizationId: 8, runKey: "manual:maintenance-suppression", trigger: "manual" });

    expect(result).toMatchObject({ status: "completed", anomaliesCreated: 1, alertsCreated: 0 });
    expect(database.markAnomalyAlertSuppressed).toHaveBeenCalledWith({ organizationId: 8, anomalyId: 88, maintenanceWindowId: 77 });
    expect(database.createMonitoringAlertIfAbsent).not.toHaveBeenCalled();
  });
});
