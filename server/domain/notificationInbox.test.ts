import { describe, expect, it } from "vitest";
import { buildInboxNotifications } from "./notificationInbox";

const now = new Date("2026-08-25T12:00:00.000Z");

describe("buildInboxNotifications", () => {
  it("derives only actionable source evidence and retains a workspace handoff", () => {
    const result = buildInboxNotifications({
      alerts: [{ id: 1, status: "open", title: "HVAC spike", message: "Persisted deviation needs review.", createdAt: new Date("2026-08-25T11:00:00.000Z"), severity: "high", meterName: "HVAC Electricity" }, { id: 2, status: "acknowledged", title: "Old alert", message: "ignored", createdAt: now }],
      imports: [{ id: 3, status: "completed_with_errors", errorSummary: "2 rows quarantined", createdAt: new Date("2026-08-25T10:00:00.000Z") }],
      actions: [{ id: 4, title: "Review controls", status: "in_progress", targetDate: new Date("2026-08-24T23:59:59.999Z"), updatedAt: now }],
      monitoringHealth: { state: "stale", ageMinutes: 95, checkedAt: now, openRecoveries: [{ id: 5, reason: "scheduled callback needs review", detectedAt: new Date("2026-08-25T09:00:00.000Z") }] },
      now,
    });
    expect(result.map((item) => item.key)).toEqual(["monitoring:stale", "alert:1", "import:3", "recovery:5", "action:4:overdue"]);
    expect(result.find((item) => item.key === "alert:1")).toMatchObject({ priority: "high", workspacePath: "/app/intelligence" });
    expect(result.find((item) => item.key === "action:4:overdue")?.detail).toContain("not a delivery guarantee");
  });

  it("does not fabricate monitoring delivery concerns while a schedule is not enabled or healthy", () => {
    expect(buildInboxNotifications({ alerts: [], imports: [], actions: [], monitoringHealth: { state: "not_enabled", ageMinutes: null, checkedAt: now, openRecoveries: [] }, now })).toEqual([]);
    expect(buildInboxNotifications({ alerts: [], imports: [], actions: [], monitoringHealth: { state: "healthy", ageMinutes: 5, checkedAt: now, openRecoveries: [] }, now })).toEqual([]);
  });
});
