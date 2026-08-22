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
  listSustainabilityActions: vi.fn(),
  listOrganizationAuditEvents: vi.fn(),
  updateSustainabilityActionStatus: vi.fn(),
  getOperationsOverview: vi.fn(),
  createSustainabilityScenario: vi.fn(),
  listSustainabilityScenarios: vi.fn(),
  getMonitoringStatus: vi.fn(),
  getMonitoringOverview: vi.fn(),
  acknowledgeMonitoringAlert: vi.fn(),
  listDataImportFiles: vi.fn(),
  createEmissionFactor: vi.fn(),
  approveEmissionFactor: vi.fn(),
  createReadingCorrection: vi.fn(),
  getImportLineage: vi.fn(),
  getReadingLineage: vi.fn(),
  getMonitoringOperationalHealth: vi.fn(),
  upsertMonitoringServiceTarget: vi.fn(),
  markMonitoringRecoveryRetry: vi.fn(),
  getAlertRoutingPreference: vi.fn(),
  upsertAlertRoutingPreference: vi.fn(),
  listAlertDeliveryAttempts: vi.fn(),
  getAlertEscalationPolicy: vi.fn(),
  upsertAlertEscalationPolicy: vi.fn(),
  listAlertEscalations: vi.fn(),
  evaluateAlertEscalations: vi.fn(),
  listSustainabilityForecasts: vi.fn(),
  generateSustainabilityForecast: vi.fn(),
  listSustainabilityRecommendations: vi.fn(),
  generateAnomalyRecommendations: vi.fn(),
  updateSustainabilityRecommendationStatus: vi.fn(),
  acceptRecommendationAsAction: vi.fn(),
  getActionCollaboration: vi.fn(),
  addActionComment: vi.fn(),
  addActionEvidence: vi.fn(),
  listInterventionComparisons: vi.fn(),
  createInterventionComparison: vi.fn(),
  listSustainabilityReportSnapshots: vi.fn(),
  createSustainabilityReportSnapshot: vi.fn(),
}));

vi.mock("./db", () => database);

