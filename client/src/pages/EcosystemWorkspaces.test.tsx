// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testApi = vi.hoisted(() => ({
  organizationsMine: vi.fn(), overview: vi.fn(), recentReadings: vi.fn(), actionList: vi.fn(), actionCollaboration: vi.fn(), siteList: vi.fn(), meterList: vi.fn(),
  intelligenceReadiness: vi.fn(), monitoringOverview: vi.fn(), monitoringStatus: vi.fn(), monitoringHealth: vi.fn(), alertRouting: vi.fn(), deliveryAttempts: vi.fn(), escalationPolicy: vi.fn(), escalations: vi.fn(), forecastList: vi.fn(), recommendationList: vi.fn(), comparisonList: vi.fn(), reportsSummary: vi.fn(), reportSnapshots: vi.fn(), scenarioList: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined),
  actionCreateMode: "success" as "success" | "error", scenarioPreviewMode: "success" as "success" | "error", scenarioSaveMode: "success" as "success" | "error",
  scenarioPreviewData: undefined as unknown,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      organizations: { mine: { invalidate: testApi.invalidate } }, sites: { list: { invalidate: testApi.invalidate } }, meters: { list: { invalidate: testApi.invalidate } },
      actions: { list: { invalidate: testApi.invalidate }, collaboration: { invalidate: testApi.invalidate } }, scenarios: { list: { invalidate: testApi.invalidate } }, comparisons: { list: { invalidate: testApi.invalidate } }, forecasts: { list: { invalidate: testApi.invalidate } }, recommendations: { list: { invalidate: testApi.invalidate } }, reports: { snapshots: { invalidate: testApi.invalidate } }, analytics: { overview: { invalidate: testApi.invalidate } }, monitoring: { status: { invalidate: testApi.invalidate }, health: { invalidate: testApi.invalidate } }, alertRouting: { get: { invalidate: testApi.invalidate }, deliveries: { invalidate: testApi.invalidate } }, alertEscalation: { get: { invalidate: testApi.invalidate }, list: { invalidate: testApi.invalidate } }, intelligence: { readiness: { invalidate: testApi.invalidate } },
    }),
    organizations: { mine: { useQuery: () => testApi.organizationsMine() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    operations: { overview: { useQuery: () => testApi.overview() } },
    readings: { recent: { useQuery: () => testApi.recentReadings() } },
    sites: { list: { useQuery: () => testApi.siteList() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    meters: { list: { useQuery: () => testApi.meterList() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    intelligence: { readiness: { useQuery: () => testApi.intelligenceReadiness() } },
    monitoring: { status: { useQuery: () => testApi.monitoringStatus() }, health: { useQuery: () => testApi.monitoringHealth() }, runOnce: { useMutation: () => ({ isPending: false, mutate: vi.fn(), data: undefined, error: null }) }, configureTarget: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, retryRecovery: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    alertRouting: { get: { useQuery: () => testApi.alertRouting() }, deliveries: { useQuery: () => testApi.deliveryAttempts() }, update: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    alertEscalation: { get: { useQuery: () => testApi.escalationPolicy() }, list: { useQuery: () => testApi.escalations() }, update: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, evaluateNow: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    forecasts: { list: { useQuery: () => testApi.forecastList() }, generate: { useMutation: () => ({ isPending: false, mutate: vi.fn(), data: undefined, error: null }) } },
    recommendations: { list: { useQuery: () => testApi.recommendationList() }, generateForOpenAnomalies: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) }, updateStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    analytics: { overview: { useQuery: () => testApi.monitoringOverview() } },
    alerts: { acknowledge: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    actions: { list: { useQuery: () => testApi.actionList() }, collaboration: { useQuery: () => testApi.actionCollaboration() }, create: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ isPending: false, mutate: () => testApi.actionCreateMode === "error" ? options?.onError?.() : options?.onSuccess?.() }) }, updateStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, addComment: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, addEvidence: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    reports: { summary: { useQuery: () => testApi.reportsSummary() }, snapshots: { useQuery: () => testApi.reportSnapshots() }, createSnapshot: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
    scenarios: { list: { useQuery: () => testApi.scenarioList() }, preview: { useMutation: (options?: { onError?: () => void }) => ({ isPending: false, mutate: () => testApi.scenarioPreviewMode === "error" && options?.onError?.(), data: testApi.scenarioPreviewData }) }, save: { useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => ({ isPending: false, mutate: () => testApi.scenarioSaveMode === "error" ? options?.onError?.() : options?.onSuccess?.() }) } },
    comparisons: { list: { useQuery: () => testApi.comparisonList() }, create: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }) } },
  },
}));

import OperationsOverview from "./OperationsOverview";
import RegistryWorkspace from "./RegistryWorkspace";
import IntelligenceWorkspace from "./IntelligenceWorkspace";
import ActionsWorkspace from "./ActionsWorkspace";
import ReportsWorkspace from "./ReportsWorkspace";
import ScenarioWorkspace from "./ScenarioWorkspace";

const query = (data: unknown) => ({ data, isLoading: false, isFetching: false, error: null });
const tenant = [{ organization: { id: 1, name: "AIEM Campus Pilot" }, membership: { role: "owner" } }];

describe("authenticated ecosystem workspaces", () => {
  beforeEach(() => {
    testApi.organizationsMine.mockReturnValue(query(tenant));
    testApi.overview.mockReturnValue(query({ siteCount: 1, meterCount: 2, readingCount: 3, actionCount: 1, activeActionCount: 1, latestReadingAt: new Date() }));
    testApi.recentReadings.mockReturnValue(query([]));
    testApi.actionList.mockReturnValue(query([]));
    testApi.actionCollaboration.mockReturnValue(query({ action: { id: 1, title: "Inspect HVAC" }, comments: [], evidence: [] }));
    testApi.siteList.mockReturnValue(query([]));
    testApi.meterList.mockReturnValue(query([]));
    testApi.intelligenceReadiness.mockReturnValue(query({ overview: { meterCount: 2, readingCount: 3 }, pipeline: [{ id: "registry", label: "Meter registry", state: "ready", evidence: "2 registered meters" }, { id: "analytics", label: "Anomaly and forecast worker", state: "planned", evidence: "Requires durable scheduling." }] }));
    testApi.monitoringStatus.mockReturnValue(query({ latestRun: null, latestScore: null, openAlertCount: 0 }));
    testApi.monitoringOverview.mockReturnValue(query({ status: { latestRun: null, latestScore: null, openAlertCount: 0 }, alerts: [], anomalies: [], qualityFindings: [], qualityWarnings: 0, qualityFailures: 0, carbonTotals: { totalKgCo2e: 0, calculationCount: 0, factorLabel: "pilot" } }));
    testApi.monitoringHealth.mockReturnValue(query({ state: "not_enabled", target: null, latestScheduledRun: null, openRecoveries: [], ageMinutes: null }));
    testApi.alertRouting.mockReturnValue(query(null));
    testApi.deliveryAttempts.mockReturnValue(query([]));
    testApi.escalationPolicy.mockReturnValue(query(null));
    testApi.escalations.mockReturnValue(query([]));
    testApi.forecastList.mockReturnValue(query([]));
    testApi.recommendationList.mockReturnValue(query([]));
    testApi.comparisonList.mockReturnValue(query([]));
    testApi.reportsSummary.mockReturnValue(query({ overview: { siteCount: 1, meterCount: 2, readingCount: 3, actionCount: 1, activeActionCount: 1 }, recentBatches: [] }));
    testApi.reportSnapshots.mockReturnValue(query([]));
    testApi.scenarioList.mockReturnValue(query([]));
    testApi.actionCreateMode = "success"; testApi.scenarioPreviewMode = "success"; testApi.scenarioSaveMode = "success"; testApi.scenarioPreviewData = undefined;
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
    cleanup();
    render(<ReportsWorkspace />);
    expect(screen.getByRole("heading", { name: "Export only what the records support." })).toBeTruthy();
    cleanup();
    render(<ScenarioWorkspace />);
    expect(screen.getByRole("heading", { name: "Model an intervention before you fund it." })).toBeTruthy();
    expect(screen.getByText("Awaiting calculation")).toBeTruthy();
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
