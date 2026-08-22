// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryMocks = {
  organizationsMine: vi.fn(),
  sitesList: vi.fn(),
  metersList: vi.fn(),
  batchesRecent: vi.fn(),
};
const mutationMocks = {
  createOrganization: vi.fn(),
  createSite: vi.fn(),
  createMeter: vi.fn(),
  ingestReading: vi.fn(),
};
const invalidate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ organizations: { mine: { invalidate } }, sites: { list: { invalidate } }, meters: { list: { invalidate } }, ingestion: { recent: { invalidate } } }),
    organizations: { mine: { useQuery: () => queryMocks.organizationsMine() }, create: { useMutation: (options: unknown) => mutationMocks.createOrganization(options) } },
    sites: { list: { useQuery: () => queryMocks.sitesList() }, create: { useMutation: (options: unknown) => mutationMocks.createSite(options) } },
    meters: { list: { useQuery: () => queryMocks.metersList() }, create: { useMutation: (options: unknown) => mutationMocks.createMeter(options) } },
    readings: { ingest: { useMutation: (options: unknown) => mutationMocks.ingestReading(options) } },
    ingestion: { recent: { useQuery: () => queryMocks.batchesRecent() } },
  },
}));

import IngestionWorkbench from "./IngestionWorkbench";

function mutation(onSuccessPayload?: unknown) {
  return (options: { onSuccess?: (payload: any) => void }) => ({
    isPending: false,
    mutate: () => { if (onSuccessPayload !== undefined) options.onSuccess?.(onSuccessPayload); },
  });
}

describe("IngestionWorkbench", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    queryMocks.organizationsMine.mockReturnValue({ data: [], isLoading: false, error: null });
    queryMocks.sitesList.mockReturnValue({ data: [], isLoading: false, error: null });
    queryMocks.metersList.mockReturnValue({ data: [], isLoading: false, error: null });
    queryMocks.batchesRecent.mockReturnValue({ data: [], isLoading: false, error: null });
    mutationMocks.createOrganization.mockImplementation(mutation({ id: 8 }));
    mutationMocks.createSite.mockImplementation(mutation({ id: 13 }));
    mutationMocks.createMeter.mockImplementation(mutation({ id: 44 }));
    mutationMocks.ingestReading.mockImplementation(mutation({ reading: { id: 99 }, idempotent: false }));
  });

  it("renders the registry-to-reading workflow with ingestion safely disabled before a meter exists", () => {
    render(<IngestionWorkbench />);
    expect(screen.getByRole("heading", { name: "Organization" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Reading" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ingest reading" }).hasAttribute("disabled")).toBe(true);
  });

  it("announces successful organization setup feedback after the protected creation mutation resolves", async () => {
    render(<IngestionWorkbench />);
    fireEvent.click(screen.getByRole("button", { name: "Create organization" }));
    expect(await screen.findByText("Organization created. Add its first operational site.")).toBeTruthy();
  });

  it("enables the registry progression and announces site and meter registration feedback", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    queryMocks.sitesList.mockReturnValue({ data: [{ id: 13, name: "AIEM Main Campus" }], isLoading: false, error: null });
    render(<IngestionWorkbench />);

    const registerSite = await screen.findByRole("button", { name: "Register site" });
    expect(registerSite.hasAttribute("disabled")).toBe(false);
    fireEvent.click(registerSite);
    expect(await screen.findByText("Site registered. Add a canonical meter before ingesting data.")).toBeTruthy();

    const registerMeter = screen.getByRole("button", { name: "Register meter" });
    expect(registerMeter.hasAttribute("disabled")).toBe(false);
    fireEvent.click(registerMeter);
    expect(await screen.findByText("Meter registered. The live reading endpoint is ready.")).toBeTruthy();
  });

  it("announces accepted and idempotent reading outcomes for a registered meter", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    queryMocks.sitesList.mockReturnValue({ data: [{ id: 13, name: "AIEM Main Campus" }], isLoading: false, error: null });
    queryMocks.metersList.mockReturnValue({ data: [{ id: 44, displayName: "HVAC Electricity", canonicalUnit: "kWh" }], isLoading: false, error: null });
    mutationMocks.ingestReading.mockImplementation(mutation({ reading: { id: 99 }, idempotent: false }));
    render(<IngestionWorkbench />);

    const ingestButton = await screen.findByRole("button", { name: "Ingest reading" });
    expect(ingestButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(ingestButton);
    expect(await screen.findByText("Reading accepted and recorded with provenance.")).toBeTruthy();
  });

  it("communicates that duplicate readings are not written again", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    queryMocks.sitesList.mockReturnValue({ data: [{ id: 13, name: "AIEM Main Campus" }], isLoading: false, error: null });
    queryMocks.metersList.mockReturnValue({ data: [{ id: 44, displayName: "HVAC Electricity", canonicalUnit: "kWh" }], isLoading: false, error: null });
    mutationMocks.ingestReading.mockImplementation(mutation({ reading: { id: 99 }, idempotent: true }));
    render(<IngestionWorkbench />);

    fireEvent.click(await screen.findByRole("button", { name: "Ingest reading" }));
    expect(await screen.findByText("This reading was already accepted; duplicate data was not created.")).toBeTruthy();
  });
});
