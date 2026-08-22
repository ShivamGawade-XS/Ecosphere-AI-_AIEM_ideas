import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { parse as parseCookie } from "cookie";
import { getDb } from "./db";
import { campuses, dataSources, monitoringSettings, sustainabilityAlerts, telemetry } from "../drizzle/schema";
import { calculateEcoScore, calculateForecast, calculateSimulation, DEMO_ELECTRICITY_EMISSION_FACTOR, detectEnergyAnomaly, getSdgImpact, round, type MetricName, type SimulationInput, type TimeSeriesPoint } from "../shared/sustainability";
import { notifyOwner } from "./_core/notification";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { COOKIE_NAME } from "../shared/const";

export const AIEM_CAMPUS_SLUG = "aiem-campus";

const DEMO_SERIES = {
  energy: [682, 710, 695, 724, 701, 738, 720, 745, 730, 752, 740, 765],
  water: [34, 35, 33, 36, 35, 37, 34, 36, 35, 38, 36, 37],
  waste: [24, 25, 22, 26, 25, 24, 27, 25, 26, 24, 25, 26],
};

const startOfDemo = Date.UTC(2026, 7, 22, 4, 0, 0);

function metricUnit(metric: MetricName) {
  return metric === "energy" ? "kWh" : metric === "water" ? "kL" : metric === "waste" ? "kg" : "kgCO₂e";
}

export async function ensureDemoCampus() {
  const db = await getDb();
  if (!db) return null;

  const existing = (await db.select().from(campuses).where(eq(campuses.slug, AIEM_CAMPUS_SLUG)).limit(1))[0];
  if (existing) return existing;

  await db.insert(campuses).values({ slug: AIEM_CAMPUS_SLUG, name: "AIEM Campus", location: "Goa, India", mode: "demo" });
  const campus = (await db.select().from(campuses).where(eq(campuses.slug, AIEM_CAMPUS_SLUG)).limit(1))[0];
  if (!campus) throw new Error("Unable to create AIEM demo campus");

  const values: Array<{ campusId: number; metric: MetricName; value: string; unit: string; source: string; isSimulated: boolean; capturedAt: Date; metadata: string }> = (Object.entries(DEMO_SERIES) as [Exclude<MetricName, "carbon">, number[]][]).flatMap(([metric, values]) =>
    values.map((value, index) => ({
      campusId: campus.id,
      metric,
      value: String(value),
      unit: metricUnit(metric),
      source: "EcoSphere Demo Engine",
      isSimulated: true,
      capturedAt: new Date(startOfDemo + index * 60 * 60 * 1000),
      metadata: JSON.stringify({ scenario: "AIEM Campus baseline", simulated: true }),
    }))
  );
  values.push(...DEMO_SERIES.energy.map((value, index) => ({
    campusId: campus.id,
    metric: "carbon" as const,
    value: String(round(value * DEMO_ELECTRICITY_EMISSION_FACTOR)),
    unit: metricUnit("carbon"),
    source: "EcoSphere Demo Engine",
    isSimulated: true,
    capturedAt: new Date(startOfDemo + index * 60 * 60 * 1000),
    metadata: JSON.stringify({ factor: DEMO_ELECTRICITY_EMISSION_FACTOR, simulated: true }),
  })));
  await db.insert(telemetry).values(values);
  await db.insert(dataSources).values([
    { campusId: campus.id, name: "Demo CSV Import", sourceType: "csv", status: "ready", approved: true, fieldMapping: JSON.stringify({ timestamp: "ISO-8601", metric: "energy|water|waste|carbon", value: "number", unit: "string" }) },
    { campusId: campus.id, name: "Building Meter Gateway", sourceType: "sensor", status: "ready", approved: false, fieldMapping: JSON.stringify({ note: "Approval required before any production sensor data is ingested." }) },
  ]);
  await db.insert(monitoringSettings).values({ campusId: campus.id, highSeverityNotifications: true, scheduleMinutes: 15 });
  return campus;
}

