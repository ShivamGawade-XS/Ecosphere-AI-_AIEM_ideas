import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { campuses, dataSources, monitoringSettings, sustainabilityAlerts, sustainabilityRecommendations, sustainabilityScenarios, telemetry } from "../drizzle/schema";
import { getDb } from "./db";
import { getCampusDashboard, injectEnergySpike, runScheduledMonitoring, setAlertStatus } from "./sustainability";

let campusId: number | null = null;

beforeEach(async () => {
  const db = await getDb();
  if (!db) throw new Error("Integration database is unavailable");
  const slug = `test-monitoring-${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  await db.insert(campuses).values({ slug, name: "EcoSphere Test Campus", location: "Test fixture", mode: "demo" });
  const campus = (await db.select().from(campuses).where(eq(campuses.slug, slug)).limit(1))[0];
  if (!campus) throw new Error("Test campus fixture was not created");
  campusId = campus.id;
  const now = Date.now();
  await db.insert(telemetry).values(Array.from({ length: 8 }, (_, index) => ({ campusId: campus.id, metric: "energy" as const, value: String(650 + index), unit: "kWh", source: "Fixture baseline", isSimulated: true, capturedAt: new Date(now - (8 - index) * 3_600_000), metadata: JSON.stringify({ fixture: true }) })));
  await db.insert(dataSources).values({ campusId: campus.id, name: "Fixture Demo Stream", sourceType: "sensor", status: "connected", approved: true, fieldMapping: JSON.stringify({ adapter: "demo-sensor", fixture: true }) });
  await db.insert(monitoringSettings).values({ campusId: campus.id, highSeverityNotifications: false, scheduleMinutes: 15 });
});

afterEach(async () => {
  if (!campusId) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(telemetry).where(eq(telemetry.campusId, campusId));
  await db.delete(sustainabilityAlerts).where(eq(sustainabilityAlerts.campusId, campusId));
  await db.delete(sustainabilityRecommendations).where(eq(sustainabilityRecommendations.campusId, campusId));
  await db.delete(sustainabilityScenarios).where(eq(sustainabilityScenarios.campusId, campusId));
  await db.delete(dataSources).where(eq(dataSources.campusId, campusId));
  await db.delete(monitoringSettings).where(eq(monitoringSettings.campusId, campusId));
  await db.delete(campuses).where(eq(campuses.id, campusId));
  campusId = null;
});

describe.sequential("EcoSphere isolated monitoring integration", () => {
  it("refreshes only the fixture’s approved connected source during its scheduled pass", async () => {
    if (!campusId) throw new Error("Test campus fixture missing");
    const result = await runScheduledMonitoring(undefined, campusId);
    expect(result).toMatchObject({ ok: true, sourceRefresh: { checked: 1, refreshed: 1, skipped: 0 } });
  }, 20_000);

  it("creates, acknowledges, resolves, and surfaces a controlled HVAC alert for the fixture campus", async () => {
    if (!campusId) throw new Error("Test campus fixture missing");
    const spike = await injectEnergySpike(campusId);
    expect(spike.anomaly.isAnomaly).toBe(true);
    expect(spike.alertId).toBeTypeOf("number");
    if (!spike.alertId) throw new Error("Controlled spike did not create an alert identifier");
    await setAlertStatus(spike.alertId, "acknowledged");
    await setAlertStatus(spike.alertId, "resolved");
    const dashboard = await getCampusDashboard(campusId);
    expect(dashboard.alerts.find(alert => alert.id === spike.alertId)?.status).toBe("resolved");
  }, 20_000);
});
