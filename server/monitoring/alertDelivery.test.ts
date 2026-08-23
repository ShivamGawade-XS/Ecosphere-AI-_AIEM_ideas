import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  getAlertForDelivery: vi.fn(),
  getAlertRoutingPreference: vi.fn(),
  createAlertDeliveryAttempt: vi.fn(),
}));
const notification = vi.hoisted(() => ({ notifyOwner: vi.fn() }));

vi.mock("../db", () => database);
vi.mock("../_core/notification", () => notification);

import { deliverOwnerNotificationForAlert } from "./alertDelivery";

describe("owner alert delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.getAlertForDelivery.mockResolvedValue({ id: 7, severity: "critical", title: "Critical HVAC deviation", message: "A deterministic critical alert was created." });
    database.createAlertDeliveryAttempt.mockResolvedValue({ id: 1 });
  });

  it("records suppression when tenant routing is disabled", async () => {
    database.getAlertRoutingPreference.mockResolvedValue({ id: 3, isEnabled: false, minimumSeverity: "high" });
    const result = await deliverOwnerNotificationForAlert({ organizationId: 8, alertId: 7 });
    expect(result).toEqual({ status: "suppressed", reason: "routing-disabled" });
    expect(notification.notifyOwner).not.toHaveBeenCalled();
    expect(database.createAlertDeliveryAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "suppressed", routingPreferenceId: 3 }));
  });

  it("suppresses a lower-severity alert below the configured threshold", async () => {
    database.getAlertForDelivery.mockResolvedValue({ id: 7, severity: "medium", title: "Medium deviation", message: "Evidence" });
    database.getAlertRoutingPreference.mockResolvedValue({ id: 3, isEnabled: true, minimumSeverity: "high" });
    const result = await deliverOwnerNotificationForAlert({ organizationId: 8, alertId: 7 });
    expect(result).toEqual({ status: "suppressed", reason: "below-threshold" });
    expect(notification.notifyOwner).not.toHaveBeenCalled();
  });

  it("records delivery only when the owner notification service accepts the alert", async () => {
    database.getAlertRoutingPreference.mockResolvedValue({ id: 3, isEnabled: true, minimumSeverity: "high" });
    notification.notifyOwner.mockResolvedValue(true);
    const result = await deliverOwnerNotificationForAlert({ organizationId: 8, alertId: 7 });
    expect(result).toEqual({ status: "delivered" });
    expect(notification.notifyOwner).toHaveBeenCalledWith({ title: "[EcoSphere] Critical HVAC deviation", content: "A deterministic critical alert was created." });
    expect(database.createAlertDeliveryAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "delivered", providerReference: "manus-owner-notification" }));
  });

  it("records a failed attempt when the owner notification service does not accept the request", async () => {
    database.getAlertRoutingPreference.mockResolvedValue({ id: 3, isEnabled: true, minimumSeverity: "high" });
    notification.notifyOwner.mockResolvedValue(false);
    const result = await deliverOwnerNotificationForAlert({ organizationId: 8, alertId: 7 });
    expect(result).toEqual({ status: "failed" });
    expect(database.createAlertDeliveryAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
  });
});