export async function getCampusTelemetry(campusId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(telemetry).where(eq(telemetry.campusId, campusId)).orderBy(asc(telemetry.capturedAt));
}

function asPoint(row: { capturedAt: Date; value: string; unit: string; isSimulated: boolean }): TimeSeriesPoint {
  return { timestamp: row.capturedAt.getTime(), value: Number(row.value), unit: row.unit, simulated: row.isSimulated };
}

export async function getCampusDashboard() {
  const campus = await ensureDemoCampus();
  if (!campus) return getFallbackDashboard();
  const db = await getDb();
  if (!db) return getFallbackDashboard();

  const records = await getCampusTelemetry(campus.id);
  const series = (["energy", "water", "waste", "carbon"] as MetricName[]).reduce((acc, metric) => {
    acc[metric] = records.filter(record => record.metric === metric).slice(-14).map(asPoint);
    return acc;
  }, {} as Record<MetricName, TimeSeriesPoint[]>);
  const latest = (metric: MetricName) => series[metric].at(-1)?.value ?? 0;
  const baseline = { energyKwh: latest("energy") * 16, waterKl: latest("water") * 16, wasteKg: latest("waste") * 16 };
  const carbon = latest("carbon") * 16;
  const ecoScore = calculateEcoScore({ monthlyEnergyKwh: baseline.energyKwh, monthlyWaterKl: baseline.waterKl, monthlyWasteKg: baseline.wasteKg, monthlyCarbonKg: carbon });
  const forecast = calculateForecast(series.energy);
  const alerts = await db.select().from(sustainabilityAlerts).where(eq(sustainabilityAlerts.campusId, campus.id)).orderBy(desc(sustainabilityAlerts.openedAt)).limit(20);
  const sources = await db.select().from(dataSources).where(eq(dataSources.campusId, campus.id));
  const settings = (await db.select().from(monitoringSettings).where(eq(monitoringSettings.campusId, campus.id)).limit(1))[0];
  const defaultSimulation = calculateSimulation(baseline, { energyReductionPct: 15, waterReductionPct: 8, wasteDiversionPct: 12 });

  return {
    campus: { id: campus.id, name: campus.name, location: campus.location, mode: campus.mode, simulated: true },
    generatedAt: Date.now(),
    isSimulated: true,
    series,
    metrics: {
      energy: { value: round(baseline.energyKwh), unit: "kWh / month", trend: 3.4 },
      water: { value: round(baseline.waterKl), unit: "kL / month", trend: -1.8 },
      waste: { value: round(baseline.wasteKg), unit: "kg / month", trend: 2.1 },
      carbon: { value: round(carbon), unit: "kgCO₂e / month", trend: 3.4 },
    },
    ecoScore,
    forecast: { ...forecast, unit: "kWh / hour", confidence: 88 },
    alerts: alerts.map(alert => ({ ...alert, observedValue: Number(alert.observedValue), threshold: Number(alert.threshold), simulated: alert.isSimulated })),
    dataSources: sources,
    monitoring: { notificationsEnabled: settings?.highSeverityNotifications ?? true, scheduleMinutes: settings?.scheduleMinutes ?? 15, active: Boolean(settings?.scheduleCronTaskUid) },
    defaultSimulation,
    sdgImpact: getSdgImpact(defaultSimulation),
    recommendations: getRecommendations(alerts.some(alert => alert.status === "open" && ["high", "critical"].includes(alert.severity))),
  };
}

