// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useStatus = vi.fn();
const useOrganizations = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    implementation: { status: { useQuery: () => useStatus() } },
    organizations: { mine: { useQuery: () => useOrganizations() } },
  },
}));

import ImplementationDashboard from "./ImplementationDashboard";

const inventory = [
  { id: "registry", title: "Validated meter reading ingestion", status: "complete" as const, area: "Data", evidence: "Validated with an idempotency key." },
  { id: "scenario", title: "Server-authoritative scenario engine", status: "in_progress" as const, area: "Product", evidence: "Awaiting persisted scenario service." },
  { id: "worker", title: "Monitoring worker", status: "planned" as const, area: "Reliability", evidence: "Requires durable scheduling." },
];

function readyStatus(overrides: Record<string, unknown> = {}) {
  return {
    data: { updatedAt: new Date(), summary: { total: 3, complete: 1, inProgress: 1, planned: 1, organizationCount: 1 }, items: inventory },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe("ImplementationDashboard", () => {
  afterEach(cleanup);

  beforeEach(() => {
    useStatus.mockReturnValue(readyStatus());
    useOrganizations.mockReturnValue({ data: [{ organization: { id: 1 } }], isLoading: false, error: null });
  });

  it("renders a loading state while readiness evidence is requested", () => {
    useStatus.mockReturnValue(readyStatus({ isLoading: true, data: undefined }));
    render(<ImplementationDashboard />);
    expect(screen.getByText("Loading production readiness…")).toBeTruthy();
  });

  it("filters the readiness inventory and updates the selected evidence detail", async () => {
    render(<ImplementationDashboard />);
    expect(screen.getAllByText("Validated meter reading ingestion").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Planned" }));
    expect(screen.getAllByText("Monitoring worker").length).toBeGreaterThan(0);
    expect(screen.queryByText("Validated meter reading ingestion")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Monitoring worker/ }));
    expect(await screen.findByText("Requires durable scheduling.")).toBeTruthy();
  });

  it("shows an error state when protected readiness data cannot be loaded", () => {
    useStatus.mockReturnValue(readyStatus({ error: new Error("network"), data: undefined }));
    render(<ImplementationDashboard />);
    expect(screen.getByText("Readiness data is unavailable.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