const worker = vi.hoisted(() => ({ runMonitoringForOrganization: vi.fn() }));
vi.mock("./workers/monitoringWorker", () => worker);

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
    database.listSustainabilityActions.mockResolvedValue([]);
    database.listOrganizationAuditEvents.mockResolvedValue([]);
    database.updateSustainabilityActionStatus.mockResolvedValue({ id: 71, status: "completed" });
    database.getOperationsOverview.mockResolvedValue({ siteCount: 1, meterCount: 1, readingCount: 0, actionCount: 0, activeActionCount: 0, latestReadingAt: null });
    database.createSustainabilityScenario.mockResolvedValue({ id: 84 });
    database.listSustainabilityScenarios.mockResolvedValue([]);
    database.getMonitoringStatus.mockResolvedValue({ latestRun: null, latestScore: null, openAlertCount: 0 });
    database.getMonitoringOverview.mockResolvedValue({ status: { latestRun: null, latestScore: null, openAlertCount: 0 }, alerts: [], anomalies: [], qualityFindings: [], qualityWarnings: 0, qualityFailures: 0, carbonTotals: { totalKgCo2e: 0, calculationCount: 0 } });
    database.acknowledgeMonitoringAlert.mockResolvedValue({ id: 55, status: "acknowledged" });
    database.listDataImportFiles.mockResolvedValue([{ id: 22, fileName: "readings.csv", validRows: 2, rejectedRows: 1 }]);
    database.createEmissionFactor.mockResolvedValue({ id: 31 });
    database.approveEmissionFactor.mockResolvedValue({ id: 31, status: "approved" });
    database.createReadingCorrection.mockResolvedValue({ correctionId: 41, correctedReadingId: 101 });
    database.getImportLineage.mockResolvedValue({ importFile: { id: 22, fileName: "readings.csv" }, rows: [] });
    database.getReadingLineage.mockResolvedValue({ reading: { id: 99 }, meter: { id: 44 }, corrections: [], appliedCorrection: null });
    database.getMonitoringOperationalHealth.mockResolvedValue({ state: "not_enabled", target: null, latestScheduledRun: null, openRecoveries: [], ageMinutes: null });
    database.upsertMonitoringServiceTarget.mockResolvedValue({ state: "healthy", target: { isEnabled: true }, latestScheduledRun: null, openRecoveries: [], ageMinutes: 0 });
    database.markMonitoringRecoveryRetry.mockResolvedValue({ id: 9, status: "retrying", attemptCount: 1, retryRunKey: "recovery:8:9:first", started: true });
    database.getAlertRoutingPreference.mockResolvedValue(null);
    database.upsertAlertRoutingPreference.mockResolvedValue({ id: 4, isEnabled: true, minimumSeverity: "high" });
    database.listAlertDeliveryAttempts.mockResolvedValue([]);
    database.getAlertEscalationPolicy.mockResolvedValue(null);
    database.upsertAlertEscalationPolicy.mockResolvedValue({ id: 6, isEnabled: true, minimumSeverity: "critical", afterMinutes: 60 });
    database.listAlertEscalations.mockResolvedValue([]);
    database.evaluateAlertEscalations.mockResolvedValue({ pendingCreated: 1, triggered: 0, suppressed: 0 });
    database.listSustainabilityForecasts.mockResolvedValue([]);
    database.generateSustainabilityForecast.mockResolvedValue({ id: 91, meter: { id: 44 }, forecast: { status: "ready", inputReadingCount: 6 } });
    database.listSustainabilityRecommendations.mockResolvedValue([]);
    database.generateAnomalyRecommendations.mockResolvedValue({ created: 1, recommendationIds: [61] });
    database.updateSustainabilityRecommendationStatus.mockResolvedValue({ id: 61, status: "dismissed" });
    database.acceptRecommendationAsAction.mockResolvedValue({ actionId: 72, idempotent: false });
    database.getActionCollaboration.mockResolvedValue({ action: { id: 71, title: "Inspect HVAC" }, comments: [], evidence: [] });
    database.addActionComment.mockResolvedValue({ id: 13 });
    database.addActionEvidence.mockResolvedValue({ id: 14 });
    database.listInterventionComparisons.mockResolvedValue([]);
    database.createInterventionComparison.mockResolvedValue({ id: 81, results: [], rankingVersion: "scenario-impact-rank-v1" });
    database.listInterventionComparisons.mockResolvedValue([]);
    database.listSustainabilityReportSnapshots.mockResolvedValue([]);
    database.createSustainabilityReportSnapshot.mockResolvedValue({ id: 101, criteria: {}, evidence: {}, factorDisclosure: "Pilot fallback disclosed." });
    worker.runMonitoringForOrganization.mockResolvedValue({ organizationId: 8, runKey: "manual:test-run", status: "completed", readingsScanned: 1, qualityFindingsCreated: 4, anomaliesCreated: 0, alertsCreated: 0, ecoScoresUpdated: 1, latestEcoScore: 100 });
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

  it("reports actual deterministic monitoring readiness and marks deterministic forecast and recommendation services as available", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.intelligence.readiness({ organizationId: 8 });

    expect(result.pipeline).toContainEqual(expect.objectContaining({ id: "analytics", state: "waiting" }));
    expect(result.pipeline).toContainEqual(expect.objectContaining({ id: "forecast", state: "ready" }));
    expect(result.pipeline).toContainEqual(expect.objectContaining({ id: "recommendations", state: "ready" }));
    expect(result.pipeline).toContainEqual(expect.objectContaining({ id: "readings", state: "waiting", evidence: "0 persisted readings" }));
  });

  it("runs R3 decision-support operations with the authenticated actor and tenant-scoped inputs", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.forecasts.generate({ organizationId: 8, meterId: 44, horizonPoints: 6 })).resolves.toMatchObject({ id: 91, forecast: { status: "ready" } });
    await expect(caller.recommendations.generateForOpenAnomalies({ organizationId: 8 })).resolves.toEqual({ created: 1, recommendationIds: [61] });
    await expect(caller.recommendations.acceptAsAction({ organizationId: 8, recommendationId: 61 })).resolves.toEqual({ actionId: 72, idempotent: false });
    await expect(caller.actions.addComment({ organizationId: 8, actionId: 71, body: "Facilities review scheduled." })).resolves.toEqual({ id: 13 });
    await expect(caller.actions.addEvidence({ organizationId: 8, actionId: 71, type: "url", label: "Inspection record", reference: "https://records.example.test/hvac" })).resolves.toEqual({ id: 14 });
    await expect(caller.comparisons.create({ organizationId: 8, name: "HVAC options", scenarioIds: [84, 85] })).resolves.toMatchObject({ id: 81, rankingVersion: "scenario-impact-rank-v1" });
    await expect(caller.reports.createSnapshot({ organizationId: 8, title: "August evidence" })).resolves.toMatchObject({ id: 101 });

    expect(database.generateSustainabilityForecast).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, meterId: 44, userId: 17 }));
    expect(database.acceptRecommendationAsAction).toHaveBeenCalledWith({ organizationId: 8, recommendationId: 61, userId: 17 });
    expect(database.addActionComment).toHaveBeenCalledWith(expect.objectContaining({ actionId: 71, userId: 17 }));
    expect(database.createInterventionComparison).toHaveBeenCalledWith(expect.objectContaining({ scenarioIds: [84, 85], userId: 17 }));
    expect(database.createSustainabilityReportSnapshot).toHaveBeenCalledWith({ organizationId: 8, title: "August evidence", userId: 17 });
  });

  it("refuses R3 operations before invoking persistence when the caller has no tenant membership", async () => {
    database.getOrganizationMembership.mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.recommendations.generateForOpenAnomalies({ organizationId: 9 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(database.generateAnomalyRecommendations).not.toHaveBeenCalled();
  });

  it("runs deterministic monitoring only after the caller passes organization role checks", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.monitoring.runOnce({ organizationId: 8, runKey: "manual:test-run" });

    expect(result).toMatchObject({ status: "completed", latestEcoScore: 100 });
    expect(worker.runMonitoringForOrganization).toHaveBeenCalledWith({ organizationId: 8, runKey: "manual:test-run", trigger: "manual" });
  });

  it("returns tenant-scoped monitoring overview evidence and records alert acknowledgement with the caller identity", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const overview = await caller.analytics.overview({ organizationId: 8 });
    const acknowledgement = await caller.alerts.acknowledge({ organizationId: 8, alertId: 55 });

    expect(overview.carbonTotals).toMatchObject({ totalKgCo2e: 0 });
    expect(acknowledgement).toMatchObject({ id: 55, status: "acknowledged" });
    expect(database.acknowledgeMonitoringAlert).toHaveBeenCalledWith({ organizationId: 8, alertId: 55, userId: 17 });
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

  it("persists authorized scenario and comparison attribution when creating an action", async () => {
    database.listSustainabilityScenarios.mockResolvedValue([{ id: 84, organizationId: 8, name: "HVAC option" }]);
    database.listInterventionComparisons.mockResolvedValue([{ id: 12, organizationId: 8, name: "HVAC ranked options" }]);
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.actions.create({ organizationId: 8, title: "Implement selected controls", priority: "high", scenarioId: 84, comparisonId: 12 })).resolves.toEqual({ id: 71 });
    expect(database.createSustainabilityAction).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, scenarioId: 84, comparisonId: 12, userId: 17 }));
  });

  it("delegates authorized recommendation acceptance to the tenant-scoped action handoff", async () => {
    database.acceptRecommendationAsAction.mockResolvedValue({ actionId: 71, idempotent: false });
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.recommendations.acceptAsAction({ organizationId: 8, recommendationId: 19 })).resolves.toEqual({ actionId: 71, idempotent: false });
    expect(database.acceptRecommendationAsAction).toHaveBeenCalledWith({ organizationId: 8, recommendationId: 19, userId: 17 });
  });

  it("reads back comparison and scenario attribution after authorized recommendation acceptance", async () => {
    let acceptedAction: { id: number; title: string; scenarioId: number; comparisonId: number; organizationId: number } | null = null;
    database.acceptRecommendationAsAction.mockImplementation(async () => {
      acceptedAction = { id: 71, title: "Investigate HVAC variance", scenarioId: 84, comparisonId: 12, organizationId: 8 };
      return { actionId: 71, idempotent: false };
    });
    database.listSustainabilityActions.mockImplementation(async (organizationId: number) => acceptedAction && acceptedAction.organizationId === organizationId ? [acceptedAction] : []);
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await caller.recommendations.acceptAsAction({ organizationId: 8, recommendationId: 19 });
    await expect(caller.actions.list({ organizationId: 8 })).resolves.toEqual([{ id: 71, title: "Investigate HVAC variance", scenarioId: 84, comparisonId: 12, organizationId: 8 }]);
  });

  it("requires persisted action evidence before completion and keeps the action tenant-scoped", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    database.getActionCollaboration.mockResolvedValueOnce({ action: { id: 71 }, comments: [], evidence: [] });

    await expect(caller.actions.updateStatus({ organizationId: 8, actionId: 71, status: "completed" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });
    expect(database.updateSustainabilityActionStatus).not.toHaveBeenCalled();

    database.getActionCollaboration.mockResolvedValueOnce({ action: { id: 71 }, comments: [], evidence: [{ id: 14, type: "attachment", reference: "/manus-storage/evidence.pdf" }] });
    await expect(caller.actions.updateStatus({ organizationId: 8, actionId: 71, status: "completed" })).resolves.toMatchObject({ id: 71, status: "completed" });
    expect(database.updateSustainabilityActionStatus).toHaveBeenCalledWith({ organizationId: 8, actionId: 71, status: "completed", userId: 17 });
  });

  it("denies action collaboration, comparison, and report-snapshot records outside the caller tenant", async () => {
    database.getOrganizationMembership.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.actions.collaboration({ organizationId: 9, actionId: 71 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.comparisons.list({ organizationId: 9 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.reports.snapshots({ organizationId: 9 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.comparisons.create({ organizationId: 9, name: "Cross-tenant comparison", scenarioIds: [84, 85] })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.reports.createSnapshot({ organizationId: 9, title: "Cross-tenant evidence" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(database.getActionCollaboration).not.toHaveBeenCalledWith(9, 71);
    expect(database.listInterventionComparisons).not.toHaveBeenCalledWith(9);
    expect(database.listSustainabilityReportSnapshots).not.toHaveBeenCalledWith(9);
    expect(database.createInterventionComparison).not.toHaveBeenCalledWith(expect.objectContaining({ organizationId: 9 }));
    expect(database.createSustainabilityReportSnapshot).not.toHaveBeenCalledWith(expect.objectContaining({ organizationId: 9 }));
  });

  it("returns tenant-scoped CSV source-file evidence and requires governance roles for factor approval", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const imports = await caller.imports.list({ organizationId: 8 });
    expect(imports).toEqual([{ id: 22, fileName: "readings.csv", validRows: 2, rejectedRows: 1 }]);
    expect(database.listDataImportFiles).toHaveBeenCalledWith(8);

    await expect(caller.factors.approve({ organizationId: 8, factorId: 31 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    database.getOrganizationMembership.mockResolvedValue({ organizationId: 8, userId: 17, role: "manager" });
    const approval = await caller.factors.approve({ organizationId: 8, factorId: 31 });
    expect(approval).toMatchObject({ id: 31, status: "approved" });
    expect(database.approveEmissionFactor).toHaveBeenCalledWith({ organizationId: 8, factorId: 31, userId: 17 });
  });

  it("requires governance role and immutable source reference for a reading correction", async () => {
    database.getOrganizationMembership.mockResolvedValue({ organizationId: 8, userId: 17, role: "manager" });
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const observedAt = new Date("2026-08-22T03:00:00.000Z");
    const result = await caller.readings.correct({ organizationId: 8, originalReadingId: 99, observedAt, value: 101, reason: "Correct a verified meter transcription error." });
    expect(result).toEqual({ correctionId: 41, correctedReadingId: 101 });
    expect(database.createReadingCorrection).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, originalReadingId: 99, observedAt, value: 101, userId: 17 }));
  });

  it("returns only tenant-authorized import and reading lineage chains", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const importLineage = await caller.lineage.importFile({ organizationId: 8, importFileId: 22 });
    const readingLineage = await caller.lineage.reading({ organizationId: 8, readingId: 99 });
    expect(importLineage.importFile).toMatchObject({ id: 22, fileName: "readings.csv" });
    expect(readingLineage).toMatchObject({ reading: { id: 99 }, appliedCorrection: null });
    expect(database.getImportLineage).toHaveBeenCalledWith(8, 22);
    expect(database.getReadingLineage).toHaveBeenCalledWith(8, 99);

    database.getOrganizationMembership.mockResolvedValueOnce(undefined);
    await expect(caller.lineage.importFile({ organizationId: 9, importFileId: 22 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(database.getImportLineage).not.toHaveBeenCalledWith(9, 22);
  });

  it("keeps operational audit evidence behind governance roles and applies the tenant-bound result limit", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.audit.list({ organizationId: 8, limit: 20 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    database.getOrganizationMembership.mockResolvedValue({ organizationId: 8, userId: 17, role: "manager" });
    database.listOrganizationAuditEvents.mockResolvedValue([{ event: { id: 44, eventType: "action.created" }, actor: { id: 17, name: "Operator", email: "operator@example.test" } }]);
    await expect(caller.audit.list({ organizationId: 8, limit: 20 })).resolves.toHaveLength(1);
    expect(database.listOrganizationAuditEvents).toHaveBeenCalledWith(8, 20);
  });

  it("keeps monitoring target configuration, recovery retry, and owner alert routing behind governance roles", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const health = await caller.monitoring.health({ organizationId: 8 });
    expect(health).toMatchObject({ state: "not_enabled" });
    await expect(caller.monitoring.configureTarget({ organizationId: 8, expectedIntervalMinutes: 15, staleAfterMinutes: 45, isEnabled: true })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(caller.alertRouting.update({ organizationId: 8, minimumSeverity: "high", isEnabled: true })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });

    database.getOrganizationMembership.mockResolvedValue({ organizationId: 8, userId: 17, role: "manager" });
    await caller.monitoring.configureTarget({ organizationId: 8, expectedIntervalMinutes: 15, staleAfterMinutes: 45, isEnabled: true });
    await caller.alertRouting.update({ organizationId: 8, minimumSeverity: "high", isEnabled: true });
    const retry = await caller.monitoring.retryRecovery({ organizationId: 8, recoveryEventId: 9 });
    const deliveries = await caller.alertRouting.deliveries({ organizationId: 8 });

    expect(database.upsertMonitoringServiceTarget).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 8, userId: 17, isEnabled: true }));
    expect(database.upsertAlertRoutingPreference).toHaveBeenCalledWith({ organizationId: 8, minimumSeverity: "high", isEnabled: true, userId: 17 });
    expect(retry.recovery).toMatchObject({ id: 9, status: "retrying" });
    expect(deliveries).toEqual([]);
  });

  it("keeps in-app alert escalation policy and evaluation behind governance roles while exposing tenant evidence", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const policy = await caller.alertEscalation.get({ organizationId: 8 });
    const records = await caller.alertEscalation.list({ organizationId: 8 });
    expect(policy).toBeNull();
    expect(records).toEqual([]);
    await expect(caller.alertEscalation.update({ organizationId: 8, minimumSeverity: "critical", afterMinutes: 60, isEnabled: true })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });

    database.getOrganizationMembership.mockResolvedValue({ organizationId: 8, userId: 17, role: "manager" });
    const updated = await caller.alertEscalation.update({ organizationId: 8, minimumSeverity: "critical", afterMinutes: 60, isEnabled: true });
    const evaluation = await caller.alertEscalation.evaluateNow({ organizationId: 8 });
    expect(updated).toMatchObject({ id: 6, isEnabled: true });
    expect(evaluation).toMatchObject({ pendingCreated: 1 });
    expect(database.upsertAlertEscalationPolicy).toHaveBeenCalledWith({ organizationId: 8, minimumSeverity: "critical", afterMinutes: 60, isEnabled: true, userId: 17 });
  });

  it("does not launch a duplicate monitoring pass when a recovery is already retrying", async () => {
    database.getOrganizationMembership.mockResolvedValue({ organizationId: 8, userId: 17, role: "manager" });
    database.markMonitoringRecoveryRetry.mockResolvedValue({ id: 9, status: "retrying", attemptCount: 1, retryRunKey: "recovery:8:9:first", started: false });
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.monitoring.retryRecovery({ organizationId: 8, recoveryEventId: 9 });
    expect(result).toMatchObject({ recovery: { id: 9, started: false }, run: null });
    expect(worker.runMonitoringForOrganization).not.toHaveBeenCalled();
  });
});
