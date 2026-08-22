import { describe, expect, it } from "vitest";
import { ADVISOR_SYSTEM_PROMPT, buildAdvisorFallback } from "./routers/sustainability";
import { buildSimulatedSourceRefreshRows, getAlertStatusPatch, parseCsvTelemetryRows, shouldSendHighSeverityFollowUp } from "./sustainability";

describe("EcoSphere monitoring lifecycle", () => {
  it("validates approved CSV telemetry rows and rejects malformed metrics", () => {
    const rows = parseCsvTelemetryRows("timestamp,metric,value,unit\n2026-08-22T09:00:00Z,energy,742,kWh");
    expect(rows).toEqual([{ capturedAt: new Date("2026-08-22T09:00:00Z"), metric: "energy", value: 742, unit: "kWh" }]);
    expect(() => parseCsvTelemetryRows("timestamp,metric,value,unit\n2026-08-22T09:00:00Z,steam,742,kWh")).toThrow("Invalid CSV telemetry on row 2");
    expect(() => parseCsvTelemetryRows("metric,value\nenergy,742")).toThrow("CSV header must include");
  });

  it("throttles repeated high-severity notifications for fifteen minutes", () => {
    const now = new Date("2026-08-22T12:00:00Z");
    expect(shouldSendHighSeverityFollowUp(null, now)).toBe(true);
    expect(shouldSendHighSeverityFollowUp(new Date("2026-08-22T11:46:00Z"), now)).toBe(false);
    expect(shouldSendHighSeverityFollowUp(new Date("2026-08-22T11:45:00Z"), now)).toBe(true);
  });

  it("creates the correct alert status patch for acknowledgement and resolution", () => {
    const now = new Date("2026-08-22T12:00:00Z");
    expect(getAlertStatusPatch("acknowledged", now)).toEqual({ status: "acknowledged", resolvedAt: null });
    expect(getAlertStatusPatch("resolved", now)).toEqual({ status: "resolved", resolvedAt: now });
  });

  it("builds a complete clearly simulated scheduled-refresh batch", () => {
    const capturedAt = new Date("2026-08-22T12:00:00Z");
    const rows = buildSimulatedSourceRefreshRows(7, "AIEM Demonstration Meter Stream", 1, capturedAt);
    expect(rows).toHaveLength(4);
    expect(rows.map(row => row.metric)).toEqual(["energy", "water", "waste", "carbon"]);
    expect(rows.every(row => row.isSimulated && row.source === "AIEM Demonstration Meter Stream" && row.capturedAt === capturedAt)).toBe(true);
    expect(rows[3]?.value).toBe("504.1");
  });
});

describe("EcoSphere advisor guardrails", () => {
  it("requires grounded, simulated, and concise advisor responses", () => {
    expect(ADVISOR_SYSTEM_PROMPT).toContain("ONLY the telemetry context supplied");
    expect(ADVISOR_SYSTEM_PROMPT).toContain("simulated");
    expect(ADVISOR_SYSTEM_PROMPT).toContain("Never invent measurements, costs, causes, or external facts");
    expect(ADVISOR_SYSTEM_PROMPT).toContain("at most three short Markdown bullets");
  });

  it("formats a concise, explicitly simulated fallback from supplied alert telemetry only", () => {
    const fallback = buildAdvisorFallback({
      ecoScore: 86,
      forecast: { nextValue: 755.5, unit: "kWh / hour" },
      recommendations: [{ detail: "Optimize HVAC start-up windows." }],
      alerts: [{ title: "HVAC energy spike detected", severity: "high", observedValue: 1163.5, threshold: 920.5, action: "Inspect HVAC schedules." }],
    });
    expect(fallback).toContain("Simulated alert");
    expect(fallback).toContain("1163.5 versus a threshold of 920.5");
    expect(fallback).toContain("Inspect HVAC schedules.");
    expect(fallback.match(/^- /gm)).toHaveLength(3);
    expect(fallback).toContain("Next action");
  });
});