export async function injectEnergySpike() {
  const campus = await ensureDemoCampus();
  const db = await getDb();
  if (!campus || !db) throw new Error("Database unavailable; demo spike cannot be recorded.");
  const energyPoints = (await getCampusTelemetry(campus.id)).filter(row => row.metric === "energy").slice(-8).map(asPoint);
  const baseline = energyPoints.reduce((sum, point) => sum + point.value, 0) / Math.max(1, energyPoints.length);
  const spikeValue = round(baseline * 1.58);
  const capturedAt = new Date();
  await db.insert(telemetry).values({ campusId: campus.id, metric: "energy", value: String(spikeValue), unit: "kWh", source: "Controlled HVAC Spike Injection", isSimulated: true, capturedAt, metadata: JSON.stringify({ event: "HVAC_energy_spike", simulated: true }) });
  await db.insert(telemetry).values({ campusId: campus.id, metric: "carbon", value: String(round(spikeValue * DEMO_ELECTRICITY_EMISSION_FACTOR)), unit: "kgCO₂e", source: "Calculated from controlled injection", isSimulated: true, capturedAt, metadata: JSON.stringify({ simulated: true, derived: "energy" }) });

  const anomaly = detectEnergyAnomaly(spikeValue, energyPoints);
  if (!anomaly.isAnomaly) return { created: false, spikeValue, anomaly };
  const existing = (await db.select().from(sustainabilityAlerts).where(and(eq(sustainabilityAlerts.campusId, campus.id), eq(sustainabilityAlerts.code, "HVAC-ENERGY-SPIKE"), inArray(sustainabilityAlerts.status, ["open", "acknowledged"]))).limit(1))[0];
  if (existing) return { created: false, spikeValue, anomaly, alertId: existing.id };

  await db.insert(sustainabilityAlerts).values({
    campusId: campus.id,
    code: "HVAC-ENERGY-SPIKE",
    title: "HVAC energy spike detected",
    description: `Simulated HVAC consumption reached ${spikeValue} kWh, ${Math.round((anomaly.ratio - 1) * 100)}% above the trailing eight-hour baseline of ${anomaly.baseline} kWh.`,
    severity: "high",
    status: "open",
    metric: "energy",
    observedValue: String(spikeValue),
    threshold: String(round(anomaly.baseline * 1.25)),
    recommendedAction: "Inspect HVAC schedules and override states in the affected block; verify setpoints before the next operating hour.",
    isSimulated: true,
  });
  const alert = (await db.select().from(sustainabilityAlerts).where(and(eq(sustainabilityAlerts.campusId, campus.id), eq(sustainabilityAlerts.code, "HVAC-ENERGY-SPIKE"))).orderBy(desc(sustainabilityAlerts.openedAt)).limit(1))[0];
  const settings = (await db.select().from(monitoringSettings).where(eq(monitoringSettings.campusId, campus.id)).limit(1))[0];
  let notificationDelivered = false;
  if (settings?.highSeverityNotifications && alert) {
    notificationDelivered = await notifyOwner({ title: "EcoSphere AI: simulated high-severity HVAC alert", content: `${alert.title}. ${alert.recommendedAction}` });
    if (notificationDelivered) await db.update(sustainabilityAlerts).set({ lastNotifiedAt: new Date() }).where(eq(sustainabilityAlerts.id, alert.id));
  }
  return { created: true, spikeValue, anomaly, alertId: alert?.id, notificationDelivered };
}

export async function setAlertStatus(alertId: number, status: "acknowledged" | "resolved") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(sustainabilityAlerts).set({ status, resolvedAt: status === "resolved" ? new Date() : null }).where(eq(sustainabilityAlerts.id, alertId));
  return { success: true };
}

export async function createSimulation(input: SimulationInput) {
  const dashboard = await getCampusDashboard();
  const baseline = { energyKwh: dashboard.metrics.energy.value, waterKl: dashboard.metrics.water.value, wasteKg: dashboard.metrics.waste.value };
  return calculateSimulation(baseline, input);
}

export async function updateMonitoringPreferences(input: { enabled: boolean; scheduleMinutes: number }) {
  const campus = await ensureDemoCampus();
  const db = await getDb();
  if (!campus || !db) throw new Error("Database unavailable");
  await db.update(monitoringSettings).set({ highSeverityNotifications: input.enabled, scheduleMinutes: input.scheduleMinutes }).where(eq(monitoringSettings.campusId, campus.id));
  return { success: true };
}

