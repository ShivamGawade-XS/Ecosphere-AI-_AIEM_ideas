import { and, count, desc, eq, isNull, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  auditEvents,
  alertDeliveryAttempts,
  alertEscalationPolicies,
  alertEscalations,
  alertRoutingPreferences,
  anomalyEvents,
  carbonCalculations,
  dataImportFiles,
  dataImportRows,
  dataQualityFindings,
  ecoScoreSnapshots,
  emissionFactors,
  ingestionBatches,
  meters,
  monitoringAlerts,
  monitoringRecoveryEvents,
  monitoringRuns,
  monitoringServiceTargets,
  organizationMemberships,
  organizations,
  readingCorrections,
  sites,
  sustainabilityReadings,
  sustainabilityActions,
  sustainabilityActionComments,
  sustainabilityActionEvidence,
  sustainabilityForecasts,
  sustainabilityRecommendations,
  interventionComparisons,
  sustainabilityReportSnapshots,
  sustainabilityScenarios,
  type ScenarioAssumptions,
  type ScenarioResults,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { evaluateScheduledMonitoringHealth } from "./domain/monitoringOperations";
import { planRecoveryFailure, planRecoveryRetry, shouldResolveRecovery } from "./domain/recoveryLifecycle";
import { buildMovingAverageForecast, FORECAST_CALCULATION_VERSION } from "./domain/forecasting";
import { buildAnomalyRecommendation, RECOMMENDATION_VERSION } from "./domain/recommendations";
import { INTERVENTION_COMPARISON_VERSION, rankScenarioInterventions } from "./domain/interventionComparison";
import { materializeReportSnapshot } from "./domain/reportSnapshots";

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

export async function listOrganizationMembers(organizationId: number) {
  const database = await requireDb();
  return database
    .select({
      membership: organizationMemberships,
      user: { id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn },
    })
    .from(organizationMemberships)
    .innerJoin(users, eq(organizationMemberships.userId, users.id))
    .where(eq(organizationMemberships.organizationId, organizationId))
    .orderBy(organizationMemberships.createdAt);
}

export async function updateOrganizationMemberRole(input: {
  organizationId: number;
  memberUserId: number;
  role: "owner" | "manager" | "operator" | "viewer";
  actorUserId: number;
}) {
  const database = await requireDb();
  return database.transaction(async (tx) => {
    const [membership] = await tx
      .select()
      .from(organizationMemberships)
      .where(and(eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.userId, input.memberUserId)))
      .limit(1);

    if (!membership) return { status: "not_found" as const };
    if (membership.role === input.role) return { status: "unchanged" as const, membership };

    if (membership.role === "owner" && input.role !== "owner") {
      const [ownerCount] = await tx
        .select({ total: count() })
        .from(organizationMemberships)
        .where(and(eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.role, "owner")));
      if (Number(ownerCount?.total ?? 0) <= 1) return { status: "sole_owner_protected" as const, membership };
    }

    await tx
      .update(organizationMemberships)
      .set({ role: input.role })
      .where(eq(organizationMemberships.id, membership.id));
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      eventType: "membership.role_updated",
      resourceType: "organization_membership",
      resourceId: String(membership.id),
      payload: { memberUserId: input.memberUserId, previousRole: membership.role, nextRole: input.role },
    });

    return { status: "updated" as const, membership: { ...membership, role: input.role } };
  });
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

export async function createDataImportPreview(input: {
  organizationId: number;
  userId: number;
  fileName: string;
  contentType: string;
  storageKey: string;
  contentHash: string;
  idempotencyKey: string;
  byteSize: number;
  rows: Array<{
    rowNumber: number;
    rawRecord: Record<string, string>;
    meterKey: string | null;
    observedAt: Date | null;
    value: number | null;
    unit: string | null;
    status: "valid" | "rejected";
    validationErrors: string[];
  }>;
  validRows: number;
  rejectedRows: number;
  errorSummary: string | null;
}) {
  const database = await requireDb();
  const existing = await database.select().from(dataImportFiles)
    .where(and(eq(dataImportFiles.organizationId, input.organizationId), eq(dataImportFiles.idempotencyKey, input.idempotencyKey))).limit(1);
  if (existing[0]) return { importFile: existing[0], idempotent: true };
  return database.transaction(async (tx) => {
    const [created] = await tx.insert(dataImportFiles).values({
      organizationId: input.organizationId,
      uploadedByUserId: input.userId,
      fileName: input.fileName,
      contentType: input.contentType,
      storageKey: input.storageKey,
      contentHash: input.contentHash,
      idempotencyKey: input.idempotencyKey,
      byteSize: input.byteSize,
      status: "previewed",
      totalRows: input.rows.length,
      validRows: input.validRows,
      rejectedRows: input.rejectedRows,
      errorSummary: input.errorSummary,
      previewedAt: new Date(),
    }).$returningId();
    if (input.rows.length) {
      await tx.insert(dataImportRows).values(input.rows.map((row) => ({
        importFileId: created.id,
        organizationId: input.organizationId,
        rowNumber: row.rowNumber,
        rawRecord: row.rawRecord,
        meterKey: row.meterKey,
        observedAt: row.observedAt,
        value: row.value === null ? null : row.value.toFixed(4),
        unit: row.unit,
        status: row.status,
        validationErrors: row.validationErrors.length ? row.validationErrors : null,
      })));
    }
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "import.previewed",
      resourceType: "data_import_file",
      resourceId: String(created.id),
      payload: { fileName: input.fileName, validRows: input.validRows, rejectedRows: input.rejectedRows, contentHash: input.contentHash },
    });
    const [importFile] = await tx.select().from(dataImportFiles).where(eq(dataImportFiles.id, created.id)).limit(1);
    return { importFile, idempotent: false };
  });
}

export async function listDataImportFiles(organizationId: number) {
  const database = await requireDb();
  return database.select().from(dataImportFiles).where(eq(dataImportFiles.organizationId, organizationId)).orderBy(desc(dataImportFiles.createdAt)).limit(25);
}

export async function getDataImportFile(organizationId: number, importFileId: number) {
  const database = await requireDb();
  const rows = await database.select().from(dataImportFiles)
    .where(and(eq(dataImportFiles.organizationId, organizationId), eq(dataImportFiles.id, importFileId))).limit(1);
  return rows[0];
}

