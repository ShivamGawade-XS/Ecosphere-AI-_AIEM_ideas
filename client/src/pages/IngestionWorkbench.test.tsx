// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryMocks = {
  organizationsMine: vi.fn(),
  sitesList: vi.fn(),
  metersList: vi.fn(),
  batchesRecent: vi.fn(),
  importsList: vi.fn(),
  factorsList: vi.fn(),
  readingsRecent: vi.fn(),
  importLineage: vi.fn(),
  readingLineage: vi.fn(),
};
const mutationMocks = {
  createOrganization: vi.fn(),
  createSite: vi.fn(),
  createMeter: vi.fn(),
  ingestReading: vi.fn(),
  previewCsv: vi.fn(),
  commitCsv: vi.fn(),
  createFactor: vi.fn(),
  approveFactor: vi.fn(),
  correctReading: vi.fn(),
};
const invalidate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ organizations: { mine: { invalidate } }, sites: { list: { invalidate } }, meters: { list: { invalidate } }, ingestion: { recent: { invalidate } }, readings: { recent: { invalidate } }, imports: { list: { invalidate } }, factors: { list: { invalidate } } }),
    organizations: { mine: { useQuery: () => queryMocks.organizationsMine() }, create: { useMutation: (options: unknown) => mutationMocks.createOrganization(options) } },
    sites: { list: { useQuery: () => queryMocks.sitesList() }, create: { useMutation: (options: unknown) => mutationMocks.createSite(options) } },
    meters: { list: { useQuery: () => queryMocks.metersList() }, create: { useMutation: (options: unknown) => mutationMocks.createMeter(options) } },
    readings: { ingest: { useMutation: (options: unknown) => mutationMocks.ingestReading(options) }, recent: { useQuery: () => queryMocks.readingsRecent() }, correct: { useMutation: (options: unknown) => mutationMocks.correctReading(options) } },
    ingestion: { recent: { useQuery: () => queryMocks.batchesRecent() } },
    imports: { list: { useQuery: () => queryMocks.importsList() }, preview: { useMutation: (options: unknown) => mutationMocks.previewCsv(options) }, commit: { useMutation: (options: unknown) => mutationMocks.commitCsv(options) } },
    factors: { list: { useQuery: () => queryMocks.factorsList() }, create: { useMutation: (options: unknown) => mutationMocks.createFactor(options) }, approve: { useMutation: (options: unknown) => mutationMocks.approveFactor(options) } },
    lineage: { importFile: { useQuery: () => queryMocks.importLineage() }, reading: { useQuery: () => queryMocks.readingLineage() } },
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
    queryMocks.importsList.mockReturnValue({ data: [], isLoading: false, error: null });
    queryMocks.factorsList.mockReturnValue({ data: [], isLoading: false, error: null });
    queryMocks.readingsRecent.mockReturnValue({ data: [], isLoading: false, error: null });
    queryMocks.importLineage.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    queryMocks.readingLineage.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    mutationMocks.createOrganization.mockImplementation(mutation({ id: 8 }));
    mutationMocks.createSite.mockImplementation(mutation({ id: 13 }));
    mutationMocks.createMeter.mockImplementation(mutation({ id: 44 }));
    mutationMocks.ingestReading.mockImplementation(mutation({ reading: { id: 99 }, idempotent: false }));
    mutationMocks.previewCsv.mockImplementation(mutation({ importFile: { id: 21, fileName: "readings.csv", validRows: 2, rejectedRows: 1 }, idempotent: false, previewRows: [] }));
    mutationMocks.commitCsv.mockImplementation(mutation({ importFileId: 21, ingestionBatchId: 3, acceptedRows: 2, rejectedRows: 1, idempotent: false }));
    mutationMocks.createFactor.mockImplementation(mutation({ id: 31 }));
    mutationMocks.approveFactor.mockImplementation(mutation({ id: 31, status: "approved" }));
    mutationMocks.correctReading.mockImplementation(mutation({ correctionId: 41, correctedReadingId: 101 }));
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

  it("keeps generic ingestion manual and reserves controlled simulated evidence for the guided demo", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    queryMocks.sitesList.mockReturnValue({ data: [{ id: 13, name: "AIEM Main Campus" }], isLoading: false, error: null });
    queryMocks.metersList.mockReturnValue({ data: [{ id: 44, displayName: "HVAC Electricity", canonicalUnit: "kWh" }], isLoading: false, error: null });
    let submitted: Record<string, unknown> | undefined;
    mutationMocks.ingestReading.mockImplementation((options: { onSuccess?: (payload: unknown) => void }) => ({ isPending: false, mutate: (input: Record<string, unknown>) => { submitted = input; options.onSuccess?.({ reading: { id: 100 }, idempotent: false }); } }));
    render(<IngestionWorkbench />);

    fireEvent.click(screen.getByRole("button", { name: "Ingest reading" }));

    expect(screen.queryByLabelText("Reading source")).toBeNull();
    expect(submitted).toMatchObject({ source: "manual", provenance: { entryMethod: "operations-workbench", label: "Manual operational entry" } });
    expect(await screen.findByText(/Controlled simulated evidence is available only through the Guided Campus Simulation/)).toBeTruthy();
  });

  it("renders the protected CSV evidence workflow with an explicit quarantine boundary", () => {
    render(<IngestionWorkbench />);
    expect(screen.getByRole("heading", { name: "Preview, quarantine, then commit" })).toBeTruthy();
    expect(screen.getByText(/Rejected rows remain quarantined and never enter monitoring/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Preview CSV evidence" }).hasAttribute("disabled")).toBe(true);
  });

  it("surfaces governed-factor mutation errors as recoverable operational feedback", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    mutationMocks.createFactor.mockImplementation((options: { onError?: (error: Error) => void }) => ({ isPending: false, mutate: () => options.onError?.(new Error("A manager must use a distinct approved source version.")) }));
    render(<IngestionWorkbench />);

    fireEvent.click(await screen.findByRole("button", { name: "Save factor draft" }));
    expect(await screen.findByText("A manager must use a distinct approved source version.")).toBeTruthy();
  });

  it("renders the governed factor selected by the worker with its version, unit, and approval evidence", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    queryMocks.factorsList.mockReturnValue({ data: [{ id: 31, factorVersion: "goa-grid-2026", emittedKgCo2ePerUnit: "0.700000", inputUnit: "kWh", status: "approved", approvedAt: new Date("2026-08-21T00:00:00.000Z") }], isLoading: false, error: null });
    render(<IngestionWorkbench />);

    expect(await screen.findByText("goa-grid-2026")).toBeTruthy();
    expect(screen.getByText("0.700000 kgCO₂e/kWh")).toBeTruthy();
    expect(screen.getAllByText(/approved/).length).toBeGreaterThan(0);
  });

  it("renders tenant-scoped correction lineage without hiding the original source reading", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    queryMocks.readingsRecent.mockReturnValue({ data: [{ reading: { id: 99, value: "100", unit: "kWh" }, meter: { displayName: "HVAC Electricity" } }], isLoading: false, error: null });
    queryMocks.readingLineage.mockReturnValue({ data: { reading: { id: 99, source: "csv", supersededAt: new Date("2026-08-22T00:00:00.000Z") }, corrections: [{ id: 41, correctedReadingId: 101, status: "applied", reason: "Corrected verified transcription", approvedAt: new Date("2026-08-22T00:01:00.000Z") }], appliedCorrection: { id: 41, status: "applied", reason: "Corrected verified transcription" } }, isLoading: false, isError: false, error: null });
    render(<IngestionWorkbench />);

    expect(await screen.findByText("source reading")).toBeTruthy();
    expect(screen.getByText("correction #41")).toBeTruthy();
    expect(screen.getAllByText(/Corrected verified transcription/).length).toBeGreaterThan(0);
  });

  it("shows protected factor and lineage failures instead of inferring tenant governance evidence", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    queryMocks.factorsList.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("forbidden") });
    queryMocks.readingsRecent.mockReturnValue({ data: [{ reading: { id: 99, value: "100", unit: "kWh" }, meter: { displayName: "HVAC Electricity" } }], isLoading: false, error: null });
    queryMocks.readingLineage.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("forbidden") });
    render(<IngestionWorkbench />);

    expect(await screen.findByText("Factor evidence is unavailable: forbidden")).toBeTruthy();
    expect(screen.getByText("Correction lineage is unavailable: forbidden")).toBeTruthy();
  });

  it("surfaces CSV preview failures without silently accepting a source file", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    mutationMocks.previewCsv.mockImplementation((options: { onError?: (error: Error) => void }) => ({ isPending: false, mutate: () => options.onError?.(new Error("CSV headers do not match the required source contract.")) }));
    render(<IngestionWorkbench />);
    const file = { name: "invalid.csv", text: async () => "value\n100" } as unknown as File;
    const fileInput = screen.getByLabelText("CSV source file");
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.submit(fileInput.closest("form")!);
    expect(await screen.findByText("CSV preview failed: CSV headers do not match the required source contract.")).toBeTruthy();
  });

  it("surfaces CSV commit failures while retaining the validated preview for recovery", async () => {
    queryMocks.organizationsMine.mockReturnValue({ data: [{ organization: { id: 8 } }], isLoading: false, error: null });
    mutationMocks.commitCsv.mockImplementation((options: { onError?: (error: Error) => void }) => ({ isPending: false, mutate: () => options.onError?.(new Error("Import batch is unavailable; refresh the source-file evidence.")) }));
    render(<IngestionWorkbench />);
    const file = { name: "readings.csv", text: async () => "meterKey,observedAt,value,unit\nhvac-main,2026-08-22T00:00:00.000Z,100,kWh" } as unknown as File;
    const fileInput = screen.getByLabelText("CSV source file");
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.submit(fileInput.closest("form")!);
    expect(await screen.findByRole("button", { name: "Commit valid rows" })).toBeTruthy();
    expect(screen.getByText("readings.csv")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Commit valid rows" }));
    expect(await screen.findByText("CSV commit failed: Import batch is unavailable; refresh the source-file evidence.")).toBeTruthy();
    expect(screen.getByText("readings.csv")).toBeTruthy();
  });
});