export async function activateScheduledMonitoring(input: { scheduleMinutes: 5 | 10 | 15 | 30 | 60; cookieHeader: string | undefined }) {
  const campus = await ensureDemoCampus();
  const db = await getDb();
  if (!campus || !db) throw new Error("Database unavailable");
  const settings = (await db.select().from(monitoringSettings).where(eq(monitoringSettings.campusId, campus.id)).limit(1))[0];
  if (!settings) throw new Error("Monitoring settings unavailable");
  const sessionToken = parseCookie(input.cookieHeader ?? "")[COOKIE_NAME] ?? "";
  if (!sessionToken) throw new Error("Sign in is required to activate scheduled monitoring.");
  const cron = input.scheduleMinutes === 60 ? "0 0 * * * *" : `0 */${input.scheduleMinutes} * * * *`;
  if (settings.scheduleCronTaskUid) {
    await updateHeartbeatJob(settings.scheduleCronTaskUid, { cron, enable: true, description: `EcoSphere AI unresolved-alert monitoring every ${input.scheduleMinutes} minutes` }, sessionToken);
  } else {
    const job = await createHeartbeatJob({ name: `ecosphere-monitoring-${campus.id}`, cron, path: "/api/scheduled/monitoring", payload: { campusId: campus.id }, description: `EcoSphere AI unresolved-alert monitoring every ${input.scheduleMinutes} minutes` }, sessionToken);
    await db.update(monitoringSettings).set({ scheduleCronTaskUid: job.taskUid }).where(eq(monitoringSettings.id, settings.id));
  }
  await db.update(monitoringSettings).set({ scheduleMinutes: input.scheduleMinutes }).where(eq(monitoringSettings.id, settings.id));
  return { success: true };
}

const validMetrics = new Set<MetricName>(["energy", "water", "waste", "carbon"]);

export async function importApprovedCsvTelemetry(input: { sourceId: number; csvData: string }) {
  const campus = await ensureDemoCampus();
  const db = await getDb();
  if (!campus || !db) throw new Error("Database unavailable");
  const source = (await db.select().from(dataSources).where(and(eq(dataSources.id, input.sourceId), eq(dataSources.campusId, campus.id))).limit(1))[0];
  if (!source || !source.approved || source.sourceType !== "csv") throw new Error("Select an approved CSV data source before importing telemetry.");
  const lines = input.csvData.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must include a header and at least one telemetry row.");
  const headers = lines[0].split(",").map(header => header.trim().toLowerCase());
  const required = ["timestamp", "metric", "value", "unit"];
  if (required.some(field => !headers.includes(field))) throw new Error("CSV header must include timestamp, metric, value, and unit.");
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  const rows = lines.slice(1, 241).map((line, position) => {
    const values = line.split(",").map(value => value.trim());
    const metric = values[index.metric] as MetricName;
    const value = Number(values[index.value]);
    const capturedAt = new Date(values[index.timestamp]);
    if (!validMetrics.has(metric) || !Number.isFinite(value) || value < 0 || Number.isNaN(capturedAt.getTime())) throw new Error(`Invalid CSV telemetry on row ${position + 2}.`);
    return { campusId: campus.id, metric, value: String(value), unit: values[index.unit] || metricUnit(metric), source: source.name, isSimulated: false, capturedAt, metadata: JSON.stringify({ imported: true, sourceId: source.id }) };
  });
  await db.insert(telemetry).values(rows);
  await db.update(dataSources).set({ status: "connected", lastSyncAt: new Date() }).where(eq(dataSources.id, source.id));
  return { success: true, imported: rows.length, source: source.name };
}

