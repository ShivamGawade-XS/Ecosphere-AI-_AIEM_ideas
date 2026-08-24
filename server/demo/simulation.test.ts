import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  getActiveDemoSimulationSession: vi.fn(),
  getLatestDemoSimulationSession: vi.fn(),
  listSites: vi.fn(),
  createSite: vi.fn(),
  listMeters: vi.fn(),
  createMeter: vi.fn(),
  createDemoSimulationSession: vi.fn(),
  ingestReading: vi.fn(),
  advanceDemoSimulationSession: vi.fn(),
  markDemoSimulationSpikeInjected: vi.fn(),
  resetDemoSimulationSession: vi.fn(),
}));
vi.mock("../db", () => database);

const worker = vi.hoisted(() => ({ runMonitoringForOrganization: vi.fn() }));
vi.mock("../workers/monitoringWorker", () => worker);

import { advanceDemoSimulation, injectDemoHvacSpike, resetDemoSimulation, startDemoSimulation } from "./simulation";

describe("guided demo simulation service", () => {
  const anchorObservedAt = new Date("2026-08-24T09:00:00.000Z");
  const activeSession = { id: 42, organizationId: 8, siteId: 77, status: "running" as const, cycle: 0, anchorObservedAt, spikeInjectedAt: null };

  beforeEach(() => {
    vi.clearAllMocks();
    database.getActiveDemoSimulationSession.mockResolvedValue(null);
    database.listSites.mockResolvedValue([]);
    database.createSite.mockResolvedValue({ id: 77 });
    database.listMeters.mockResolvedValue([]);
    database.createMeter
      .mockResolvedValueOnce({ id: 101 })
      .mockResolvedValueOnce({ id: 102 })
      .mockResolvedValueOnce({ id: 103 });
    database.createDemoSimulationSession.mockResolvedValue(activeSession);
    database.ingestReading.mockResolvedValue({ idempotent: false, reading: { id: 1 } });
    database.advanceDemoSimulationSession.mockResolvedValue({ ...activeSession, cycle: 1 });
    database.markDemoSimulationSpikeInjected.mockResolvedValue({ ...activeSession, status: "spike_injected", spikeInjectedAt: anchorObservedAt });
    database.resetDemoSimulationSession.mockResolvedValue({ sessionId: 42, supersededReadingCount: 9, resolvedAlertCount: 1, resolvedAnomalyCount: 1 });
    worker.runMonitoringForOrganization.mockResolvedValue({ organizationId: 8, status: "completed", readingsScanned: 3, anomaliesCreated: 0, alertsCreated: 0, qualityFindingsCreated: 0, ecoScoresUpdated: 1, latestEcoScore: 100 });
  });

  it("creates an explicitly simulated fixture, baseline evidence, and one server worker run", async () => {
    const result = await startDemoSimulation({ organizationId: 8, userId: 17, anchorObservedAt });
    expect(result).toMatchObject({ stage: "started", explicitlySimulated: true, readingsAccepted: 6, session: { id: 42, status: "running" } });
    expect(database.createSite).toHaveBeenCalledWith(expect.objectContaining({ code: "AIEM-DEMO", organizationId: 8 }));
    expect(database.createMeter).toHaveBeenCalledTimes(3);
    expect(database.ingestReading).toHaveBeenCalledTimes(6);
    expect(database.ingestReading).toHaveBeenCalledWith(expect.objectContaining({ source: "simulated", sourceReference: "demo-session:42", provenance: expect.objectContaining({ explicitlySimulated: true, demoKind: "baseline" }) }));
    expect(worker.runMonitoringForOrganization).toHaveBeenCalledWith({ organizationId: 8, runKey: "demo:42:baseline", trigger: "manual" });
  });

  it("advances one bounded cycle and reruns monitoring without a browser loop", async () => {
    database.getActiveDemoSimulationSession.mockResolvedValue(activeSession);
    database.listMeters.mockResolvedValue([
      { id: 101, siteId: 77, meterKey: "demo-hvac-energy", canonicalUnit: "kWh" },
      { id: 102, siteId: 77, meterKey: "demo-water", canonicalUnit: "m³" },
      { id: 103, siteId: 77, meterKey: "demo-waste", canonicalUnit: "kg" },
    ]);
    const result = await advanceDemoSimulation({ organizationId: 8, userId: 17 });
    expect(result).toMatchObject({ stage: "cycle_advanced", readingsAccepted: 3, session: { cycle: 1 } });
    expect(database.advanceDemoSimulationSession).toHaveBeenCalledWith({ organizationId: 8, sessionId: 42, cycle: 1, userId: 17 });
    expect(worker.runMonitoringForOrganization).toHaveBeenCalledWith({ organizationId: 8, runKey: "demo:42:cycle:1", trigger: "manual" });
  });

  it("injects exactly one controlled HVAC spike and resets only the matching session evidence", async () => {
    database.getActiveDemoSimulationSession.mockResolvedValue(activeSession);
    database.listMeters.mockResolvedValue([
      { id: 101, siteId: 77, meterKey: "demo-hvac-energy", canonicalUnit: "kWh" },
      { id: 102, siteId: 77, meterKey: "demo-water", canonicalUnit: "m³" },
      { id: 103, siteId: 77, meterKey: "demo-waste", canonicalUnit: "kg" },
    ]);
    const spike = await injectDemoHvacSpike({ organizationId: 8, userId: 17 });
    expect(spike).toMatchObject({ stage: "spike_injected", readingsAccepted: 1, session: { status: "spike_injected" } });
    expect(database.ingestReading).toHaveBeenCalledWith(expect.objectContaining({ value: 260, source: "simulated", provenance: expect.objectContaining({ demoKind: "spike" }) }));
    expect(worker.runMonitoringForOrganization).toHaveBeenCalledWith({ organizationId: 8, runKey: "demo:42:spike", trigger: "manual" });

    const reset = await resetDemoSimulation({ organizationId: 8, userId: 17 });
    expect(reset).toMatchObject({ stage: "reset", explicitlySimulated: true, resetSummary: { supersededReadingCount: 9, resolvedAlertCount: 1 } });
    expect(database.resetDemoSimulationSession).toHaveBeenCalledWith({ organizationId: 8, sessionId: 42, userId: 17 });
  });
});