export async function getDataImportFileByKey(organizationId: number, idempotencyKey: string) {
  const database = await requireDb();
  const rows = await database.select().from(dataImportFiles)
    .where(and(eq(dataImportFiles.organizationId, organizationId), eq(dataImportFiles.idempotencyKey, idempotencyKey))).limit(1);
  return rows[0];
}

export async function listDataImportRows(organizationId: number, importFileId: number) {
  const database = await requireDb();
  return database.select().from(dataImportRows)
    .where(and(eq(dataImportRows.organizationId, organizationId), eq(dataImportRows.importFileId, importFileId)))
    .orderBy(dataImportRows.rowNumber).limit(5_000);
}

export async function getImportLineage(organizationId: number, importFileId: number) {
  const database = await requireDb();
  const importFile = await getDataImportFile(organizationId, importFileId);
  if (!importFile) return undefined;
  const rows = await database.select({ row: dataImportRows, reading: sustainabilityReadings, meter: meters })
    .from(dataImportRows)
    .leftJoin(sustainabilityReadings, eq(dataImportRows.readingId, sustainabilityReadings.id))
    .leftJoin(meters, eq(sustainabilityReadings.meterId, meters.id))
    .where(and(eq(dataImportRows.organizationId, organizationId), eq(dataImportRows.importFileId, importFileId)))
    .orderBy(dataImportRows.rowNumber).limit(5_000);
  return { importFile, rows };
}

export async function getReadingLineage(organizationId: number, readingId: number) {
  const database = await requireDb();
  const readingRows = await database.select({ reading: sustainabilityReadings, meter: meters })
    .from(sustainabilityReadings)
    .innerJoin(meters, eq(sustainabilityReadings.meterId, meters.id))
    .where(and(eq(sustainabilityReadings.organizationId, organizationId), eq(sustainabilityReadings.id, readingId))).limit(1);
  if (!readingRows[0]) return undefined;
  const corrections = await database.select().from(readingCorrections).where(and(
    eq(readingCorrections.organizationId, organizationId),
    eq(readingCorrections.originalReadingId, readingId),
  )).orderBy(desc(readingCorrections.createdAt)).limit(25);
  const appliedCorrection = await database.select().from(readingCorrections).where(and(
    eq(readingCorrections.organizationId, organizationId),
    eq(readingCorrections.correctedReadingId, readingId),
  )).orderBy(desc(readingCorrections.createdAt)).limit(1);
  return { ...readingRows[0], corrections, appliedCorrection: appliedCorrection[0] ?? null };
}

export async function commitDataImport(input: { organizationId: number; importFileId: number; userId: number }) {
  const database = await requireDb();
  const importFile = await getDataImportFile(input.organizationId, input.importFileId);
  if (!importFile) return undefined;
  if (importFile.ingestionBatchId) {
    return { importFileId: importFile.id, ingestionBatchId: importFile.ingestionBatchId, acceptedRows: importFile.validRows, rejectedRows: importFile.rejectedRows, idempotent: true };
  }
  const importRows = await listDataImportRows(input.organizationId, input.importFileId);
  const validRows = importRows.filter((row) => row.status === "valid" && row.meterKey && row.observedAt && row.value !== null && row.unit);
  const meterRows = await listMeters(input.organizationId);
  const meterByKey = new Map(meterRows.map((meter) => [meter.meterKey.toLowerCase(), meter]));
  return database.transaction(async (tx) => {
    const [batch] = await tx.insert(ingestionBatches).values({
      organizationId: input.organizationId,
      initiatedByUserId: input.userId,
      idempotencyKey: `csv-import:${input.importFileId}`,
      source: "csv",
      totalRows: importRows.length,
      acceptedRows: 0,
      rejectedRows: importFile.rejectedRows,
      payloadHash: importFile.contentHash,
    }).$returningId();
    let acceptedRows = 0;
    for (const row of validRows) {
      const meter = meterByKey.get(row.meterKey!.toLowerCase());
      if (!meter) continue;
      const [created] = await tx.insert(sustainabilityReadings).values({
        organizationId: input.organizationId,
        siteId: meter.siteId,
        meterId: meter.id,
        ingestionBatchId: batch.id,
        observedAt: row.observedAt!,
        value: Number(row.value).toFixed(4),
        unit: row.unit!,
        source: "csv",
        sourceReference: `${importFile.fileName}#${row.rowNumber}`,
        idempotencyKey: `csv:${input.importFileId}:${row.rowNumber}`,
        provenance: { importFileId: input.importFileId, importRowNumber: row.rowNumber, contentHash: importFile.contentHash, simulated: false },
      }).$returningId();
      await tx.update(dataImportRows).set({ status: "imported", readingId: created.id }).where(eq(dataImportRows.id, row.id));
      acceptedRows += 1;
    }
    const batchStatus = importFile.rejectedRows ? "completed_with_errors" : "completed";
    await tx.update(ingestionBatches).set({ status: batchStatus, acceptedRows, rejectedRows: importFile.rejectedRows, completedAt: new Date() }).where(eq(ingestionBatches.id, batch.id));
    await tx.update(dataImportFiles).set({ ingestionBatchId: batch.id, status: importFile.rejectedRows ? "completed_with_errors" : "committed", committedAt: new Date() }).where(eq(dataImportFiles.id, input.importFileId));
    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      eventType: "import.committed",
      resourceType: "data_import_file",
      resourceId: String(input.importFileId),
      payload: { ingestionBatchId: batch.id, acceptedRows, rejectedRows: importFile.rejectedRows },
    });
    return { importFileId: input.importFileId, ingestionBatchId: batch.id, acceptedRows, rejectedRows: importFile.rejectedRows, idempotent: false };
  });
}