export async function runScheduledMonitoring(taskUid?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const campus = await ensureDemoCampus();
  if (!campus) throw new Error("Demo campus unavailable");
  const settings = (await db.select().from(monitoringSettings).where(taskUid ? eq(monitoringSettings.scheduleCronTaskUid, taskUid) : eq(monitoringSettings.campusId, campus.id)).limit(1))[0];
  if (!settings) return { ok: true, skipped: "orphan" as const };
  const unresolved = await db.select().from(sustainabilityAlerts).where(and(eq(sustainabilityAlerts.campusId, campus.id), inArray(sustainabilityAlerts.status, ["open", "acknowledged"]), inArray(sustainabilityAlerts.severity, ["high", "critical"])));
  let notifications = 0;
  const now = new Date();
  for (const alert of unresolved) {
    const shouldNotify = !alert.lastNotifiedAt || now.getTime() - alert.lastNotifiedAt.getTime() >= 15 * 60 * 1000;
    if (settings.highSeverityNotifications && shouldNotify) {
      const delivered = await notifyOwner({ title: `EcoSphere AI follow-up: ${alert.title}`, content: `This simulated ${alert.severity}-severity incident remains ${alert.status}. Next action: ${alert.recommendedAction}` });
      if (delivered) {
        notifications += 1;
        await db.update(sustainabilityAlerts).set({ lastNotifiedAt: now }).where(eq(sustainabilityAlerts.id, alert.id));
      }
    }
  }
  await db.update(monitoringSettings).set({ lastScheduleCheckAt: now }).where(eq(monitoringSettings.id, settings.id));
  return { ok: true, unresolved: unresolved.length, notifications };
}

export function getRecommendations(hasHighAlert: boolean) {
  const primary = hasHighAlert
    ? "Prioritize HVAC schedule and setpoint verification; the controlled spike is above the alert baseline."
    : "Optimize HVAC start-up windows before peak occupancy to reduce avoidable energy demand.";
  return [
    { title: "HVAC operating window", impact: "High", detail: primary, action: "Review schedules" },
    { title: "Water loss sweep", impact: "Medium", detail: "Check washroom and irrigation zones during low-demand hours.", action: "Assign inspection" },
    { title: "Segregation audit", impact: "Medium", detail: "Improve dry-waste separation at high-footfall collection points.", action: "Run audit" },
  ];
}

function getFallbackDashboard() {
  const makeSeries = (values: number[], unit: string) => values.map((value, index) => ({ timestamp: startOfDemo + index * 3_600_000, value, unit, simulated: true }));
  const series = { energy: makeSeries(DEMO_SERIES.energy, "kWh"), water: makeSeries(DEMO_SERIES.water, "kL"), waste: makeSeries(DEMO_SERIES.waste, "kg"), carbon: makeSeries(DEMO_SERIES.energy.map(value => round(value * DEMO_ELECTRICITY_EMISSION_FACTOR)), "kgCO₂e") };
  const baseline = { energyKwh: 12240, waterKl: 592, wasteKg: 416 };
  const simulation = calculateSimulation(baseline, { energyReductionPct: 15, waterReductionPct: 8, wasteDiversionPct: 12 });
  return { campus: { id: 0, name: "AIEM Campus", location: "Goa, India", mode: "demo", simulated: true }, generatedAt: Date.now(), isSimulated: true, series, metrics: { energy: { value: baseline.energyKwh, unit: "kWh / month", trend: 3.4 }, water: { value: baseline.waterKl, unit: "kL / month", trend: -1.8 }, waste: { value: baseline.wasteKg, unit: "kg / month", trend: 2.1 }, carbon: { value: 8689, unit: "kgCO₂e / month", trend: 3.4 } }, ecoScore: calculateEcoScore({ monthlyEnergyKwh: baseline.energyKwh, monthlyWaterKl: baseline.waterKl, monthlyWasteKg: baseline.wasteKg, monthlyCarbonKg: 8689 }), forecast: { ...calculateForecast(series.energy), unit: "kWh / hour", confidence: 88 }, alerts: [], dataSources: [], monitoring: { notificationsEnabled: false, scheduleMinutes: 15, active: false }, defaultSimulation: simulation, sdgImpact: getSdgImpact(simulation), recommendations: getRecommendations(false) };
}
