export type InboxNotification = {
  key: string;
  kind: "alert" | "import" | "action" | "monitoring";
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  occurredAt: Date;
  workspacePath: string;
};

type AlertSource = { id: number; status: string; title: string; message: string; createdAt: Date; severity?: string; meterName?: string };
type ImportSource = { id: number; status: string; createdAt: Date; errorSummary: string | null };
type ActionSource = { id: number; title: string; status: string; targetDate: Date | null; updatedAt: Date };
type MonitoringHealthSource = { state: "not_enabled" | "stale" | "failed" | "healthy"; checkedAt: Date; ageMinutes: number | null; openRecoveries: Array<{ id: number; reason: string; detectedAt: Date }> };

export function buildInboxNotifications(input: { alerts: AlertSource[]; imports: ImportSource[]; actions: ActionSource[]; monitoringHealth: MonitoringHealthSource; now: Date }) {
  const items: InboxNotification[] = [];
  for (const alert of input.alerts) {
    if (alert.status !== "open") continue;
    const highPriority = alert.severity === "critical" || alert.severity === "high";
    items.push({ key: `alert:${alert.id}`, kind: "alert", priority: highPriority ? "high" : "medium", title: alert.title, detail: alert.meterName ? `${alert.meterName}: ${alert.message}` : alert.message, occurredAt: alert.createdAt, workspacePath: "/app/intelligence" });
  }
  for (const batch of input.imports) {
    if (batch.status !== "failed" && batch.status !== "completed_with_errors") continue;
    items.push({ key: `import:${batch.id}`, kind: "import", priority: batch.status === "failed" ? "high" : "medium", title: batch.status === "failed" ? "Data import failed" : "Data import completed with errors", detail: batch.errorSummary ?? "Review the import outcome and quarantined rows before using this source evidence.", occurredAt: batch.createdAt, workspacePath: "/app/data" });
  }
  for (const action of input.actions) {
    if (action.status === "completed" || action.status === "archived" || !action.targetDate || action.targetDate.getTime() >= input.now.getTime()) continue;
    items.push({ key: `action:${action.id}:overdue`, kind: "action", priority: "medium", title: `Action overdue: ${action.title}`, detail: `The recorded target date was ${action.targetDate.toLocaleDateString("en-CA", { timeZone: "UTC" })}. This is an accountable action deadline, not a delivery guarantee.`, occurredAt: action.targetDate, workspacePath: "/app/actions" });
  }
  if (input.monitoringHealth.state === "failed" || input.monitoringHealth.state === "stale") {
    const failed = input.monitoringHealth.state === "failed";
    items.push({ key: `monitoring:${input.monitoringHealth.state}`, kind: "monitoring", priority: failed ? "high" : "medium", title: failed ? "Scheduled monitoring last run failed" : "Scheduled monitoring is stale", detail: input.monitoringHealth.ageMinutes === null ? "An enabled schedule has no recorded scheduled run." : `Latest recorded scheduled run is ${input.monitoringHealth.ageMinutes} minutes old.`, occurredAt: input.monitoringHealth.checkedAt, workspacePath: "/app/administration" });
  }
  for (const recovery of input.monitoringHealth.openRecoveries) {
    items.push({ key: `recovery:${recovery.id}`, kind: "monitoring", priority: "medium", title: "Monitoring recovery requires review", detail: recovery.reason, occurredAt: recovery.detectedAt, workspacePath: "/app/intelligence" });
  }
  return items.sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime() || left.key.localeCompare(right.key));
}