export async function createEmissionFactor(input: {
  organizationId: number;
  resourceType: (typeof import("../drizzle/schema").resourceTypes)[number];
  inputUnit: string;
  emittedKgCo2ePerUnit: number;
  scope: string;
  geography: string;
  methodology: string;
  sourceName: string;
  sourceUrl?: string;
  factorVersion: string;
  validFrom: Date;
  validTo?: Date;
  userId: number;
}) {
  const database = await requireDb();
  const [created] = await database.insert(emissionFactors).values({
    organizationId: input.organizationId,
    resourceType: input.resourceType,
    inputUnit: input.inputUnit,
    emittedKgCo2ePerUnit: input.emittedKgCo2ePerUnit.toFixed(8),
    scope: input.scope,
    geography: input.geography,
    methodology: input.methodology,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl ?? null,
    factorVersion: input.factorVersion,
    validFrom: input.validFrom,
    validTo: input.validTo ?? null,
    status: "draft",
    createdByUserId: input.userId,
  }).$returningId();
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "factor.created", resourceType: "emission_factor", resourceId: String(created.id), payload: { factorVersion: input.factorVersion, resourceType: input.resourceType } });
  return created;
}

export async function approveEmissionFactor(input: { organizationId: number; factorId: number; userId: number }) {
  const database = await requireDb();
  const factor = await database.select().from(emissionFactors).where(and(eq(emissionFactors.organizationId, input.organizationId), eq(emissionFactors.id, input.factorId))).limit(1);
  if (!factor[0]) return undefined;
  const now = new Date();
  await database.update(emissionFactors).set({ status: "approved", approvedByUserId: input.userId, approvedAt: now }).where(eq(emissionFactors.id, input.factorId));
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "factor.approved", resourceType: "emission_factor", resourceId: String(input.factorId), payload: { factorVersion: factor[0].factorVersion } });
  return { id: input.factorId, status: "approved" as const, approvedAt: now };
}

export async function listEmissionFactors(organizationId: number) {
  const database = await requireDb();
  return database.select().from(emissionFactors).where(eq(emissionFactors.organizationId, organizationId)).orderBy(desc(emissionFactors.validFrom)).limit(100);
}

export async function listApprovedEmissionFactors(organizationId: number) {
  const factors = await listEmissionFactors(organizationId);
  return factors.filter((factor) => factor.status === "approved");
}

export async function createReadingCorrection(input: { organizationId: number; originalReadingId: number; value: number; observedAt: Date; reason: string; userId: number }) {
  const database = await requireDb();
  const original = await database.select().from(sustainabilityReadings).where(and(
    eq(sustainabilityReadings.organizationId, input.organizationId),
    eq(sustainabilityReadings.id, input.originalReadingId),
    isNull(sustainabilityReadings.supersededAt),
  )).limit(1);
  if (!original[0]) return undefined;
  const source = original[0];
  return database.transaction(async (tx) => {
    const now = new Date();
    const [corrected] = await tx.insert(sustainabilityReadings).values({
      organizationId: input.organizationId,
      siteId: source.siteId,
      meterId: source.meterId,
      observedAt: input.observedAt,
      value: input.value.toFixed(4),
      unit: source.unit,
      source: "api",
      sourceReference: `correction:${source.id}`,
      idempotencyKey: `correction:${source.id}:${now.getTime()}`,
      provenance: { correctionOfReadingId: source.id, reason: input.reason, originalSource: source.source, simulated: false },
    }).$returningId();
    const [correction] = await tx.insert(readingCorrections).values({
      organizationId: input.organizationId,
      originalReadingId: source.id,
      correctedReadingId: corrected.id,
      status: "approved",
      reason: input.reason,
      submittedByUserId: input.userId,
      approvedByUserId: input.userId,
      approvedAt: now,
    }).$returningId();
    await tx.update(sustainabilityReadings).set({ supersededAt: now }).where(eq(sustainabilityReadings.id, source.id));
    await tx.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "reading.corrected", resourceType: "sustainability_reading", resourceId: String(source.id), payload: { correctionId: correction.id, correctedReadingId: corrected.id, reason: input.reason } });
    return { correctionId: correction.id, correctedReadingId: corrected.id };
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
    .where(and(eq(sustainabilityReadings.organizationId, organizationId), isNull(sustainabilityReadings.supersededAt)))
    .orderBy(desc(sustainabilityReadings.observedAt))
    .limit(30);
}

export async function listReadingsForMonitoring(organizationId: number) {
  const database = await requireDb();
  return database
    .select({ reading: sustainabilityReadings, meter: meters })
    .from(sustainabilityReadings)
    .innerJoin(meters, eq(sustainabilityReadings.meterId, meters.id))
    .where(and(eq(sustainabilityReadings.organizationId, organizationId), isNull(sustainabilityReadings.supersededAt)))
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
    .where(and(eq(sustainabilityReadings.organizationId, organizationId), isNull(sustainabilityReadings.supersededAt), isNull(dataQualityFindings.id)))
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
    .innerJoin(sustainabilityReadings, eq(anomalyEvents.readingId, sustainabilityReadings.id))
    .where(and(eq(anomalyEvents.organizationId, organizationId), eq(anomalyEvents.status, "open"), isNull(sustainabilityReadings.supersededAt)));
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
  const retryRecovery = await database.select().from(monitoringRecoveryEvents)
    .where(and(eq(monitoringRecoveryEvents.organizationId, input.organizationId), eq(monitoringRecoveryEvents.retryRunKey, input.runKey), eq(monitoringRecoveryEvents.status, "retrying"))).limit(1);
  const failurePlan = planRecoveryFailure({ retryingRecoveryExists: Boolean(retryRecovery[0]), errorSummary: input.errorSummary });
  if (failurePlan.kind === "reopen" && retryRecovery[0]) {
    await database.update(monitoringRecoveryEvents).set({ status: "open", reason: failurePlan.reason, updatedAt: new Date() }).where(eq(monitoringRecoveryEvents.id, retryRecovery[0].id));
    return;
  }
  const run = await database.select({ id: monitoringRuns.id }).from(monitoringRuns)
    .where(and(eq(monitoringRuns.organizationId, input.organizationId), eq(monitoringRuns.runKey, input.runKey))).limit(1);
  await openMonitoringRecovery({ organizationId: input.organizationId, monitoringRunId: run[0]?.id ?? null, reason: failurePlan.reason });
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

export async function upsertMonitoringServiceTarget(input: {
  organizationId: number;
  expectedIntervalMinutes: number;
  staleAfterMinutes: number;
  isEnabled: boolean;
  userId: number;
}) {
  const database = await requireDb();
  await database.insert(monitoringServiceTargets).values({
    organizationId: input.organizationId,
    targetKey: "scheduled-monitoring",
    expectedIntervalMinutes: input.expectedIntervalMinutes,
    staleAfterMinutes: input.staleAfterMinutes,
    isEnabled: input.isEnabled,
    createdByUserId: input.userId,
  }).onDuplicateKeyUpdate({ set: { expectedIntervalMinutes: input.expectedIntervalMinutes, staleAfterMinutes: input.staleAfterMinutes, isEnabled: input.isEnabled, createdByUserId: input.userId, updatedAt: new Date() } });
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "monitoring.target_configured", resourceType: "monitoring_service_target", resourceId: "scheduled-monitoring", payload: { expectedIntervalMinutes: input.expectedIntervalMinutes, staleAfterMinutes: input.staleAfterMinutes, isEnabled: input.isEnabled } });
  return getMonitoringOperationalHealth(input.organizationId);
}

