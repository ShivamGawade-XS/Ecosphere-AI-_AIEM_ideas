import { and, count, desc, eq, isNull, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  auditEvents,
  anomalyEvents,
  carbonCalculations,
  dataQualityFindings,
  ecoScoreSnapshots,
  ingestionBatches,
  meters,
  monitoringAlerts,
  monitoringRuns,
  organizationMemberships,
  organizations,
  sites,
  sustainabilityReadings,
  sustainabilityActions,
  sustainabilityScenarios,
  type ScenarioAssumptions,
  type ScenarioResults,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let databaseInstance: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!databaseInstance && process.env.DATABASE_URL) {
    try {
      databaseInstance = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to create connection:", error);
      databaseInstance = null;
    }
  }
  return databaseInstance;
}

async function requireDb() {
  const database = await getDb();
  if (!database) throw new Error("Database is not configured");
  return database;
}

function safeSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${normalized || "organization"}-${nanoid(6).toLowerCase()}`;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = await getDb();
  if (!database) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await database.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createOrganizationForUser(input: { userId: number; name: string }) {
  const database = await requireDb();
  return database.transaction(async (tx) => {
    const [created] = await tx
      .insert(organizations)
      .values({ name: input.name, slug: safeSlug(input.name), createdByUserId: input.userId })
      .$returningId();
    await tx.insert(organizationMemberships).values({ organizationId: created.id, userId: input.userId, role: "owner" });
    await tx.insert(auditEvents).values({
      organizationId: created.id,
      actorUserId: input.userId,
      eventType: "organization.created",
      resourceType: "organization",
      resourceId: String(created.id),
      payload: { name: input.name },
    });
    return created;
  });
}

export async function listOrganizationsForUser(userId: number) {
  const database = await requireDb();
  return database
    .select({ organization: organizations, membership: organizationMemberships })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
    .where(eq(organizationMemberships.userId, userId))
    .orderBy(desc(organizations.createdAt));
}

export async function getOrganizationMembership(userId: number, organizationId: number) {
  const database = await requireDb();
  const result = await database
    .select()
    .from(organizationMemberships)
    .where(and(eq(organizationMemberships.userId, userId), eq(organizationMemberships.organizationId, organizationId)))
    .limit(1);
  return result[0];
}

export async function createSite(input: { organizationId: number; name: string; code: string; timezone: string; userId: number }) {
  const database = await requireDb();
  return database.transaction(async (tx) => {
    const [created] = await tx
      .insert(sites)
      .values({ organizationId: input.organizationId, name: input.name, code: input.code, timezone: input.timezone })
      .$returningId();
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "site.created",
      resourceType: "site",
      resourceId: String(created.id),
      payload: { code: input.code, timezone: input.timezone },
    });
    return created;
  });
}

export async function listSites(organizationId: number) {
  const database = await requireDb();
  return database.select().from(sites).where(eq(sites.organizationId, organizationId)).orderBy(sites.name);
}

export async function createMeter(input: {
  organizationId: number;
  siteId: number;
  meterKey: string;
  displayName: string;
  resourceType: (typeof import("../drizzle/schema").resourceTypes)[number];
  canonicalUnit: string;
  userId: number;
}) {
  const database = await requireDb();
  return database.transaction(async (tx) => {
    const [created] = await tx
      .insert(meters)
      .values({
        organizationId: input.organizationId,
        siteId: input.siteId,
        meterKey: input.meterKey,
        displayName: input.displayName,
        resourceType: input.resourceType,
        canonicalUnit: input.canonicalUnit,
      })
      .$returningId();
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "meter.created",
      resourceType: "meter",
      resourceId: String(created.id),
      payload: { meterKey: input.meterKey, resourceType: input.resourceType, canonicalUnit: input.canonicalUnit },
    });
    return created;
  });
}

export async function listMeters(organizationId: number, siteId?: number) {
  const database = await requireDb();
  const predicate = siteId
    ? and(eq(meters.organizationId, organizationId), eq(meters.siteId, siteId))
    : eq(meters.organizationId, organizationId);
  return database.select().from(meters).where(predicate).orderBy(meters.displayName);
}

export async function getMeterById(organizationId: number, meterId: number) {
  const database = await requireDb();
  const result = await database
    .select()
    .from(meters)
    .where(and(eq(meters.organizationId, organizationId), eq(meters.id, meterId), eq(meters.isActive, true)))
    .limit(1);
  return result[0];
}

export async function ingestReading(input: {
  organizationId: number;
  siteId: number;
  meterId: number;
  userId: number;
  observedAt: Date;
  value: number;
  unit: string;
  source: (typeof import("../drizzle/schema").readingSources)[number];
  idempotencyKey: string;
  sourceReference?: string;
  provenance?: Record<string, unknown>;
}) {
  const database = await requireDb();
  const existing = await database
    .select()
    .from(sustainabilityReadings)
    .where(and(eq(sustainabilityReadings.meterId, input.meterId), eq(sustainabilityReadings.idempotencyKey, input.idempotencyKey)))
    .limit(1);
  if (existing[0]) return { reading: existing[0], idempotent: true };

  return database.transaction(async (tx) => {
    const [batch] = await tx
      .insert(ingestionBatches)
      .values({
        organizationId: input.organizationId,
        initiatedByUserId: input.userId,
        idempotencyKey: input.idempotencyKey,
        source: input.source,
        totalRows: 1,
      })
      .$returningId();
    const [created] = await tx
      .insert(sustainabilityReadings)
      .values({
        organizationId: input.organizationId,
        siteId: input.siteId,
        meterId: input.meterId,
        ingestionBatchId: batch.id,
        observedAt: input.observedAt,
        value: input.value.toFixed(4),
        unit: input.unit,
        source: input.source,
        sourceReference: input.sourceReference ?? null,
        idempotencyKey: input.idempotencyKey,
        provenance: input.provenance ?? null,
      })
      .$returningId();
    await tx
      .update(ingestionBatches)
      .set({ status: "completed", acceptedRows: 1, completedAt: new Date() })
      .where(eq(ingestionBatches.id, batch.id));
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "reading.ingested",
      resourceType: "sustainability_reading",
      resourceId: String(created.id),
      payload: { meterId: input.meterId, observedAt: input.observedAt.toISOString(), source: input.source },
    });
    return { reading: { id: created.id }, idempotent: false };
  });
}

export async function listIngestionBatches(organizationId: number) {
  const database = await requireDb();
  return database
    .select()
    .from(ingestionBatches)
    .where(eq(ingestionBatches.organizationId, organizationId))
    .orderBy(desc(ingestionBatches.createdAt))
    .limit(25);
}

export async function listRecentReadings(organizationId: number) {
  const database = await requireDb();
  return database
    .select({ reading: sustainabilityReadings, meter: meters })
    .from(sustainabilityReadings)
    .innerJoin(meters, eq(sustainabilityReadings.meterId, meters.id))
    .where(eq(sustainabilityReadings.organizationId, organizationId))
    .orderBy(desc(sustainabilityReadings.observedAt))
    .limit(30);
}

export async function listReadingsForMonitoring(organizationId: number) {
  const database = await requireDb();
  return database
    .select({ reading: sustainabilityReadings, meter: meters })
    .from(sustainabilityReadings)
    .innerJoin(meters, eq(sustainabilityReadings.meterId, meters.id))
    .where(eq(sustainabilityReadings.organizationId, organizationId))
    .orderBy(sustainabilityReadings.observedAt)
    .limit(500);
}

export async function listUnprocessedReadingsForMonitoring(organizationId: number, evaluationVersion: string) {
  const database = await requireDb();
  return database
    .select({ reading: sustainabilityReadings, meter: meters })
    .from(sustainabilityReadings)
    .innerJoin(meters, eq(sustainabilityReadings.meterId, meters.id))
    .leftJoin(dataQualityFindings, and(
      eq(dataQualityFindings.readingId, sustainabilityReadings.id),
      eq(dataQualityFindings.ruleId, "required-value"),
      eq(dataQualityFindings.evaluationVersion, evaluationVersion),
    ))
    .where(and(eq(sustainabilityReadings.organizationId, organizationId), isNull(dataQualityFindings.id)))
    .orderBy(sustainabilityReadings.observedAt)
    .limit(500);
}

export async function listOrganizationsForMonitoring() {
  const database = await requireDb();
  return database.select({ id: organizations.id }).from(organizations).orderBy(organizations.id);
}

export async function beginMonitoringRun(input: {
  organizationId: number;
  runKey: string;
  trigger: (typeof import("../drizzle/schema").monitoringRunTriggers)[number];
}) {
  const database = await requireDb();
  const existing = await database
    .select()
    .from(monitoringRuns)
    .where(and(eq(monitoringRuns.organizationId, input.organizationId), eq(monitoringRuns.runKey, input.runKey)))
    .limit(1);
  if (existing[0]) {
    const run = existing[0];
    if (run.status === "failed") {
      await database.update(monitoringRuns).set({ status: "running", errorSummary: null, completedAt: null })
        .where(eq(monitoringRuns.id, run.id));
      return { created: true };
    }
    return {
      created: false,
      summary: {
        organizationId: input.organizationId,
        runKey: input.runKey,
        readingsScanned: run.readingsScanned,
        qualityFindingsCreated: run.qualityFindingsCreated,
        anomaliesCreated: run.anomaliesCreated,
        alertsCreated: run.alertsCreated,
        ecoScoresUpdated: run.ecoScoresUpdated,
        latestEcoScore: null,
      },
    };
  }
  await database.insert(monitoringRuns).values(input);
  return { created: true };
}

export async function upsertQualityFindings(input: {
  organizationId: number;
  meterId: number;
  readingId: number;
  evaluationVersion: string;
  findings: Array<{ ruleId: string; status: "passed" | "warning" | "failed"; message: string; details: Record<string, unknown> }>;
}) {
  const database = await requireDb();
  let created = 0;
  for (const finding of input.findings) {
    const existing = await database
      .select({ id: dataQualityFindings.id })
      .from(dataQualityFindings)
      .where(and(
        eq(dataQualityFindings.readingId, input.readingId),
        eq(dataQualityFindings.ruleId, finding.ruleId),
        eq(dataQualityFindings.evaluationVersion, input.evaluationVersion),
      ))
      .limit(1);
    if (!existing[0]) created += 1;
    await database.insert(dataQualityFindings).values({
      organizationId: input.organizationId,
      meterId: input.meterId,
      readingId: input.readingId,
      ruleId: finding.ruleId,
      status: finding.status,
      message: finding.message,
      details: finding.details,
      evaluationVersion: input.evaluationVersion,
    }).onDuplicateKeyUpdate({ set: { status: finding.status, message: finding.message, details: finding.details, evaluatedAt: new Date() } });
  }
  return { created };
}

export async function upsertCarbonCalculation(input: {
  organizationId: number;
  meterId: number;
  readingId: number;
  emittedKgCo2e: number;
  emissionFactor: number;
  factorVersion: string;
  calculationVersion: string;
}) {
  const database = await requireDb();
  await database.insert(carbonCalculations).values({
    organizationId: input.organizationId,
    meterId: input.meterId,
    readingId: input.readingId,
    emittedKgCo2e: input.emittedKgCo2e.toFixed(4),
    emissionFactor: input.emissionFactor.toFixed(6),
    factorVersion: input.factorVersion,
    calculationVersion: input.calculationVersion,
  }).onDuplicateKeyUpdate({
    set: {
      emittedKgCo2e: input.emittedKgCo2e.toFixed(4),
      emissionFactor: input.emissionFactor.toFixed(6),
      factorVersion: input.factorVersion,
      computedAt: new Date(),
    },
  });
}

export async function createAnomalyIfAbsent(input: {
  organizationId: number;
  siteId: number;
  meterId: number;
  readingId: number;
  detectorVersion: string;
  severity: (typeof import("../drizzle/schema").anomalySeverities)[number];
  baselineMean: number;
  baselineStdDev: number;
  observedValue: number;
  zScore: number;
  evidence: Record<string, unknown>;
}) {
  const database = await requireDb();
  const existing = await database.select({ id: anomalyEvents.id }).from(anomalyEvents)
    .where(and(eq(anomalyEvents.readingId, input.readingId), eq(anomalyEvents.detectorVersion, input.detectorVersion))).limit(1);
  if (existing[0]) return { created: false, anomalyId: existing[0].id };
  const [created] = await database.insert(anomalyEvents).values({
    ...input,
    baselineMean: input.baselineMean.toFixed(4),
    baselineStdDev: input.baselineStdDev.toFixed(4),
    observedValue: input.observedValue.toFixed(4),
    zScore: input.zScore.toFixed(4),
  }).$returningId();
  await database.insert(auditEvents).values({
    organizationId: input.organizationId,
    eventType: "anomaly.detected",
    resourceType: "anomaly_event",
    resourceId: String(created.id),
    payload: { meterId: input.meterId, readingId: input.readingId, severity: input.severity, detectorVersion: input.detectorVersion },
  });
  return { created: true, anomalyId: created.id };
}

export async function createMonitoringAlertIfAbsent(input: {
  organizationId: number;
  anomalyId: number;
  severity: (typeof import("../drizzle/schema").anomalySeverities)[number];
  title: string;
  message: string;
}) {
  const database = await requireDb();
  const existing = await database.select({ id: monitoringAlerts.id }).from(monitoringAlerts).where(eq(monitoringAlerts.anomalyId, input.anomalyId)).limit(1);
  if (existing[0]) return { created: false, alertId: existing[0].id };
  const [created] = await database.insert(monitoringAlerts).values(input).$returningId();
  await database.insert(auditEvents).values({
    organizationId: input.organizationId,
    eventType: "alert.created",
    resourceType: "monitoring_alert",
    resourceId: String(created.id),
    payload: { anomalyId: input.anomalyId, severity: input.severity },
  });
  return { created: true, alertId: created.id };
}

export async function listOpenAnomalySeverities(organizationId: number) {
  const database = await requireDb();
  const rows = await database.select({ severity: anomalyEvents.severity }).from(anomalyEvents)
    .where(and(eq(anomalyEvents.organizationId, organizationId), eq(anomalyEvents.status, "open")));
  return rows.map((row) => row.severity);
}

export async function createEcoScoreSnapshot(input: {
  organizationId: number;
  siteId?: number | null;
  score: number;
  components: Record<string, unknown>;
  calculationVersion: string;
  windowStart?: Date | null;
  windowEnd?: Date | null;
}) {
  const database = await requireDb();
  return (await database.insert(ecoScoreSnapshots).values({
    organizationId: input.organizationId,
    siteId: input.siteId ?? null,
    score: input.score,
    components: input.components,
    calculationVersion: input.calculationVersion,
    windowStart: input.windowStart ?? null,
    windowEnd: input.windowEnd ?? null,
  }).$returningId())[0];
}

export async function completeMonitoringRun(input: {
  organizationId: number;
  runKey: string;
  readingsScanned: number;
  qualityFindingsCreated: number;
  anomaliesCreated: number;
  alertsCreated: number;
  ecoScoresUpdated: number;
  summary: Record<string, unknown>;
}) {
  const database = await requireDb();
  await database.update(monitoringRuns).set({
    status: "completed",
    readingsScanned: input.readingsScanned,
    qualityFindingsCreated: input.qualityFindingsCreated,
    anomaliesCreated: input.anomaliesCreated,
    alertsCreated: input.alertsCreated,
    ecoScoresUpdated: input.ecoScoresUpdated,
    summary: input.summary,
    completedAt: new Date(),
  }).where(and(eq(monitoringRuns.organizationId, input.organizationId), eq(monitoringRuns.runKey, input.runKey)));
}

export async function failMonitoringRun(input: { organizationId: number; runKey: string; errorSummary: string }) {
  const database = await requireDb();
  await database.update(monitoringRuns).set({ status: "failed", errorSummary: input.errorSummary, completedAt: new Date() })
    .where(and(eq(monitoringRuns.organizationId, input.organizationId), eq(monitoringRuns.runKey, input.runKey)));
}

export async function getMonitoringStatus(organizationId: number) {
  const database = await requireDb();
  const [latestRun, latestScore, openAlerts] = await Promise.all([
    database.select().from(monitoringRuns).where(eq(monitoringRuns.organizationId, organizationId)).orderBy(desc(monitoringRuns.startedAt)).limit(1),
    database.select().from(ecoScoreSnapshots).where(eq(ecoScoreSnapshots.organizationId, organizationId)).orderBy(desc(ecoScoreSnapshots.computedAt)).limit(1),
    database.select({ value: count() }).from(monitoringAlerts).where(and(eq(monitoringAlerts.organizationId, organizationId), eq(monitoringAlerts.status, "open"))),
  ]);
  return { latestRun: latestRun[0] ?? null, latestScore: latestScore[0] ?? null, openAlertCount: Number(openAlerts[0]?.value ?? 0) };
}

export async function listEcoScoreHistory(organizationId: number, limit = 30) {
  const database = await requireDb();
  return database.select().from(ecoScoreSnapshots)
    .where(eq(ecoScoreSnapshots.organizationId, organizationId))
    .orderBy(desc(ecoScoreSnapshots.computedAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export async function getCarbonTotals(organizationId: number) {
  const database = await requireDb();
  const rows = await database.select({ totalKgCo2e: sum(carbonCalculations.emittedKgCo2e), calculationCount: count() })
    .from(carbonCalculations)
    .where(eq(carbonCalculations.organizationId, organizationId));
  return {
    totalKgCo2e: Number(rows[0]?.totalKgCo2e ?? 0),
    calculationCount: Number(rows[0]?.calculationCount ?? 0),
    factorLabel: "Pilot electricity factor: 0.82 kgCO2e/kWh; not a certified regional factor.",
  };
}

export async function listRecentMonitoringAlerts(organizationId: number) {
  const database = await requireDb();
  return database.select({ alert: monitoringAlerts, anomaly: anomalyEvents, meter: meters })
    .from(monitoringAlerts)
    .innerJoin(anomalyEvents, eq(monitoringAlerts.anomalyId, anomalyEvents.id))
    .innerJoin(meters, eq(anomalyEvents.meterId, meters.id))
    .where(eq(monitoringAlerts.organizationId, organizationId))
    .orderBy(desc(monitoringAlerts.createdAt))
    .limit(25);
}

export async function listRecentAnomalies(organizationId: number) {
  const database = await requireDb();
  return database.select({ anomaly: anomalyEvents, meter: meters })
    .from(anomalyEvents)
    .innerJoin(meters, eq(anomalyEvents.meterId, meters.id))
    .where(eq(anomalyEvents.organizationId, organizationId))
    .orderBy(desc(anomalyEvents.detectedAt))
    .limit(25);
}

export async function listRecentQualityFindings(organizationId: number) {
  const database = await requireDb();
  return database.select({ finding: dataQualityFindings, meter: meters })
    .from(dataQualityFindings)
    .innerJoin(meters, eq(dataQualityFindings.meterId, meters.id))
    .where(eq(dataQualityFindings.organizationId, organizationId))
    .orderBy(desc(dataQualityFindings.evaluatedAt))
    .limit(50);
}

export async function acknowledgeMonitoringAlert(input: { organizationId: number; alertId: number; userId: number }) {
  const database = await requireDb();
  const alert = await database.select().from(monitoringAlerts)
    .where(and(eq(monitoringAlerts.organizationId, input.organizationId), eq(monitoringAlerts.id, input.alertId))).limit(1);
  if (!alert[0]) return undefined;
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx.update(monitoringAlerts).set({ status: "acknowledged", acknowledgedByUserId: input.userId, acknowledgedAt: now })
      .where(eq(monitoringAlerts.id, input.alertId));
    await tx.update(anomalyEvents).set({ status: "acknowledged", acknowledgedAt: now })
      .where(eq(anomalyEvents.id, alert[0].anomalyId));
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "alert.acknowledged",
      resourceType: "monitoring_alert",
      resourceId: String(input.alertId),
      payload: { anomalyId: alert[0].anomalyId },
    });
  });
  return { id: input.alertId, status: "acknowledged" as const, acknowledgedAt: now };
}

export async function getMonitoringOverview(organizationId: number) {
  const [status, alerts, anomalies, qualityFindings, carbonTotals] = await Promise.all([
    getMonitoringStatus(organizationId),
    listRecentMonitoringAlerts(organizationId),
    listRecentAnomalies(organizationId),
    listRecentQualityFindings(organizationId),
    getCarbonTotals(organizationId),
  ]);
  return {
    status,
    alerts,
    anomalies,
    qualityFindings,
    carbonTotals,
    qualityWarnings: qualityFindings.filter((item) => item.finding.status === "warning").length,
    qualityFailures: qualityFindings.filter((item) => item.finding.status === "failed").length,
  };
}

export async function createSustainabilityAction(input: {
  organizationId: number;
  siteId?: number;
  title: string;
  description?: string;
  priority: (typeof import("../drizzle/schema").actionPriorities)[number];
  expectedCarbonReductionKg?: number;
  targetDate?: Date;
  userId: number;
}) {
  const database = await requireDb();
  return database.transaction(async (tx) => {
    const [created] = await tx
      .insert(sustainabilityActions)
      .values({
        organizationId: input.organizationId,
        siteId: input.siteId ?? null,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        ownerUserId: input.userId,
        expectedCarbonReductionKg: input.expectedCarbonReductionKg?.toFixed(4) ?? null,
        targetDate: input.targetDate ?? null,
      })
      .$returningId();
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "action.created",
      resourceType: "sustainability_action",
      resourceId: String(created.id),
      payload: { priority: input.priority, siteId: input.siteId ?? null },
    });
    return created;
  });
}

export async function listSustainabilityActions(organizationId: number) {
  const database = await requireDb();
  return database
    .select()
    .from(sustainabilityActions)
    .where(eq(sustainabilityActions.organizationId, organizationId))
    .orderBy(desc(sustainabilityActions.updatedAt))
    .limit(50);
}

export async function updateSustainabilityActionStatus(input: {
  organizationId: number;
  actionId: number;
  status: (typeof import("../drizzle/schema").actionStatuses)[number];
  userId: number;
}) {
  const database = await requireDb();
  const action = await database
    .select()
    .from(sustainabilityActions)
    .where(and(eq(sustainabilityActions.id, input.actionId), eq(sustainabilityActions.organizationId, input.organizationId)))
    .limit(1);
  if (!action[0]) return undefined;
  await database
    .update(sustainabilityActions)
    .set({ status: input.status, completedAt: input.status === "completed" ? new Date() : null })
    .where(eq(sustainabilityActions.id, input.actionId));
  await database.insert(auditEvents).values({
    organizationId: input.organizationId,
    actorUserId: input.userId,
    eventType: "action.status_changed",
    resourceType: "sustainability_action",
    resourceId: String(input.actionId),
    payload: { status: input.status },
  });
  return { id: input.actionId, status: input.status };
}

export async function getOperationsOverview(organizationId: number) {
  const database = await requireDb();
  const [siteTotal, meterTotal, readingTotal, actionTotal, activeActionTotal, latestReading] = await Promise.all([
    database.select({ value: count() }).from(sites).where(eq(sites.organizationId, organizationId)),
    database.select({ value: count() }).from(meters).where(eq(meters.organizationId, organizationId)),
    database.select({ value: count() }).from(sustainabilityReadings).where(eq(sustainabilityReadings.organizationId, organizationId)),
    database.select({ value: count() }).from(sustainabilityActions).where(eq(sustainabilityActions.organizationId, organizationId)),
    database.select({ value: count() }).from(sustainabilityActions).where(and(eq(sustainabilityActions.organizationId, organizationId), eq(sustainabilityActions.status, "in_progress"))),
    database.select().from(sustainabilityReadings).where(eq(sustainabilityReadings.organizationId, organizationId)).orderBy(desc(sustainabilityReadings.observedAt)).limit(1),
  ]);
  return {
    siteCount: Number(siteTotal[0]?.value ?? 0),
    meterCount: Number(meterTotal[0]?.value ?? 0),
    readingCount: Number(readingTotal[0]?.value ?? 0),
    actionCount: Number(actionTotal[0]?.value ?? 0),
    activeActionCount: Number(activeActionTotal[0]?.value ?? 0),
    latestReadingAt: latestReading[0]?.observedAt ?? null,
  };
}

export async function createSustainabilityScenario(input: {
  organizationId: number;
  siteId?: number;
  name: string;
  assumptions: ScenarioAssumptions;
  results: ScenarioResults;
  calculationVersion: string;
  userId: number;
}) {
  const database = await requireDb();
  return database.transaction(async (tx) => {
    const [created] = await tx
      .insert(sustainabilityScenarios)
      .values({
        organizationId: input.organizationId,
        siteId: input.siteId ?? null,
        name: input.name,
        assumptions: input.assumptions,
        results: input.results,
        calculationVersion: input.calculationVersion,
        createdByUserId: input.userId,
      })
      .$returningId();
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "scenario.saved",
      resourceType: "sustainability_scenario",
      resourceId: String(created.id),
      payload: { calculationVersion: input.calculationVersion, siteId: input.siteId ?? null },
    });
    return created;
  });
}

export async function listSustainabilityScenarios(organizationId: number) {
  const database = await requireDb();
  return database
    .select()
    .from(sustainabilityScenarios)
    .where(eq(sustainabilityScenarios.organizationId, organizationId))
    .orderBy(desc(sustainabilityScenarios.updatedAt))
    .limit(30);
}
