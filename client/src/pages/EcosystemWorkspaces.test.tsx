// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testApi = vi.hoisted(() => ({
  organizationsMine: vi.fn(), organizationMembers: vi.fn(), overview: vi.fn(), recentReadings: vi.fn(), actionList: vi.fn(), actionCollaboration: vi.fn(), siteList: vi.fn(), meterList: vi.fn(), equipmentList: vi.fn(), equipmentCreate: vi.fn(), equipmentLifecycle: vi.fn(), iotDevices: vi.fn(),
  intelligenceReadiness: vi.fn(), intelligenceTimeline: vi.fn(), monitoringOverview: vi.fn(), monitoringStatus: vi.fn(), monitoringHealth: vi.fn(), meterFreshness: vi.fn(), ecoScoreExplanation: vi.fn(), maintenanceWindows: vi.fn(), maintenanceCreate: vi.fn(), operatingCalendars: vi.fn(), operatingCalendarCreate: vi.fn(), operatingCalendarSetActive: vi.fn(), qualityRules: vi.fn(), qualityRuleUpsert: vi.fn(), demoStatus: vi.fn(), targetAssessment: vi.fn(), administrationStatus: vi.fn(), schedulerTrialStatus: vi.fn(), alertRouting: vi.fn(), deliveryAttempts: vi.fn(), escalationPolicy: vi.fn(), escalations: vi.fn(), forecastList: vi.fn(), recommendationList: vi.fn(), comparisonList: vi.fn(), portfolioOptimization: vi.fn(), reportsSummary: vi.fn(), reportSnapshots: vi.fn(), notificationInbox: vi.fn(), notificationSetRead: vi.fn(), scenarioList: vi.fn(), baselineList: vi.fn(), baselineCreate: vi.fn(), outcomeList: vi.fn(), outcomeCreate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined),
  actionCreateMode: "success" as "success" | "error", actionCreate: vi.fn(), scenarioPreviewMode: "success" as "success" | "error", scenarioSaveMode: "success" as "success" | "error", scenarioPreview: vi.fn(), scenarioSave: vi.fn(), scenarioSensitivity: vi.fn(),
  scenarioPreviewData: undefined as unknown, scenarioSensitivityData: undefined as unknown, scenarioMethodology: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      organizations: { mine: { invalidate: testApi.invalidate }, members: { invalidate: testApi.invalidate } }, sites: { list: { invalidate: testApi.invalidate } }, meters: { list: { invalidate: testApi.invalidate } }, equipment: { list: { invalidate: testApi.invalidate } }, iot: { listDevices: { invalidate: testApi.invalidate } },
      actions: { list: { invalidate: testApi.invalidate }, collaboration: { invalidate: testApi.invalidate } }, scenarios: { list: { invalidate: testApi.invalidate } }, baselines: { list: { invalidate: testApi.invalidate } }, outcomes: { list: { invalidate: testApi.invalidate } }, comparisons: { list: { invalidate: testApi.invalidate } }, forecasts: { list: { invalidate: testApi.invalidate } }, recommendations: { list: { invalidate: testApi.invalidate } }, reports: { snapshots: { invalidate: testApi.invalidate } }, notifications: { inbox: { invalidate: testApi.invalidate } }, maintenanceWindows: { list: { invalidate: testApi.invalidate } }, operatingCalendarWindows: { list: { invalidate: testApi.invalidate } }, dataQualityRules: { list: { invalidate: testApi.invalidate } }, analytics: { overview: { invalidate: testApi.invalidate }, meterFreshness: { invalidate: testApi.invalidate }, ecoScoreExplanation: { invalidate: testApi.invalidate } }, monitoring: { status: { invalidate: testApi.invalidate }, health: { invalidate: testApi.invalidate } }, demo: { status: { invalidate: testApi.invalidate } }, targets: { assessment: { invalidate: testApi.invalidate } }, schedulerTrial: { status: { invalidate: testApi.invalidate } }, administration: { applicationStatus: { invalidate: testApi.invalidate } }, alertRouting: { get: { invalidate: testApi.invalidate }, deliveries: { invalidate: testApi.invalidate } }, alertEscalation: { get: { invalidate: testApi.invalidate }, list: { invalidate: testApi.invalidate } }, intelligence: { readiness: { invalidate: testApi.invalidate }, timeline: { invalidate: testApi.invalidate } },
    }),
    organizations: { mine: { useQuery: () => testApi.organizationsMine() }, members: { useQuery: () => testApi.organizationMembers() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, updateMemberRole: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    operations: { overview: { useQuery: () => testApi.overview() } },
    readings: { recent: { useQuery: () => testApi.recentReadings() } },
    sites: { list: { useQuery: () => testApi.siteList() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    meters: { list: { useQuery: () => testApi.meterList() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    equipment: { list: { useQuery: () => testApi.equipmentList() }, create: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.equipmentCreate(input); options?.onSuccess?.(); }, error: null }) }, updateLifecycle: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.equipmentLifecycle(input); options?.onSuccess?.(); }, error: null }) } },
    iot: { listDevices: { useQuery: () => testApi.iotDevices() }, registerDevice: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, rotateDeviceCredential: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, updateDeviceStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    intelligence: { readiness: { useQuery: () => testApi.intelligenceReadiness() }, timeline: { useQuery: () => testApi.intelligenceTimeline() } },
    monitoring: { status: { useQuery: () => testApi.monitoringStatus() }, health: { useQuery: () => testApi.monitoringHealth() }, runOnce: { useMutation: () => ({ isPending: false, mutate: vi.fn(), data: undefined, error: null }) }, configureTarget: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, retryRecovery: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    demo: { status: { useQuery: () => testApi.demoStatus() }, start: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, advance: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, injectHvacSpike: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, reset: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    targets: { assessment: { useQuery: () => testApi.targetAssessment() }, create: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: () => options?.onSuccess?.(), error: null }) } },
    schedulerTrial: { status: { useQuery: () => testApi.schedulerTrialStatus() }, saveDraft: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, activate: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, pause: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    administration: { applicationStatus: { useQuery: () => testApi.administrationStatus() } },
    alertRouting: { get: { useQuery: () => testApi.alertRouting() }, deliveries: { useQuery: () => testApi.deliveryAttempts() }, update: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    alertEscalation: { get: { useQuery: () => testApi.escalationPolicy() }, list: { useQuery: () => testApi.escalations() }, update: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, evaluateNow: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    forecasts: { list: { useQuery: () => testApi.forecastList() }, generate: { useMutation: () => ({ isPending: false, mutate: vi.fn(), data: undefined, error: null }) } },
    recommendations: { list: { useQuery: () => testApi.recommendationList() }, generateForOpenAnomalies: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, updateStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, acceptAsAction: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    analytics: { overview: { useQuery: () => testApi.monitoringOverview() }, meterFreshness: { useQuery: () => testApi.meterFreshness() }, ecoScoreExplanation: { useQuery: () => testApi.ecoScoreExplanation() } },
    alerts: { acknowledge: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    actions: { list: { useQuery: () => testApi.actionList() }, collaboration: { useQuery: () => testApi.actionCollaboration() }, create: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.actionCreate(input); testApi.actionCreateMode === "error" ? options?.onError?.() : options?.onSuccess?.(); } }) }, updateStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, assign: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, approve: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, addComment: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, addEvidence: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, uploadAttachment: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    reports: { summary: { useQuery: () => testApi.reportsSummary() }, snapshots: { useQuery: () => testApi.reportSnapshots() }, createSnapshot: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    notifications: { inbox: { useQuery: () => testApi.notificationInbox() }, setReadState: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.notificationSetRead(input); options?.onSuccess?.(); }, error: null }) } },
    maintenanceWindows: { list: { useQuery: () => testApi.maintenanceWindows() }, create: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.maintenanceCreate(input); options?.onSuccess?.(); }, error: null }) } },
    operatingCalendarWindows: { list: { useQuery: () => testApi.operatingCalendars() }, create: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.operatingCalendarCreate(input); options?.onSuccess?.(); }, error: null }) }, setActive: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.operatingCalendarSetActive(input); options?.onSuccess?.(); }, error: null }) } },
    dataQualityRules: { list: { useQuery: () => testApi.qualityRules() }, upsert: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.qualityRuleUpsert(input); options?.onSuccess?.(); }, error: null }) } },
    baselines: { list: { useQuery: () => testApi.baselineList() }, create: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.baselineCreate(input); options?.onSuccess?.(); }, error: null }) } },
    outcomes: { list: { useQuery: () => testApi.outcomeList() }, create: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.outcomeCreate(input); options?.onSuccess?.(); }, error: null }) } },
    scenarios: { list: { useQuery: () => testApi.scenarioList() }, methodology: { useQuery: () => testApi.scenarioMethodology() }, preview: { useMutation: (options?: { onError?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.scenarioPreview(input); if (testApi.scenarioPreviewMode === "error") options?.onError?.(); }, data: testApi.scenarioPreviewData }) }, sensitivity: { useMutation: () => ({ isPending: false, mutate: (input: unknown) => testApi.scenarioSensitivity(input), data: testApi.scenarioSensitivityData }) }, save: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ isPending: false, mutate: (input: unknown) => { testApi.scenarioSave(input); testApi.scenarioSaveMode === "error" ? options?.onError?.() : options?.onSuccess?.(); } }) } },
    comparisons: { list: { useQuery: () => testApi.comparisonList() }, optimizePortfolio: { useQuery: () => testApi.portfolioOptimization() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
  },
}));