export async function getMonitoringOperationalHealth(organizationId: number, now = new Date()) {
  const database = await requireDb();
  const [targetRows, latestScheduledRun, openRecoveries] = await Promise.all([
    database.select().from(monitoringServiceTargets).where(and(eq(monitoringServiceTargets.organizationId, organizationId), eq(monitoringServiceTargets.targetKey, "scheduled-monitoring"))).limit(1),
    database.select().from(monitoringRuns).where(and(eq(monitoringRuns.organizationId, organizationId), eq(monitoringRuns.trigger, "scheduled"))).orderBy(desc(monitoringRuns.startedAt)).limit(1),
    database.select().from(monitoringRecoveryEvents).where(and(eq(monitoringRecoveryEvents.organizationId, organizationId), eq(monitoringRecoveryEvents.status, "open"))).orderBy(desc(monitoringRecoveryEvents.detectedAt)).limit(20),
  ]);
  const target = targetRows[0] ?? null;
  const latestRun = latestScheduledRun[0] ?? null;
  const health = evaluateScheduledMonitoringHealth({ target, latestRun, now });
  return { target, latestScheduledRun: latestRun, openRecoveries, ...health, checkedAt: now };
}

export async function openMonitoringRecovery(input: { organizationId: number; monitoringRunId?: number | null; reason: string }) {
  const database = await requireDb();
  const existing = await database.select().from(monitoringRecoveryEvents).where(and(
    eq(monitoringRecoveryEvents.organizationId, input.organizationId),
    eq(monitoringRecoveryEvents.status, "open"),
    input.monitoringRunId ? eq(monitoringRecoveryEvents.monitoringRunId, input.monitoringRunId) : isNull(monitoringRecoveryEvents.monitoringRunId),
  )).limit(1);
  if (existing[0]) return { event: existing[0], created: false };
  const [created] = await database.insert(monitoringRecoveryEvents).values({ organizationId: input.organizationId, monitoringRunId: input.monitoringRunId ?? null, reason: input.reason.slice(0, 500) }).$returningId();
  const [event] = await database.select().from(monitoringRecoveryEvents).where(eq(monitoringRecoveryEvents.id, created.id)).limit(1);
  return { event, created: true };
}

export async function markMonitoringRecoveryRetry(input: { organizationId: number; recoveryEventId: number; retryRunKey: string }) {
  const database = await requireDb();
  const event = await database.select().from(monitoringRecoveryEvents).where(and(eq(monitoringRecoveryEvents.organizationId, input.organizationId), eq(monitoringRecoveryEvents.id, input.recoveryEventId))).limit(1);
  if (!event[0]) return undefined;
  const retryPlan = planRecoveryRetry({ status: event[0].status, retryRunKey: event[0].retryRunKey, attemptCount: event[0].attemptCount, requestedRunKey: input.retryRunKey });
  if (retryPlan.kind === "unavailable") return undefined;
  if (retryPlan.kind === "reuse") return { id: input.recoveryEventId, status: "retrying" as const, attemptCount: retryPlan.attemptCount, retryRunKey: retryPlan.retryRunKey, started: false };
  await database.update(monitoringRecoveryEvents).set({ status: "retrying", retryRunKey: retryPlan.retryRunKey, attemptCount: retryPlan.attemptCount, updatedAt: new Date() }).where(eq(monitoringRecoveryEvents.id, input.recoveryEventId));
  return { id: input.recoveryEventId, status: "retrying" as const, attemptCount: retryPlan.attemptCount, retryRunKey: retryPlan.retryRunKey, started: true };
}

export async function resolveMonitoringRecoveryForRun(input: { organizationId: number; runKey: string }) {
  const database = await requireDb();
  const candidates = await database.select().from(monitoringRecoveryEvents)
    .where(and(eq(monitoringRecoveryEvents.organizationId, input.organizationId), eq(monitoringRecoveryEvents.retryRunKey, input.runKey), eq(monitoringRecoveryEvents.status, "retrying")));
  const now = new Date();
  for (const candidate of candidates) {
    if (shouldResolveRecovery({ status: candidate.status, retryRunKey: candidate.retryRunKey, completedRunKey: input.runKey })) {
      await database.update(monitoringRecoveryEvents).set({ status: "resolved", resolvedAt: now, updatedAt: now }).where(eq(monitoringRecoveryEvents.id, candidate.id));
    }
  }
}

export async function getAlertRoutingPreference(organizationId: number) {
  const database = await requireDb();
  const rows = await database.select().from(alertRoutingPreferences).where(and(eq(alertRoutingPreferences.organizationId, organizationId), eq(alertRoutingPreferences.channel, "owner_notification"))).limit(1);
  return rows[0] ?? null;
}

export async function upsertAlertRoutingPreference(input: { organizationId: number; minimumSeverity: (typeof import("../drizzle/schema").anomalySeverities)[number]; isEnabled: boolean; userId: number }) {
  const database = await requireDb();
  await database.insert(alertRoutingPreferences).values({ organizationId: input.organizationId, channel: "owner_notification", minimumSeverity: input.minimumSeverity, isEnabled: input.isEnabled, updatedByUserId: input.userId }).onDuplicateKeyUpdate({ set: { minimumSeverity: input.minimumSeverity, isEnabled: input.isEnabled, updatedByUserId: input.userId, updatedAt: new Date() } });
  const preference = await getAlertRoutingPreference(input.organizationId);
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "alert.routing_configured", resourceType: "alert_routing_preference", resourceId: preference ? String(preference.id) : null, payload: { channel: "owner_notification", minimumSeverity: input.minimumSeverity, isEnabled: input.isEnabled } });
  return preference;
}

