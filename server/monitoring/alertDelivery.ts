import * as db from "../db";
import { notifyOwner } from "../_core/notification";

const severityRank = { low: 1, medium: 2, high: 3, critical: 4 } as const;

export async function deliverOwnerNotificationForAlert(input: { organizationId: number; alertId: number }) {
  const [alert, preference] = await Promise.all([
    db.getAlertForDelivery(input.organizationId, input.alertId),
    db.getAlertRoutingPreference(input.organizationId),
  ]);
  if (!alert) return { status: "missing" as const };

  if (!preference || !preference.isEnabled) {
    await db.createAlertDeliveryAttempt({
      organizationId: input.organizationId,
      alertId: input.alertId,
      routingPreferenceId: preference?.id ?? null,
      status: "suppressed",
      errorSummary: "Owner notification routing is not enabled for this organization.",
    });
    return { status: "suppressed" as const, reason: "routing-disabled" as const };
  }

  if (severityRank[alert.severity] < severityRank[preference.minimumSeverity]) {
    await db.createAlertDeliveryAttempt({
      organizationId: input.organizationId,
      alertId: input.alertId,
      routingPreferenceId: preference.id,
      status: "suppressed",
      errorSummary: `Alert severity ${alert.severity} is below configured threshold ${preference.minimumSeverity}.`,
    });
    return { status: "suppressed" as const, reason: "below-threshold" as const };
  }

  try {
    const accepted = await notifyOwner({ title: `[EcoSphere] ${alert.title}`, content: alert.message });
    await db.createAlertDeliveryAttempt({
      organizationId: input.organizationId,
      alertId: input.alertId,
      routingPreferenceId: preference.id,
      status: accepted ? "delivered" : "failed",
      errorSummary: accepted ? null : "Owner notification service did not accept the delivery request.",
      providerReference: "manus-owner-notification",
    });
    return { status: accepted ? "delivered" as const : "failed" as const };
  } catch (error) {
    const errorSummary = error instanceof Error ? error.message : "Unknown owner-notification failure.";
    await db.createAlertDeliveryAttempt({
      organizationId: input.organizationId,
      alertId: input.alertId,
      routingPreferenceId: preference.id,
      status: "failed",
      errorSummary,
      providerReference: "manus-owner-notification",
    });
    return { status: "failed" as const, errorSummary };
  }
}