import OperationsOverview from "./OperationsOverview";
import RegistryWorkspace from "./RegistryWorkspace";
import IntelligenceWorkspace from "./IntelligenceWorkspace";
import ActionsWorkspace from "./ActionsWorkspace";
import ReportsWorkspace from "./ReportsWorkspace";
import ScenarioWorkspace from "./ScenarioWorkspace";
import AdministrationWorkspace from "./AdministrationWorkspace";
import NotificationsWorkspace from "./NotificationsWorkspace";

const query = (data: unknown) => ({ data, isLoading: false, isFetching: false, error: null });
const tenant = [{ organization: { id: 1, name: "AIEM Campus Pilot" }, membership: { role: "owner" } }];

describe("authenticated ecosystem workspaces", () => {
  beforeEach(() => {
    testApi.organizationsMine.mockReturnValue(query(tenant));
    testApi.organizationMembers.mockReturnValue(query([{ membership: { id: 11, organizationId: 1, userId: 17, role: "owner", createdAt: new Date("2026-08-22T00:00:00.000Z") }, user: { id: 17, name: "AIEM Owner", email: "owner@example.test" } }]));
    testApi.overview.mockReturnValue(query({ siteCount: 1, meterCount: 2, readingCount: 3, actionCount: 1, activeActionCount: 1, latestReadingAt: new Date() }));
    testApi.recentReadings.mockReturnValue(query([]));
    testApi.actionList.mockReturnValue(query([]));
    testApi.actionCollaboration.mockReturnValue(query({ action: { id: 1, title: "Inspect HVAC" }, comments: [], evidence: [] }));
    testApi.siteList.mockReturnValue(query([{ id: 13, name: "AIEM Main Campus", code: "AIEM-MAIN", timezone: "Asia/Kolkata" }]));
    testApi.meterList.mockReturnValue(query([{ id: 44, siteId: 13, displayName: "HVAC Electricity", canonicalUnit: "kWh", resourceType: "energy" }]));
    testApi.equipmentList.mockReturnValue(query([]));
    testApi.iotDevices.mockReturnValue(query([{ id: 201, meterId: 44, deviceKey: "aiem-hvac-gateway-01", displayName: "AIEM HVAC gateway", status: "active", credentialVersion: 1, lastSeenAt: null }]));
    testApi.intelligenceReadiness.mockReturnValue(query({ overview: { meterCount: 2, readingCount: 3 }, pipeline: [{ id: "registry", label: "Meter registry", state: "ready", evidence: "2 registered meters" }, { id: "analytics", label: "Anomaly and forecast worker", state: "planned", evidence: "Requires durable scheduling." }] }));
    testApi.intelligenceTimeline.mockReturnValue(query([]));
    testApi.monitoringStatus.mockReturnValue(query({ latestRun: null, latestScore: null, openAlertCount: 0 }));
    testApi.demoStatus.mockReturnValue(query({ session: null, explicitlySimulated: true }));
    testApi.targetAssessment.mockReturnValue(query([{ target: { id: 401, targetType: "energy", label: "Monthly energy ceiling", targetValue: "500.0000", unit: "kWh" }, direction: "at_most", achievedValue: 410, latestObservedAt: new Date(), assessment: { state: "achieved", freshness: "fresh", ageHours: 1 } }]));
    testApi.monitoringOverview.mockReturnValue(query({ status: { latestRun: null, latestScore: null, openAlertCount: 0 }, alerts: [], anomalies: [], qualityFindings: [], qualityWarnings: 0, qualityFailures: 0, carbonTotals: { totalKgCo2e: 0, calculationCount: 0, factorLabel: "pilot" } }));
    testApi.meterFreshness.mockReturnValue(query([]));
    testApi.ecoScoreExplanation.mockReturnValue(query(null));
    testApi.maintenanceWindows.mockReturnValue(query([]));
    testApi.operatingCalendars.mockReturnValue(query([]));
    testApi.qualityRules.mockReturnValue(query([]));
    testApi.monitoringHealth.mockReturnValue(query({ state: "not_enabled", target: null, latestScheduledRun: null, openRecoveries: [], ageMinutes: null }));
    testApi.schedulerTrialStatus.mockReturnValue(query({ configuration: { schedulerTrialStatus: "draft", scheduleCronExpression: "0 */15 * * * *", expectedIntervalMinutes: 15, staleAfterMinutes: 45 }, deploymentReady: false, callbackPath: "/api/scheduled/monitoring", cadenceOptions: [15, 30, 60, 360, 1440] }));
    testApi.administrationStatus.mockReturnValue(query({ liveness: { ok: true }, readiness: { ok: true, dependencies: { database: "configured", scheduler: "not_activated_in_this_environment" } }, readinessStatus: 200, schedulerTrial: { schedulerTrialStatus: "draft", scheduleCronExpression: "0 */15 * * * *" }, monitoringHealth: { state: "not_enabled", latestScheduledRun: null }, viewerRole: "owner", deploymentReady: false, telemetry: { requestCorrelation: "Responses include x-request-id; request completion logs exclude request bodies, headers, query strings, and raw errors." } }));
    testApi.alertRouting.mockReturnValue(query(null));
    testApi.deliveryAttempts.mockReturnValue(query([]));
    testApi.escalationPolicy.mockReturnValue(query(null));
    testApi.escalations.mockReturnValue(query([]));
    testApi.forecastList.mockReturnValue(query([]));
    testApi.recommendationList.mockReturnValue(query([]));
    testApi.comparisonList.mockReturnValue(query([]));
    testApi.portfolioOptimization.mockReturnValue(query(undefined));
    testApi.reportsSummary.mockReturnValue(query({ overview: { siteCount: 1, meterCount: 2, readingCount: 3, actionCount: 1, activeActionCount: 1 }, recentBatches: [] }));
    testApi.reportSnapshots.mockReturnValue(query([]));
    testApi.notificationInbox.mockReturnValue(query({ items: [], unreadCount: 0, disclosure: "Inbox items are derived from stored tenant evidence and user-specific read state. They are in-app records only and do not confirm email, SMS, push, or other external delivery." }));
    testApi.scenarioList.mockReturnValue(query([]));
    testApi.scenarioMethodology.mockReturnValue(query({ calculationVersion: "pilot-v1", factors: { electricityKgCo2PerKwh: 0.82 }, formulas: { projectedResource: "baseline resource × (1 − reduction percentage)" }, sensitivity: "Displayed multipliers define server-calculated deterministic ranges.", limitations: "Pilot factors are prototype defaults, not certified reporting." }));
    testApi.baselineList.mockReturnValue(query([]));
    testApi.outcomeList.mockReturnValue(query([]));
    testApi.actionCreateMode = "success"; testApi.scenarioPreviewMode = "success"; testApi.scenarioSaveMode = "success"; testApi.scenarioPreviewData = undefined; testApi.scenarioSensitivityData = undefined;
  });

  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows a purposeful tenant-boundary state before an organization exists", () => {
    testApi.organizationsMine.mockReturnValue(query([]));
    render(<OperationsOverview />);
    expect(screen.getByText("Start with a tenant boundary.")).toBeTruthy();
  });

  it("renders the operational overview from connected tenant-scoped sources", () => {
    render(<OperationsOverview />);
    expect(screen.getByRole("heading", { name: "AIEM Campus Pilot" })).toBeTruthy();
    expect(screen.getByText("VALIDATED READINGS")).toBeTruthy();
    expect(screen.getByText("ACTIVE ACTIONS")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Sustainability targets and freshness" })).toBeTruthy();
    expect(screen.getByText("Monthly energy ceiling")).toBeTruthy();
    expect(screen.getByText(/410\.0 \/ 500\.0 kWh/)).toBeTruthy();
  });

  it("renders tenant evidence notifications with a traceable workspace handoff and per-user read-state control", () => {
    testApi.notificationInbox.mockReturnValue(query({ items: [{ key: "alert:12", kind: "alert", priority: "high", title: "HVAC spike", detail: "HVAC Electricity: Persisted deviation needs review.", occurredAt: new Date("2026-08-25T10:00:00.000Z"), workspacePath: "/app/intelligence", readAt: null }], unreadCount: 1, disclosure: "Inbox items are derived from stored tenant evidence and user-specific read state. They are in-app records only and do not confirm email, SMS, push, or other external delivery." }));
    render(<NotificationsWorkspace />);
    expect(screen.getByRole("heading", { name: "Operational inbox" })).toBeTruthy();
    expect(screen.getByText("HVAC spike")).toBeTruthy();
    expect(screen.getByText(/do not confirm email, SMS, push/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Mark read/i }));
    expect(testApi.notificationSetRead).toHaveBeenCalledWith({ organizationId: 1, notificationKey: "alert:12", read: true });
  });

  it("guides the authenticated operating loop from actual stored tenant evidence without inventing completion", () => {
    render(<OperationsOverview />);
    const guide = screen.getByRole("region", { name: "Your operating loop" });
    expect(guide).toBeTruthy();
    expect(within(guide).getByText("NEXT USEFUL STEP")).toBeTruthy();
    expect(within(guide).getAllByText("Persist a monitored signal").length).toBeGreaterThan(1);
    expect(within(guide).getByText(/A check means the relevant record exists/i)).toBeTruthy();
    expect(within(guide).getByRole("button", { name: /Open Intelligence/i })).toBeTruthy();

    testApi.monitoringStatus.mockReturnValue(query({ latestRun: { id: 9, status: "completed" }, latestScore: null, openAlertCount: 0 }));
    testApi.scenarioList.mockReturnValue(query([{ id: 81, name: "HVAC controls", results: { carbonReductionKg: 24 } } ]));
    testApi.actionList.mockReturnValue(query([{ id: 71, title: "Review HVAC controls", status: "proposed", priority: "high" }]));
    testApi.reportSnapshots.mockReturnValue(query([{ id: 901, label: "August evidence snapshot" }]));
    cleanup();
    render(<OperationsOverview />);
    const completedGuide = screen.getByRole("region", { name: "Your operating loop" });
    expect(within(completedGuide).getByText("CORE LOOP RECORDS PRESENT")).toBeTruthy();
    expect(within(completedGuide).getByRole("button", { name: /Open Presenter Mode/i })).toBeTruthy();
  });

  it("renders the Meter Freshness Board with explicit current and no-accepted-evidence boundaries", () => {
    testApi.meterFreshness.mockReturnValue(query([
      { meter: { id: 44, displayName: "HVAC Electricity", resourceType: "energy", canonicalUnit: "kWh" }, latestAcceptedObservedAt: new Date("2026-08-25T10:00:00.000Z"), freshness: { state: "fresh", ageHours: 2, disclosure: "Latest accepted evidence is within the 24-hour operational freshness threshold." } },
      { meter: { id: 45, displayName: "Hostel Water", resourceType: "water", canonicalUnit: "m³" }, latestAcceptedObservedAt: null, freshness: { state: "no_accepted_evidence", ageHours: null, disclosure: "No accepted, non-superseded reading is available for this active meter." } },
    ]));
    render(<OperationsOverview />);
    expect(screen.getByRole("region", { name: "Meter freshness board" })).toBeTruthy();
    expect(screen.getByText("HVAC Electricity")).toBeTruthy();
    expect(screen.getByText("fresh")).toBeTruthy();
    expect(screen.getByText("no accepted evidence")).toBeTruthy();
    expect(screen.getByText(/No accepted, non-superseded reading/i)).toBeTruthy();
  });

  it("renders an explicit operating-calendar boundary and permits managers to deactivate its contextual baseline", () => {
    testApi.operatingCalendars.mockReturnValue(query([{ window: { id: 91, label: "Weekday hours", timezone: "Asia/Kolkata", weekdays: [1, 2, 3, 4, 5], startMinuteLocal: 540, endMinuteLocal: 1080, isActive: true }, meter: { id: 44, displayName: "HVAC Electricity", resourceType: "energy", canonicalUnit: "kWh" } }]));
    render(<OperationsOverview />);
    const panel = screen.getByRole("region", { name: "Operating calendars" });
    expect(within(panel).getByText("active contextual baseline")).toBeTruthy();
    expect(within(panel).getByText(/never suppresses alerts, carbon calculations/i)).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: "Deactivate calendar" }));
    expect(testApi.operatingCalendarSetActive).toHaveBeenCalledWith({ organizationId: 1, windowId: 91, isActive: false });
  });

  it("renders persisted EcoScore components without treating a pilot score as a certified rating", () => {
    testApi.ecoScoreExplanation.mockReturnValue(query({ snapshot: { id: 31, score: 78, calculationVersion: "ecoscore-v1", computedAt: new Date("2026-08-25T10:00:00.000Z") }, penalties: [{ id: "quality", label: "Data-quality penalty", value: 10, unit: "points", evidence: "Failed and warning quality findings at score calculation time." }], evidence: [{ id: "open-anomalies", label: "Open anomalies", value: 1 }], formula: "100 minus the persisted penalties.", disclosure: "EcoScore is a transparent pilot operational score and not a certified ESG rating." }));
    render(<OperationsOverview />);
    expect(screen.getByRole("region", { name: "EcoScore explanation" })).toBeTruthy();
    expect(screen.getByText(/78\/100/)).toBeTruthy();
    expect(screen.getByText("10 points")).toBeTruthy();
    expect(screen.getByText(/not a certified ESG rating/i)).toBeTruthy();
  });

  it("renders a selected executive report from stored evidence with modeled and simulated disclosures", () => {
    testApi.reportSnapshots.mockReturnValue(query([{ id: 52, title: "AIEM executive evidence", createdAt: new Date("2026-08-24T00:00:00.000Z"), criteria: { generatedAt: "2026-08-24T00:00:00.000Z", version: "evidence-snapshot-v2" }, factorDisclosure: "Pilot factor disclosure", evidence: { targetAssessments: [{ target: { label: "Energy target", targetType: "energy", targetValue: 500, unit: "kWh" }, achievedValue: 410, assessment: { state: "achieved", freshness: "fresh" } }], scenarios: [{ results: { sdgImpact: { contributions: [{ sdg: 13, title: "Climate Action", contributionIndex: 64 }] } } }], comparisons: [{ id: 1 }], recommendations: [{ id: 2 }], demoSimulation: { explicitlySimulated: true, disclosure: "Guided Campus Simulation evidence is deterministic test data." } } }]));
    render(<ReportsWorkspace />);
    fireEvent.click(screen.getByText("View executive evidence"));
    expect(screen.getByRole("region", { name: "Executive evidence report" })).toBeTruthy();
    expect(screen.getByText("Energy target")).toBeTruthy();
    expect(screen.getByText("Climate Action")).toBeTruthy();
    expect(screen.getByText(/not certified achievement/i)).toBeTruthy();
    expect(screen.getAllByText(/Guided Campus Simulation evidence is deterministic test data/)).toHaveLength(2);
    expect(screen.getByText("STORED TENANT EVIDENCE — NOT CERTIFIED")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export selected evidence CSV" }).hasAttribute("disabled")).toBe(false);
  });

  it("renders only persisted evidence links in the Intelligence traceability timeline", () => {
    testApi.intelligenceTimeline.mockReturnValue(query([{ id: "recommendation:61", stage: "recommendation", occurredAt: new Date("2026-08-24T12:00:00.000Z"), title: "Inspect HVAC controls", status: "accepted", meterName: "HVAC Electricity", anomalyId: 31, actionId: 72, detail: "Created from persisted anomaly evidence." }]));
    render(<IntelligenceWorkspace />);
    expect(screen.getByRole("region", { name: "Evidence traceability timeline" })).toBeTruthy();
    expect(screen.getByText("Inspect HVAC controls")).toBeTruthy();
    expect(screen.getByText(/anomaly #31 · action #72/)).toBeTruthy();
    expect(screen.getByText(/does not fabricate a complete causal chain/i)).toBeTruthy();
  });

  it("shows clearly labelled guided simulation controls only to tenant managers and owners", () => {
    const { unmount } = render(<OperationsOverview />);
    expect(screen.getByRole("region", { name: "Guided Campus Simulation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start guided demo" })).toBeTruthy();
    expect(screen.getByText(/never represents the records as live campus telemetry/i)).toBeTruthy();
    unmount();

    testApi.organizationsMine.mockReturnValue(query([{ organization: { id: 1, name: "AIEM Campus Pilot" }, membership: { role: "operator" } }]));
    render(<OperationsOverview />);
    expect(screen.queryByRole("button", { name: "Start guided demo" })).toBeNull();
    expect(screen.getByText("Only tenant owners and managers can create, advance, inject, or reset simulated tenant evidence.")).toBeTruthy();
  });

  it("provides a guided first-run checklist that separates simulated demo evidence from operational records", () => {
    render(<OperationsOverview />);
    expect(screen.getByRole("region", { name: "Guided demo first-run checklist" })).toBeTruthy();
    expect(screen.getByText(/manual or imported records remain operational evidence and are not reset/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open guided demo controls" })).toBeTruthy();
  });

  it("keeps protected overview, reading, and action failures explicit instead of fabricating empty dashboard state", () => {
    testApi.overview.mockReturnValue({ ...query(undefined), error: new Error("network") });
    testApi.recentReadings.mockReturnValue({ ...query(undefined), error: new Error("forbidden") });
    testApi.actionList.mockReturnValue({ ...query(undefined), error: new Error("forbidden") });
    render(<OperationsOverview />);

    expect(screen.getByText("Some protected operational evidence is unavailable. The overview preserves unknown values instead of inferring an empty tenant state.")).toBeTruthy();
    expect(screen.getByText("Reading evidence is unavailable. No empty-state conclusion is inferred.")).toBeTruthy();
    expect(screen.getByText("Action evidence is unavailable. No empty-state conclusion is inferred.")).toBeTruthy();
  });

  it("renders registry, intelligence, action, and report workspaces as distinct operational surfaces", () => {
    const { unmount } = render(<RegistryWorkspace />);
    expect(screen.getByRole("heading", { name: "Define what can be measured." })).toBeTruthy();
    unmount();
    render(<IntelligenceWorkspace />);
    expect(screen.getByText("Anomaly and forecast worker")).toBeTruthy();
    expect(screen.getByText("Create accountable work after an open-alert threshold")).toBeTruthy();
    cleanup();
    render(<ActionsWorkspace />);
    expect(screen.getByRole("heading", { name: "Turn a signal into accountable work." })).toBeTruthy();
    expect(screen.getByLabelText("Source scenario")).toBeTruthy();
    expect(screen.getByLabelText("Source comparison")).toBeTruthy();
    cleanup();
    render(<ReportsWorkspace />);
    expect(screen.getByRole("heading", { name: "Export only what the records support." })).toBeTruthy();
    cleanup();
    render(<ScenarioWorkspace />);
    expect(screen.getByRole("heading", { name: "Model an intervention before you fund it." })).toBeTruthy();
    expect(screen.getByText("Awaiting calculation")).toBeTruthy();
  });

  it("renders tenant equipment context without presenting optional meter linkage as live telemetry", () => {
    testApi.equipmentList.mockReturnValue(query([{ asset: { id: 88, assetKey: "hvac-ahu-01", displayName: "Main HVAC air-handling unit", assetType: "HVAC air-handling unit", lifecycleStatus: "active", locationDescription: "Plant room", notes: null }, site: { id: 13, name: "AIEM Main Campus", code: "AIEM-MAIN" }, meter: { id: 44, displayName: "HVAC Electricity", resourceType: "energy", canonicalUnit: "kWh" } }]));
    render(<RegistryWorkspace />);
    const registry = screen.getByRole("region", { name: "Campus equipment registry" });
    expect(within(registry).getByText("Main HVAC air-handling unit")).toBeTruthy();
    expect(within(registry).getByText(/does not prove device health, asset performance/i)).toBeTruthy();
    fireEvent.change(within(registry).getByRole("combobox", { name: "Lifecycle for Main HVAC air-handling unit" }), { target: { value: "maintenance" } });
    expect(testApi.equipmentLifecycle).toHaveBeenCalledWith({ organizationId: 1, assetId: 88, lifecycleStatus: "maintenance" });
  });

  it("keeps Reports and Scenarios controls explicitly labeled for keyboard and assistive-technology use", () => {
    const { unmount } = render(<ReportsWorkspace />);
    expect(screen.getByLabelText("Evidence snapshot title")).toBeTruthy();
    unmount();

    render(<ScenarioWorkspace />);
    expect(screen.getByLabelText("Scenario name")).toBeTruthy();
    expect(screen.getByLabelText("Scenario site")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Calculate on server" })).toBeTruthy();
  });

  it("shows protected health and readiness evidence while keeping scheduler activation disabled until deployed", () => {
    render(<AdministrationWorkspace />);

    expect(screen.getByRole("heading", { name: "Operate from verified service evidence." })).toBeTruthy();
    expect(screen.getByText("LIVENESS")).toBeTruthy();
    expect(screen.getByText("READINESS")).toBeTruthy();
    expect(screen.getByLabelText("Scheduler trial cadence")).toBeTruthy();
    expect(screen.getByLabelText("Scheduler stale-after threshold")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Activate trial" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Publish the application, then verify deployed/)).toBeTruthy();
  });

  it("shows owner-safe role indicators and prevents a final owner from being demoted in the interface", () => {
    render(<RegistryWorkspace />);

    expect(screen.getByRole("region", { name: "Tenant access administration" })).toBeTruthy();
    expect(screen.getByText("AIEM Owner")).toBeTruthy();
    expect(screen.getByText("Final owner protected")).toBeTruthy();
    expect(screen.getByText("Role locked for safety")).toBeTruthy();
    expect(screen.queryByLabelText("Role for AIEM Owner")).toBeNull();
    expect(screen.getAllByText("Owner").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Learn about owner safety" })).toBeTruthy();
    expect(screen.getByText(/Invitation delivery is not configured in this deployment\./)).toBeTruthy();
  });

  it("retains modeled SDG context when an accountable action is linked to a saved scenario", () => {
    testApi.scenarioList.mockReturnValue(query([{ id: 91, name: "HVAC controls", results: { sdgImpact: { calculationVersion: "pilot-sdg-impact-v1", disclosure: "Modeled only.", contributions: [{ sdg: 13, contributionIndex: 30 }, { sdg: 7, contributionIndex: 25 }, { sdg: 9, contributionIndex: 10 }, { sdg: 11, contributionIndex: 4 }, { sdg: 12, contributionIndex: 8 }] } } } ]));
    testApi.actionList.mockReturnValue(query([{ id: 71, title: "Inspect HVAC schedule", description: "Validate control sequence.", priority: "high", status: "proposed", scenarioId: 91, comparisonId: null, expectedCarbonReductionKg: null }]));
    render(<ActionsWorkspace />);
    expect(screen.getByText("Modeled scenario #91 linked")).toBeTruthy();
    expect(screen.getByText("Modeled SDG context: SDG 13, SDG 7, SDG 9, SDG 11, SDG 12")).toBeTruthy();
  });

  it("shows IoT device controls only to tenant owners and never displays a persisted device secret", () => {
    const { unmount } = render(<RegistryWorkspace />);
    expect(screen.getByRole("region", { name: "IoT gateway device management" })).toBeTruthy();
    expect(screen.getByLabelText("IoT device key")).toBeTruthy();
    expect(screen.getByText("AIEM HVAC gateway")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rotate secret" })).toBeTruthy();
    expect(screen.queryByText("one-time-device-secret")).toBeNull();
    unmount();

    testApi.organizationsMine.mockReturnValue(query([{ organization: { id: 1, name: "AIEM Campus Pilot" }, membership: { role: "operator" } }]));
    render(<RegistryWorkspace />);
    expect(screen.getByText("Only tenant owners can create, rotate, or change telemetry device controls.")).toBeTruthy();
    expect(screen.queryByLabelText("IoT device key")).toBeNull();
  });

  it("keeps the member list empty when its protected API denies visibility", () => {
    testApi.organizationMembers.mockReturnValue({ ...query(undefined), error: new Error("forbidden") });
    render(<RegistryWorkspace />);

    expect(screen.getByText("Member visibility requires a manager or owner role. No member records are inferred when authorization is denied.")).toBeTruthy();
    expect(screen.queryByText("AIEM Owner")).toBeNull();
  });

  it("discloses deterministic forecast-model comparison without claiming predictive accuracy", () => {
    render(<IntelligenceWorkspace />);
    expect(screen.getByText(/compares versioned moving-average and last-value candidates/i)).toBeTruthy();
    expect(screen.getByText(/does not claim predictive accuracy/i)).toBeTruthy();
  });

  it("makes protected query failures explicit rather than fabricating operational state", () => {
    testApi.intelligenceReadiness.mockReturnValue({ ...query(undefined), error: new Error("network") });
    render(<IntelligenceWorkspace />);
    expect(screen.getByText("Monitoring evidence could not be loaded.")).toBeTruthy();
    cleanup();
    testApi.actionList.mockReturnValue({ ...query(undefined), error: new Error("network") });
    render(<ActionsWorkspace />);
    expect(screen.getByText("Accountable work could not be loaded.")).toBeTruthy();
    cleanup();
    testApi.reportsSummary.mockReturnValue({ ...query(undefined), error: new Error("network") });
    render(<ReportsWorkspace />);
    expect(screen.getByText("Operational records could not be summarized.")).toBeTruthy();
    cleanup();
    testApi.scenarioList.mockReturnValue({ ...query(undefined), error: new Error("network") });
    render(<ScenarioWorkspace />);
    expect(screen.getByText("Scenario records could not be loaded.")).toBeTruthy();
    cleanup();
    testApi.scenarioList.mockReturnValue(query([]));
    testApi.comparisonList.mockReturnValue({ ...query(undefined), error: new Error("scope") });
    render(<ScenarioWorkspace />);
    expect(screen.getByText("Scenario records could not be loaded.")).toBeTruthy();
    cleanup();
    testApi.comparisonList.mockReturnValue(query([]));
    testApi.reportSnapshots.mockReturnValue({ ...query(undefined), error: new Error("scope") });
    render(<ReportsWorkspace />);
    expect(screen.getByText("Operational records could not be summarized.")).toBeTruthy();
  });

  it("renders pending, triggered, suppressed, and resolved escalation evidence without claiming external delivery", () => {
    const dueAt = new Date("2026-08-22T08:00:00.000Z");
    testApi.escalations.mockReturnValue(query([
      { escalation: { id: 1, status: "pending", dueAt, reason: "Awaiting threshold." }, alert: { title: "Pending HVAC signal" }, action: null },
      { escalation: { id: 2, status: "triggered", dueAt, reason: "Threshold reached." }, alert: { title: "Triggered HVAC signal" }, action: { id: 77, title: "Escalated monitoring alert" } },
      { escalation: { id: 3, status: "suppressed", dueAt, reason: "Below policy threshold." }, alert: { title: "Suppressed water signal" }, action: null },
      { escalation: { id: 4, status: "resolved", dueAt, reason: "Acknowledged before trigger." }, alert: { title: "Resolved waste signal" }, action: null },
    ]));
    render(<IntelligenceWorkspace />);
    expect(screen.getByText("PENDING · due 8/22/2026, 8:00:00 AM")).toBeTruthy();
    expect(screen.getByText("TRIGGERED · due 8/22/2026, 8:00:00 AM")).toBeTruthy();
    expect(screen.getByText(/Action #77: Escalated monitoring alert/)).toBeTruthy();
    expect(screen.getByText("SUPPRESSED · due 8/22/2026, 8:00:00 AM")).toBeTruthy();
    expect(screen.getByText("RESOLVED · due 8/22/2026, 8:00:00 AM")).toBeTruthy();
  });

  it("renders a persisted saved-scenario attribution on an action without presenting modeled impact as realized", () => {
    testApi.actionList.mockReturnValue(query([{ id: 71, title: "HVAC controls follow-up", description: "Review modeled controls option.", priority: "high", status: "proposed", scenarioId: 84, comparisonId: 12, expectedCarbonReductionKg: null }]));
    render(<ActionsWorkspace />);
    expect(screen.getByText("Modeled scenario #84 linked")).toBeTruthy();
    expect(screen.getByText("Comparison #12 linked")).toBeTruthy();
  });

  it("captures an action target date at the end of its UTC day and distinguishes overdue from completed deadlines", () => {
    testApi.actionList.mockReturnValue(query([
      { id: 71, title: "Review HVAC controls", description: null, priority: "high", status: "in_progress", scenarioId: null, comparisonId: null, expectedCarbonReductionKg: null, targetDate: new Date("2020-01-01T23:59:59.999Z") },
      { id: 72, title: "Completed meter review", description: null, priority: "medium", status: "completed", scenarioId: null, comparisonId: null, expectedCarbonReductionKg: null, targetDate: new Date("2020-01-01T23:59:59.999Z") },
    ]));
    render(<ActionsWorkspace />);
    expect(screen.getByText(/OVERDUE · 1\/1\/2020/)).toBeTruthy();
    expect(screen.getByText(/Completed · 1\/1\/2020/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Action title"), { target: { value: "Inspect chilled-water controls" } });
    fireEvent.change(screen.getByLabelText("Action target date"), { target: { value: "2026-09-30" } });
    fireEvent.click(screen.getByText("Create action"));
    expect(testApi.actionCreate).toHaveBeenCalledWith(expect.objectContaining({ targetDate: new Date("2026-09-30T23:59:59.999Z") }));
  });

  it("shows recommendation scenario, comparison, and confidence provenance before acceptance", () => {
    testApi.recommendationList.mockReturnValue(query([{ recommendation: { id: 19, priority: "high", status: "proposed", title: "Investigate HVAC variance", anomalyId: 12, confidence: "0.8", rationale: "Persisted evidence requires review.", evidence: { scenario: { id: 84, name: "HVAC controls option" }, comparison: { id: 12, name: "HVAC ranked options" }, confidenceBasis: { scoreMeaning: "80% is assigned by the persisted anomaly severity tier.", supportingEvidence: ["Persisted anomaly severity: high."], limitations: ["Confidence is a deterministic severity tier, not a probability of savings or equipment failure."] } } }, meter: { displayName: "HVAC Electricity" }, action: null }]));
    render(<IntelligenceWorkspace />);
    expect(screen.getByText("Modeled scenario #84: HVAC controls option")).toBeTruthy();
    expect(screen.getByText("Comparison #12: HVAC ranked options")).toBeTruthy();
    fireEvent.click(screen.getByText("Confidence evidence and limits"));
    expect(screen.getByText("80% is assigned by the persisted anomaly severity tier.")).toBeTruthy();
    expect(screen.getByText("Persisted anomaly severity: high.")).toBeTruthy();
  });

  it("shows a linked tenant action in saved scenario history", () => {
    testApi.scenarioList.mockReturnValue(query([{ id: 84, name: "HVAC controls option", results: { carbonReductionKg: 886 }, calculationVersion: "pilot-v1", updatedAt: new Date("2026-08-22T00:00:00.000Z") }]));
    testApi.actionList.mockReturnValue(query([{ id: 71, title: "Implement selected controls", status: "proposed", scenarioId: 84, priority: "high", description: null, expectedCarbonReductionKg: null }]));
    render(<ScenarioWorkspace />);
    expect(screen.getByText("Linked action #71: Implement selected controls · proposed")).toBeTruthy();
  });

  it("renders the saved-scenario portfolio selector with explicit modeled constraints and limitations", () => {
    testApi.scenarioList.mockReturnValue(query([
      { id: 84, name: "LED option", results: { carbonReductionKg: 80 }, calculationVersion: "pilot-v1", updatedAt: new Date("2026-08-22T00:00:00.000Z") },
      { id: 85, name: "HVAC option", results: { carbonReductionKg: 160 }, calculationVersion: "pilot-v1", updatedAt: new Date("2026-08-22T00:00:00.000Z") },
    ]));
    testApi.portfolioOptimization.mockReturnValue(query({ selected: [{ scenarioId: 84, name: "LED option", investmentInr: 20_000 }], excluded: [{ scenarioId: 85, name: "HVAC option", reason: "not_selected" }], totals: { investmentInr: 20_000, carbonReductionKg: 80, annualSavingsInr: 6_000 }, disclosure: "Bounded modeled portfolio only." }));
    render(<ScenarioWorkspace />);
    expect(screen.getByLabelText("Portfolio modeled budget")).toBeTruthy();
    expect(screen.getByLabelText("Portfolio maximum interventions")).toBeTruthy();
    expect(screen.getByLabelText("Portfolio objective")).toBeTruthy();
    expect(screen.getByText(/does not resolve dependencies, overlapping baselines/i)).toBeTruthy();
    expect(screen.getByText("Selected: LED option · ₹20,000 modeled investment")).toBeTruthy();
    expect(screen.getByText(/Excluded: HVAC option · not selected by stated objective/i)).toBeTruthy();
  });

  it("applies a disclosed intervention template without overwriting entered baseline values", () => {
    render(<ScenarioWorkspace />);
    expect(screen.getByText(/Site selection is saved as scenario metadata/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Baseline energy"), { target: { value: "9100" } });
    fireEvent.click(screen.getByText("Rooftop solar"));
    expect((screen.getByLabelText("Baseline energy") as HTMLInputElement).value).toBe("9100");
    expect((screen.getByLabelText("Renewable share") as HTMLInputElement).value).toBe("35");
    expect(screen.getByText(/Pilot modeled defaults only; validate roof survey/)).toBeTruthy();
  });

  it("opens the Scenario Methodology Drawer with server-owned factors, formulas, sensitivity mechanics, and limitations", () => {
    render(<ScenarioWorkspace />);
    fireEvent.click(screen.getByText("Open formula and pilot-factor methodology"));
    expect(screen.getByText("electricityKgCo2PerKwh")).toBeTruthy();
    expect(screen.getByText("baseline resource × (1 − reduction percentage)")).toBeTruthy();
    expect(screen.getByText(/server-calculated deterministic ranges/i)).toBeTruthy();
    expect(screen.getByText(/not certified reporting/i)).toBeTruthy();
  });

  it("applies persisted accepted-reading evidence to only its matching baseline and preserves the reference for preview and save", () => {
    testApi.baselineList.mockReturnValue(query([{ baseline: { id: 401, meterId: 44, label: "August HVAC evidence", resourceType: "energy", unit: "kWh", aggregateValue: "125.0000", readingCount: 4, latestObservedAt: new Date("2026-08-28T11:00:00.000Z"), windowStart: new Date("2026-08-01T00:00:00.000Z"), windowEnd: new Date("2026-08-31T23:59:59.999Z"), includesSimulatedEvidence: true }, meter: { id: 44, displayName: "HVAC Electricity", resourceType: "energy", canonicalUnit: "kWh" } }]));
    testApi.scenarioPreviewData = { results: { baselineCarbonKg: 100, projectedCarbonKg: 80, carbonReductionKg: 20, projectedEnergyKwh: 100, projectedWaterM3: 10, projectedWasteKg: 10, annualSavingsInr: 5000, paybackYears: 2, roiPct: 25 } };
    render(<ScenarioWorkspace />);
    expect(screen.getByText(/Includes explicitly simulated guided-demo evidence/)).toBeTruthy();
    fireEvent.click(screen.getByText("Apply to model"));
    expect((screen.getByLabelText("Baseline energy") as HTMLInputElement).value).toBe("125");
    expect((screen.getByLabelText("Baseline water") as HTMLInputElement).value).toBe("480");
    fireEvent.click(screen.getByText("Calculate on server"));
    expect(testApi.scenarioPreview).toHaveBeenCalledWith(expect.objectContaining({ assumptions: expect.objectContaining({ baselineEnergyKwh: 125, baselineReference: expect.objectContaining({ baselineId: 401, resourceType: "energy", includesSimulatedEvidence: true }) }) }));
    fireEvent.click(screen.getByText("Save scenario"));
    expect(testApi.scenarioSave).toHaveBeenCalledWith(expect.objectContaining({ assumptions: expect.objectContaining({ baselineReference: expect.objectContaining({ baselineId: 401 }) }) }));
  });

  it("locks a completed action to its saved scenario baseline and displays non-realization-safe outcome evidence", () => {
    testApi.scenarioList.mockReturnValue(query([{ id: 84, name: "HVAC controls option", assumptions: { baselineReference: { baselineId: 401 } }, results: { projectedEnergyKwh: 80 } }]));
    testApi.actionList.mockReturnValue(query([{ id: 71, title: "Implement HVAC controls", description: null, priority: "high", status: "completed", scenarioId: 84, comparisonId: null, expectedCarbonReductionKg: null }]));
    testApi.baselineList.mockReturnValue(query([{ baseline: { id: 401, label: "August HVAC evidence", readingCount: 4 }, meter: { id: 44, displayName: "HVAC Electricity" } }]));
    testApi.outcomeList.mockReturnValue(query([{ measurement: { id: 501, status: "simulated_evidence", outcomeReadingCount: 4, outcomeWindowStart: new Date("2026-09-01T00:00:00.000Z"), outcomeWindowEnd: new Date("2026-09-30T23:59:59.999Z"), unit: "kWh", results: { observedReductionValue: 16, varianceFromModeledValue: -4, disclosure: "This comparison includes explicitly simulated evidence and must not be described as a realized operational outcome." } }, action: { id: 71, title: "Implement HVAC controls", status: "completed" }, meter: { id: 44, displayName: "HVAC Electricity" } }]));
    render(<ActionsWorkspace />);

    expect(screen.getByText(/must be the same duration/i)).toBeTruthy();
    expect(screen.getByText("SIMULATED EVIDENCE")).toBeTruthy();
    expect(screen.getByText(/must not be described as a realized operational outcome/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Outcome action"), { target: { value: "71" } });
    fireEvent.change(screen.getByLabelText("Outcome baseline"), { target: { value: "401" } });
    fireEvent.change(screen.getByLabelText("Outcome window start"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Outcome window end"), { target: { value: "2026-09-30" } });
    fireEvent.click(screen.getByText("Record outcome comparison"));
    expect(testApi.outcomeCreate).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 1, actionId: 71, baselineId: 401, outcomeWindowStart: new Date("2026-09-01T00:00:00.000Z"), outcomeWindowEnd: new Date("2026-09-30T23:59:59.999Z") }));
  });

  it("renders tenant-governed assignment and approval evidence without implying automatic routing or funding", () => {
    testApi.actionList.mockReturnValue(query([{ id: 72, title: "Review solar proposal", description: "Confirm modeled assumptions.", priority: "medium", status: "proposed", scenarioId: null, comparisonId: null, expectedCarbonReductionKg: null, ownerUserId: 17, approvedAt: null, targetDate: null }]));
    render(<ActionsWorkspace />);

    expect(screen.getByLabelText("Assign owner for Review solar proposal")).toBeTruthy();
    expect(screen.getByText("Approval evidence: not recorded")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record approval" })).toBeTruthy();
  });

  it("covers loading and mutation feedback without concealing server outcomes", async () => {
    testApi.organizationsMine.mockReturnValue({ ...query(tenant), isLoading: true });
    render(<IntelligenceWorkspace />);
    expect(screen.getByText("Loading monitoring evidence…")).toBeTruthy();
    cleanup();
    render(<ReportsWorkspace />);
    expect(screen.getByText("Loading report boundary…")).toBeTruthy();
    cleanup();
    testApi.organizationsMine.mockReturnValue(query(tenant));
    testApi.actionList.mockReturnValue({ ...query([]), isLoading: true });
    render(<ActionsWorkspace />);
    expect(screen.getByText("Loading accountable work…")).toBeTruthy();
    cleanup();
    testApi.actionList.mockReturnValue(query([]));
    testApi.scenarioList.mockReturnValue({ ...query([]), isLoading: true });
    render(<ScenarioWorkspace />);
    expect(screen.getByText("Loading saved calculations…")).toBeTruthy();
    cleanup();
    testApi.scenarioList.mockReturnValue(query([]));
    render(<ActionsWorkspace />);
    fireEvent.change(screen.getByLabelText("Action title"), { target: { value: "Inspect HVAC" } });
    fireEvent.click(screen.getByText("Create action"));
    await waitFor(() => expect(screen.getByText("Action recorded with an audit event.")).toBeTruthy());
    cleanup();
    testApi.actionCreateMode = "error";
    render(<ActionsWorkspace />);
    fireEvent.change(screen.getByLabelText("Action title"), { target: { value: "Inspect HVAC" } });
    fireEvent.click(screen.getByText("Create action"));
    await waitFor(() => expect(screen.getByText("Action was not saved. Review the required fields and retry.")).toBeTruthy());
    cleanup();
    testApi.scenarioPreviewData = { results: { baselineCarbonKg: 100, projectedCarbonKg: 80, carbonReductionKg: 20, projectedEnergyKwh: 100, projectedWaterM3: 10, projectedWasteKg: 10, annualSavingsInr: 5000, paybackYears: 2, roiPct: 25 } };
    render(<ScenarioWorkspace />);
    fireEvent.click(screen.getByText("Save scenario"));
    await waitFor(() => expect(screen.getByText("Scenario saved with its server calculation and assumptions.")).toBeTruthy());
    cleanup();
    testApi.scenarioPreviewData = undefined; testApi.scenarioPreviewMode = "error";
    render(<ScenarioWorkspace />);
    fireEvent.click(screen.getByText("Calculate on server"));
    await waitFor(() => expect(screen.getByText("Scenario could not be calculated. Review the values and retry.")).toBeTruthy());
  });
});