export async function getAlertForDelivery(organizationId: number, alertId: number) {
  const database = await requireDb();
  const rows = await database.select().from(monitoringAlerts).where(and(eq(monitoringAlerts.organizationId, organizationId), eq(monitoringAlerts.id, alertId))).limit(1);
  return rows[0] ?? null;
}

export async function createAlertDeliveryAttempt(input: { organizationId: number; alertId: number; routingPreferenceId?: number | null; status: (typeof import("../drizzle/schema").alertDeliveryStatuses)[number]; errorSummary?: string | null; providerReference?: string | null }) {
  const database = await requireDb();
  const latest = await database.select({ attemptNumber: alertDeliveryAttempts.attemptNumber }).from(alertDeliveryAttempts).where(and(eq(alertDeliveryAttempts.alertId, input.alertId), eq(alertDeliveryAttempts.channel, "owner_notification"))).orderBy(desc(alertDeliveryAttempts.attemptNumber)).limit(1);
  const attemptNumber = (latest[0]?.attemptNumber ?? 0) + 1;
  const [created] = await database.insert(alertDeliveryAttempts).values({
    organizationId: input.organizationId,
    alertId: input.alertId,
    routingPreferenceId: input.routingPreferenceId ?? null,
    channel: "owner_notification",
    status: input.status,
    attemptNumber,
    errorSummary: input.errorSummary ?? null,
    providerReference: input.providerReference ?? null,
    deliveredAt: input.status === "delivered" ? new Date() : null,
  }).$returningId();
  return created;
}

export async function listAlertDeliveryAttempts(organizationId: number) {
  const database = await requireDb();
  return database.select({ attempt: alertDeliveryAttempts, alert: monitoringAlerts }).from(alertDeliveryAttempts)
    .innerJoin(monitoringAlerts, eq(alertDeliveryAttempts.alertId, monitoringAlerts.id))
    .where(eq(alertDeliveryAttempts.organizationId, organizationId)).orderBy(desc(alertDeliveryAttempts.requestedAt)).limit(50);
}

const escalationSeverityRank = { low: 1, medium: 2, high: 3, critical: 4 } as const;

