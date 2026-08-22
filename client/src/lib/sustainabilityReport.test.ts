import { describe, expect, it, vi } from "vitest";

const pdfMocks = vi.hoisted(() => {
  const doc = {
    internal: { pageSize: { getWidth: () => 595 } },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    circle: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    save: vi.fn(),
  };
  return { doc, jsPDF: vi.fn(() => doc) };
});

vi.mock("jspdf", () => ({ jsPDF: pdfMocks.jsPDF }));

import { buildReportProvenance, createSustainabilityReportFileName, downloadSustainabilityReport } from "./sustainabilityReport";

describe("sustainability PDF report helpers", () => {
  it("creates a safe, dated PDF filename from the campus name", () => {
    expect(createSustainabilityReportFileName("AIEM Campus, Goa", Date.UTC(2026, 7, 22))).toBe("aiem-campus-goa-sustainability-report-2026-08-22.pdf");
  });

  it("clearly labels seeded demonstration telemetry in the report provenance", () => {
    expect(buildReportProvenance(true)).toContain("simulated telemetry");
    expect(buildReportProvenance(false)).toContain("approved connected telemetry sources");
  });

  it("renders the current report payload and saves a dated PDF download", () => {
    downloadSustainabilityReport({
      campus: { name: "AIEM Campus", location: "Goa, India", mode: "demo" },
      generatedAt: Date.UTC(2026, 7, 22),
      isSimulated: true,
      ecoScore: { total: 86, energy: 80, water: 94, waste: 100, carbon: 78 },
      metrics: {
        energy: { value: 12240, unit: "kWh / month", trend: 3.4 },
        water: { value: 592, unit: "kL / month", trend: -1.8 },
        waste: { value: 416, unit: "kg / month", trend: 2.1 },
        carbon: { value: 8691, unit: "kgCO₂e / month", trend: 3.4 },
      },
      forecast: { nextValue: 755.5, unit: "kWh / hour", changePct: 18, confidence: 88 },
      alerts: [{ title: "HVAC energy spike detected", severity: "high", status: "open", observedValue: 1163.5, threshold: 920.5, recommendedAction: "Inspect HVAC schedules.", simulated: true }],
    });
    expect(pdfMocks.jsPDF).toHaveBeenCalledWith({ orientation: "portrait", unit: "pt", format: "a4" });
    expect(pdfMocks.doc.text).toHaveBeenCalledWith(expect.stringContaining("HVAC energy spike detected"), 49, expect.any(Number));
    expect(pdfMocks.doc.save).toHaveBeenCalledWith("aiem-campus-sustainability-report-2026-08-22.pdf");
  });
});