export async function getAlertEscalationPolicy(organizationId: number) {
  const database = await requireDb();
  const rows = await database.select().from(alertEscalationPolicies).where(eq(alertEscalationPolicies.organizationId, organizationId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertAlertEscalationPolicy(input: { organizationId: number; minimumSeverity: (typeof import("../drizzle/schema").anomalySeverities)[number]; afterMinutes: number; isEnabled: boolean; userId: number }) {
  const database = await requireDb();
  await database.insert(alertEscalationPolicies).values({ organizationId: input.organizationId, minimumSeverity: input.minimumSeverity, afterMinutes: input.afterMinutes, isEnabled: input.isEnabled, updatedByUserId: input.userId }).onDuplicateKeyUpdate({ set: { minimumSeverity: input.minimumSeverity, afterMinutes: input.afterMinutes, isEnabled: input.isEnabled, updatedByUserId: input.userId, updatedAt: new Date() } });
  const policy = await getAlertEscalationPolicy(input.organizationId);
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "alert.escalation_configured", resourceType: "alert_escalation_policy", resourceId: policy ? String(policy.id) : null, payload: { minimumSeverity: input.minimumSeverity, afterMinutes: input.afterMinutes, isEnabled: input.isEnabled } });
  return policy;
}

export async function listAlertEscalations(organizationId: number) {
  const database = await requireDb();
  return database.select({ escalation: alertEscalations, alert: monitoringAlerts, action: sustainabilityActions }).from(alertEscalations)
    .innerJoin(monitoringAlerts, eq(alertEscalations.alertId, monitoringAlerts.id))
    .leftJoin(sustainabilityActions, eq(alertEscalations.actionId, sustainabilityActions.id))
    .where(eq(alertEscalations.organizationId, organizationId)).orderBy(desc(alertEscalations.createdAt)).limit(50);
}

export async function evaluateAlertEscalations(organizationId: number, now = new Date()) {
  const database = await requireDb();
  const policy = await getAlertEscalationPolicy(organizationId);
  if (!policy || !policy.isEnabled) return { policy, pendingCreated: 0, triggered: 0, suppressed: 0 };
  const [openAlerts, existing] = await Promise.all([
    database.select().from(monitoringAlerts).where(and(eq(monitoringAlerts.organizationId, organizationId), eq(monitoringAlerts.status, "open"))).orderBy(desc(monitoringAlerts.createdAt)).limit(100),
    database.select().from(alertEscalations).where(eq(alertEscalations.organizationId, organizationId)).limit(100),
  ]);
  const byAlertId = new Map(existing.map((item) => [item.alertId, item]));
  let pendingCreated = 0;
  let triggered = 0;
  let suppressed = 0;
  for (const alert of openAlerts) {
    let escalation = byAlertId.get(alert.id);
    if (!escalation) {
      const qualifies = escalationSeverityRank[alert.severity] >= escalationSeverityRank[policy.minimumSeverity];
      const dueAt = new Date(alert.createdAt.getTime() + policy.afterMinutes * 60_000);
      const [created] = await database.insert(alertEscalations).values({ organizationId, alertId: alert.id, policyId: policy.id, dueAt, status: qualifies ? "pending" : "suppressed", reason: qualifies ? `Awaiting ${policy.afterMinutes}-minute escalation threshold.` : `Severity ${alert.severity} is below escalation threshold ${policy.minimumSeverity}.` }).$returningId();
      const [createdEscalation] = await database.select().from(alertEscalations).where(eq(alertEscalations.id, created.id)).limit(1);
      escalation = createdEscalation;
      if (qualifies) pendingCreated += 1; else suppressed += 1;
    }
    if (escalation?.status === "pending" && escalation.dueAt <= now) {
      const [action] = await database.insert(sustainabilityActions).values({
        organizationId,
        title: `Escalated monitoring alert: ${alert.title}`.slice(0, 180),
        description: `Created by deterministic escalation policy after alert #${alert.id} remained open beyond ${policy.afterMinutes} minutes. Severity: ${alert.severity}. Evidence: ${alert.message}`,
        source: "monitoring_escalation",
        priority: alert.severity,
      }).$returningId();
      await database.update(alertEscalations).set({ status: "triggered", actionId: action.id, triggeredAt: now, updatedAt: now }).where(eq(alertEscalations.id, escalation.id));
      await database.insert(auditEvents).values({ organizationId, eventType: "alert.escalated", resourceType: "alert_escalation", resourceId: String(escalation.id), payload: { alertId: alert.id, actionId: action.id, policyId: policy.id } });
      triggered += 1;
    }
  }
  return { policy, pendingCreated, triggered, suppressed };
}

export async function resolveAlertEscalation(input: { organizationId: number; alertId: number; resolvedAt?: Date }) {
  const database = await requireDb();
  const resolvedAt = input.resolvedAt ?? new Date();
  await database.update(alertEscalations).set({ status: "resolved", resolvedAt, updatedAt: resolvedAt })
    .where(and(eq(alertEscalations.organizationId, input.organizationId), eq(alertEscalations.alertId, input.alertId), eq(alertEscalations.status, "pending")));
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
    await tx.update(alertEscalations).set({ status: "resolved", resolvedAt: now, updatedAt: now })
      .where(and(eq(alertEscalations.organizationId, input.organizationId), eq(alertEscalations.alertId, input.alertId), eq(alertEscalations.status, "pending")));
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
  scenarioId?: number;
  comparisonId?: number;
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
        scenarioId: input.scenarioId ?? null,
        comparisonId: input.comparisonId ?? null,
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
      payload: { priority: input.priority, siteId: input.siteId ?? null, scenarioId: input.scenarioId ?? null, comparisonId: input.comparisonId ?? null },
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

export async function listOrganizationAuditEvents(organizationId: number, limit = 100) {
  const database = await requireDb();
  return database.select({ event: auditEvents, actor: { id: users.id, name: users.name, email: users.email } })
    .from(auditEvents)
    .leftJoin(users, eq(auditEvents.actorUserId, users.id))
    .where(eq(auditEvents.organizationId, organizationId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
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

export async function generateSustainabilityForecast(input: { organizationId: number; meterId: number; horizonPoints: number; userId: number }) {
  const database = await requireDb();
  const meter = await getMeterById(input.organizationId, input.meterId);
  if (!meter) return undefined;
  const readings = await database.select({ observedAt: sustainabilityReadings.observedAt, value: sustainabilityReadings.value })
    .from(sustainabilityReadings)
    .where(and(eq(sustainabilityReadings.organizationId, input.organizationId), eq(sustainabilityReadings.meterId, input.meterId), isNull(sustainabilityReadings.supersededAt)))
    .orderBy(desc(sustainabilityReadings.observedAt)).limit(50);
  const forecast = buildMovingAverageForecast({ readings: readings.map((row) => ({ observedAt: row.observedAt, value: Number(row.value) })), horizonPoints: input.horizonPoints });
  const [created] = await database.insert(sustainabilityForecasts).values({
    organizationId: input.organizationId,
    siteId: meter.siteId,
    meterId: meter.id,
    method: forecast.method,
    status: forecast.status,
    horizonPoints: forecast.horizonPoints,
    inputReadingCount: forecast.inputReadingCount,
    forecast,
    backtest: forecast.backtest,
    calculationVersion: forecast.calculationVersion,
  }).$returningId();
  await database.insert(auditEvents).values({
    organizationId: input.organizationId,
    actorUserId: input.userId,
    eventType: "forecast.generated",
    resourceType: "sustainability_forecast",
    resourceId: String(created.id),
    payload: { meterId: input.meterId, status: forecast.status, inputReadingCount: forecast.inputReadingCount, calculationVersion: FORECAST_CALCULATION_VERSION },
  });
  return { id: created.id, meter, forecast };
}

export async function listSustainabilityForecasts(organizationId: number) {
  const database = await requireDb();
  return database.select({ forecast: sustainabilityForecasts, meter: meters })
    .from(sustainabilityForecasts)
    .innerJoin(meters, eq(sustainabilityForecasts.meterId, meters.id))
    .where(eq(sustainabilityForecasts.organizationId, organizationId))
    .orderBy(desc(sustainabilityForecasts.generatedAt)).limit(50);
}

export async function generateAnomalyRecommendations(input: { organizationId: number; userId?: number }) {
  const database = await requireDb();
  const anomalies = await database.select({ anomaly: anomalyEvents, meter: meters })
    .from(anomalyEvents)
    .innerJoin(meters, eq(anomalyEvents.meterId, meters.id))
    .where(and(eq(anomalyEvents.organizationId, input.organizationId), eq(anomalyEvents.status, "open")))
    .orderBy(desc(anomalyEvents.detectedAt)).limit(50);
  let created = 0;
  const recommendationIds: number[] = [];
  for (const item of anomalies) {
    const [qualityFindings, latestForecast, carbon, latestScenario, latestComparison] = await Promise.all([
      database.select({ status: dataQualityFindings.status }).from(dataQualityFindings).where(and(eq(dataQualityFindings.organizationId, input.organizationId), eq(dataQualityFindings.readingId, item.anomaly.readingId))).limit(20),
      database.select({ id: sustainabilityForecasts.id, status: sustainabilityForecasts.status, calculationVersion: sustainabilityForecasts.calculationVersion, inputReadingCount: sustainabilityForecasts.inputReadingCount }).from(sustainabilityForecasts).where(and(eq(sustainabilityForecasts.organizationId, input.organizationId), eq(sustainabilityForecasts.meterId, item.meter.id))).orderBy(desc(sustainabilityForecasts.generatedAt)).limit(1),
      database.select({ emissionFactor: carbonCalculations.emissionFactor, factorVersion: carbonCalculations.factorVersion, calculationVersion: carbonCalculations.calculationVersion }).from(carbonCalculations).where(and(eq(carbonCalculations.organizationId, input.organizationId), eq(carbonCalculations.readingId, item.anomaly.readingId))).orderBy(desc(carbonCalculations.computedAt)).limit(1),
      database.select({ id: sustainabilityScenarios.id, name: sustainabilityScenarios.name, calculationVersion: sustainabilityScenarios.calculationVersion, results: sustainabilityScenarios.results }).from(sustainabilityScenarios).where(and(eq(sustainabilityScenarios.organizationId, input.organizationId), eq(sustainabilityScenarios.siteId, item.anomaly.siteId))).orderBy(desc(sustainabilityScenarios.updatedAt)).limit(1),
      database.select({ id: interventionComparisons.id, name: interventionComparisons.name, scenarioIds: interventionComparisons.scenarioIds, rankingVersion: interventionComparisons.rankingVersion }).from(interventionComparisons).where(eq(interventionComparisons.organizationId, input.organizationId)).orderBy(desc(interventionComparisons.createdAt)).limit(20),
    ]);
    const recommendation = buildAnomalyRecommendation({
      anomalyId: item.anomaly.id,
      resourceType: item.meter.resourceType,
      meterName: item.meter.displayName,
      severity: item.anomaly.severity,
      baselineMean: Number(item.anomaly.baselineMean),
      observedValue: Number(item.anomaly.observedValue),
      zScore: Number(item.anomaly.zScore),
      detectedAt: item.anomaly.detectedAt,
      qualityStatuses: qualityFindings.map((finding) => finding.status),
      forecast: latestForecast[0] ?? null,
      carbon: carbon[0] ? { emittedKgCo2ePerUnit: Number(carbon[0].emissionFactor), factorVersion: carbon[0].factorVersion, calculationVersion: carbon[0].calculationVersion } : null,
      scenario: latestScenario[0] ? { id: latestScenario[0].id, name: latestScenario[0].name, calculationVersion: latestScenario[0].calculationVersion, carbonReductionKg: Number(latestScenario[0].results.carbonReductionKg) } : null,
      comparison: latestScenario[0] ? (() => { const match = latestComparison.find((comparison) => (comparison.scenarioIds as number[]).includes(latestScenario[0].id)); return match ? { id: match.id, name: match.name, rankingVersion: match.rankingVersion } : null; })() : null,
    });
    const existing = await database.select({ id: sustainabilityRecommendations.id }).from(sustainabilityRecommendations)
      .where(and(eq(sustainabilityRecommendations.anomalyId, item.anomaly.id), eq(sustainabilityRecommendations.recommendationVersion, RECOMMENDATION_VERSION))).limit(1);
    if (existing[0]) {
      recommendationIds.push(existing[0].id);
      continue;
    }
    const [row] = await database.insert(sustainabilityRecommendations).values({
      organizationId: input.organizationId,
      siteId: item.anomaly.siteId,
      anomalyId: item.anomaly.id,
      forecastId: latestForecast[0]?.id ?? null,
      priority: recommendation.priority,
      title: recommendation.title,
      rationale: recommendation.rationale,
      expectedImpact: recommendation.expectedImpact,
      evidence: recommendation.evidence,
      confidence: recommendation.confidence.toFixed(4),
      recommendationVersion: RECOMMENDATION_VERSION,
    }).$returningId();
    created += 1;
    recommendationIds.push(row.id);
    await database.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.userId ?? null,
      eventType: "recommendation.generated",
      resourceType: "sustainability_recommendation",
      resourceId: String(row.id),
      payload: { anomalyId: item.anomaly.id, recommendationVersion: RECOMMENDATION_VERSION, priority: recommendation.priority },
    });
  }
  return { created, recommendationIds };
}

export async function listSustainabilityRecommendations(organizationId: number) {
  const database = await requireDb();
  return database.select({ recommendation: sustainabilityRecommendations, anomaly: anomalyEvents, meter: meters, action: sustainabilityActions })
    .from(sustainabilityRecommendations)
    .leftJoin(anomalyEvents, eq(sustainabilityRecommendations.anomalyId, anomalyEvents.id))
    .leftJoin(meters, eq(anomalyEvents.meterId, meters.id))
    .leftJoin(sustainabilityActions, eq(sustainabilityRecommendations.actionId, sustainabilityActions.id))
    .where(eq(sustainabilityRecommendations.organizationId, organizationId))
    .orderBy(desc(sustainabilityRecommendations.updatedAt)).limit(50);
}

export async function updateSustainabilityRecommendationStatus(input: { organizationId: number; recommendationId: number; status: "accepted" | "dismissed" | "archived"; userId: number }) {
  const database = await requireDb();
  const recommendation = await database.select().from(sustainabilityRecommendations).where(and(
    eq(sustainabilityRecommendations.organizationId, input.organizationId),
    eq(sustainabilityRecommendations.id, input.recommendationId),
  )).limit(1);
  if (!recommendation[0]) return undefined;
  await database.update(sustainabilityRecommendations).set({ status: input.status }).where(eq(sustainabilityRecommendations.id, input.recommendationId));
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "recommendation.status_changed", resourceType: "sustainability_recommendation", resourceId: String(input.recommendationId), payload: { status: input.status } });
  return { id: input.recommendationId, status: input.status };
}

export async function acceptRecommendationAsAction(input: { organizationId: number; recommendationId: number; userId: number }) {
  const database = await requireDb();
  const recommendation = await database.select().from(sustainabilityRecommendations).where(and(
    eq(sustainabilityRecommendations.organizationId, input.organizationId),
    eq(sustainabilityRecommendations.id, input.recommendationId),
  )).limit(1);
  if (!recommendation[0]) return undefined;
  if (recommendation[0].actionId) return { actionId: recommendation[0].actionId, idempotent: true };
  const evidence = recommendation[0].evidence as { scenario?: { id?: number }; comparison?: { id?: number } };
  const scenarioId = typeof evidence.scenario?.id === "number" ? evidence.scenario.id : null;
  const comparisonId = typeof evidence.comparison?.id === "number" ? evidence.comparison.id : null;
  return database.transaction(async (tx) => {
    const [action] = await tx.insert(sustainabilityActions).values({
      organizationId: input.organizationId,
      siteId: recommendation[0].siteId,
      scenarioId,
      comparisonId,
      title: recommendation[0].title,
      description: recommendation[0].rationale,
      source: "recommendation",
      status: "proposed",
      priority: recommendation[0].priority,
      ownerUserId: input.userId,
    }).$returningId();
    await tx.update(sustainabilityRecommendations).set({ status: "accepted", actionId: action.id }).where(eq(sustainabilityRecommendations.id, input.recommendationId));
    await tx.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "recommendation.accepted_as_action", resourceType: "sustainability_recommendation", resourceId: String(input.recommendationId), payload: { actionId: action.id, scenarioId, comparisonId } });
    return { actionId: action.id, idempotent: false };
  });
}

async function getSustainabilityAction(organizationId: number, actionId: number) {
  const database = await requireDb();
  const actions = await database.select().from(sustainabilityActions).where(and(eq(sustainabilityActions.organizationId, organizationId), eq(sustainabilityActions.id, actionId))).limit(1);
  return actions[0];
}

export async function getActionCollaboration(organizationId: number, actionId: number) {
  const database = await requireDb();
  const action = await getSustainabilityAction(organizationId, actionId);
  if (!action) return undefined;
  const [comments, evidence] = await Promise.all([
    database.select({ comment: sustainabilityActionComments, author: users }).from(sustainabilityActionComments).innerJoin(users, eq(sustainabilityActionComments.authorUserId, users.id)).where(and(eq(sustainabilityActionComments.organizationId, organizationId), eq(sustainabilityActionComments.actionId, actionId))).orderBy(desc(sustainabilityActionComments.createdAt)).limit(100),
    database.select().from(sustainabilityActionEvidence).where(and(eq(sustainabilityActionEvidence.organizationId, organizationId), eq(sustainabilityActionEvidence.actionId, actionId))).orderBy(desc(sustainabilityActionEvidence.createdAt)).limit(100),
  ]);
  return { action, comments, evidence };
}

export async function addActionComment(input: { organizationId: number; actionId: number; body: string; userId: number }) {
  const database = await requireDb();
  const action = await getSustainabilityAction(input.organizationId, input.actionId);
  if (!action) return undefined;
  const [comment] = await database.insert(sustainabilityActionComments).values({ organizationId: input.organizationId, actionId: input.actionId, authorUserId: input.userId, body: input.body }).$returningId();
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "action.comment_added", resourceType: "sustainability_action", resourceId: String(input.actionId), payload: { commentId: comment.id } });
  return comment;
}

export async function addActionEvidence(input: { organizationId: number; actionId: number; type: "note" | "url" | "attachment"; label: string; reference: string; userId: number }) {
  const database = await requireDb();
  const action = await getSustainabilityAction(input.organizationId, input.actionId);
  if (!action) return undefined;
  const [evidence] = await database.insert(sustainabilityActionEvidence).values({ organizationId: input.organizationId, actionId: input.actionId, type: input.type, label: input.label, reference: input.reference, createdByUserId: input.userId }).$returningId();
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "action.evidence_added", resourceType: "sustainability_action", resourceId: String(input.actionId), payload: { evidenceId: evidence.id, type: input.type } });
  return evidence;
}

export async function createInterventionComparison(input: { organizationId: number; scenarioIds: number[]; name: string; userId: number }) {
  const database = await requireDb();
  const scenarios = await database.select().from(sustainabilityScenarios).where(eq(sustainabilityScenarios.organizationId, input.organizationId)).orderBy(desc(sustainabilityScenarios.updatedAt)).limit(100);
  const requested = new Set(input.scenarioIds);
  const selected = scenarios.filter((scenario) => requested.has(scenario.id));
  if (selected.length !== requested.size || selected.length < 2) return undefined;
  const results = rankScenarioInterventions(selected.map((scenario) => ({ id: scenario.id, name: scenario.name, assumptions: { investmentInr: scenario.assumptions.investmentInr }, results: scenario.results })));
  const [comparison] = await database.insert(interventionComparisons).values({ organizationId: input.organizationId, name: input.name, scenarioIds: input.scenarioIds, results, rankingVersion: INTERVENTION_COMPARISON_VERSION, createdByUserId: input.userId }).$returningId();
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "comparison.created", resourceType: "intervention_comparison", resourceId: String(comparison.id), payload: { scenarioIds: input.scenarioIds, rankingVersion: INTERVENTION_COMPARISON_VERSION } });
  return { id: comparison.id, results, rankingVersion: INTERVENTION_COMPARISON_VERSION };
}

export async function listInterventionComparisons(organizationId: number) {
  const database = await requireDb();
  return database.select().from(interventionComparisons).where(eq(interventionComparisons.organizationId, organizationId)).orderBy(desc(interventionComparisons.createdAt)).limit(30);
}

export async function createSustainabilityReportSnapshot(input: { organizationId: number; title: string; userId: number }) {
  const database = await requireDb();
  const [overview, monitoring, forecasts, recommendations, comparisons, approvedFactors] = await Promise.all([
    getOperationsOverview(input.organizationId),
    getMonitoringStatus(input.organizationId),
    listSustainabilityForecasts(input.organizationId),
    listSustainabilityRecommendations(input.organizationId),
    listInterventionComparisons(input.organizationId),
    listApprovedEmissionFactors(input.organizationId),
  ]);
  const { criteria, evidence, factorDisclosure } = materializeReportSnapshot({ organizationId: input.organizationId, generatedAt: new Date(), overview, monitoring, forecasts, recommendations, comparisons, approvedFactors });
  const [snapshot] = await database.insert(sustainabilityReportSnapshots).values({ organizationId: input.organizationId, title: input.title, criteria, evidence, factorDisclosure, generatedByUserId: input.userId }).$returningId();
  await database.insert(auditEvents).values({ organizationId: input.organizationId, actorUserId: input.userId, eventType: "report.snapshot_generated", resourceType: "sustainability_report_snapshot", resourceId: String(snapshot.id), payload: { evidenceVersion: criteria.version } });
  return { id: snapshot.id, criteria, evidence, factorDisclosure };
}

export async function listSustainabilityReportSnapshots(organizationId: number) {
  const database = await requireDb();
  return database.select().from(sustainabilityReportSnapshots).where(eq(sustainabilityReportSnapshots.organizationId, organizationId)).orderBy(desc(sustainabilityReportSnapshots.createdAt)).limit(30);
}
