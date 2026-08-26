import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const organizationRoles = ["owner", "manager", "operator", "viewer"] as const;
export const resourceTypes = ["energy", "water", "waste", "fuel", "renewable"] as const;
export const readingSources = ["manual", "csv", "api", "connector", "simulated"] as const;
export const iotDeviceStatuses = ["active", "suspended", "revoked", "decommissioned"] as const;
export const ingestionStatuses = ["processing", "completed", "completed_with_errors", "failed"] as const;
export const qualityStatuses = ["accepted", "flagged", "rejected"] as const;
export const actionStatuses = ["proposed", "in_progress", "completed", "archived"] as const;
export const actionPriorities = ["low", "medium", "high", "critical"] as const;
export const scenarioStatuses = ["draft", "saved", "archived"] as const;
export const qualityFindingStatuses = ["passed", "warning", "failed"] as const;
export const anomalySeverities = ["low", "medium", "high", "critical"] as const;
export const anomalyStatuses = ["open", "acknowledged", "resolved"] as const;
export const alertStatuses = ["open", "acknowledged", "resolved"] as const;
export const monitoringRunTriggers = ["manual", "scheduled", "cli"] as const;
export const monitoringRunStatuses = ["running", "completed", "failed", "skipped"] as const;
export const monitoringRecoveryStatuses = ["open", "retrying", "resolved"] as const;
export const schedulerTrialStatuses = ["draft", "active", "paused", "activation_failed"] as const;
export const alertDeliveryChannels = ["owner_notification"] as const;
export const alertDeliveryStatuses = ["queued", "delivered", "failed", "suppressed"] as const;
export const alertEscalationStatuses = ["pending", "triggered", "suppressed", "resolved"] as const;
export const dataImportFileStatuses = ["uploaded", "previewed", "committed", "completed_with_errors", "failed"] as const;
export const dataImportRowStatuses = ["valid", "rejected", "imported"] as const;
export const readingCorrectionStatuses = ["approved", "rejected"] as const;
export const emissionFactorStatuses = ["draft", "approved", "archived"] as const;
export const forecastMethods = ["moving_average_v1", "last_value_v1"] as const;
export const forecastStatuses = ["ready", "insufficient_data"] as const;
export const recommendationStatuses = ["proposed", "accepted", "dismissed", "archived"] as const;
export const actionEvidenceTypes = ["note", "url", "attachment"] as const;
export const reportSnapshotStatuses = ["generated", "archived"] as const;
export const demoSimulationStatuses = ["running", "spike_injected", "reset"] as const;
export const sustainabilityTargetTypes = ["energy", "water", "waste", "carbon", "ecoscore"] as const;
export const sustainabilityTargetStatuses = ["active", "archived"] as const;
export const operationalBaselineResourceTypes = ["energy", "water", "waste"] as const;
export const outcomeMeasurementStatuses = ["comparable", "simulated_evidence"] as const;

export type ScenarioAssumptions = {
  baselineEnergyKwh: number;
  baselineWaterM3: number;
  baselineWasteKg: number;
  energyReductionPct: number;
  renewableSharePct: number;
  waterReductionPct: number;
  wasteReductionPct: number;
  recyclingPct: number;
  investmentInr: number;
  baselineReference?: {
    baselineId: number;
    meterId: number;
    resourceType: "energy" | "water" | "waste";
    aggregateValue: number;
    unit: string;
    windowStart: string;
    windowEnd: string;
    includesSimulatedEvidence: boolean;
  };
};

export type ScenarioResults = {
  projectedEnergyKwh: number;
  projectedWaterM3: number;
  projectedWasteKg: number;
  baselineCarbonKg: number;
  projectedCarbonKg: number;
  carbonReductionKg: number;
  annualSavingsInr: number;
  roiPct: number | null;
  paybackYears: number | null;
  sdgImpact?: import("../server/domain/sdgImpact").SdgImpact;
};

export type OutcomeMeasurementResults = {
  modeledProjectedValue: number;
  modeledReductionValue: number;
  observedReductionValue: number;
  observedReductionPct: number | null;
  varianceFromModeledValue: number;
  disclosure: string;
};

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  sessionVersion: int("sessionVersion").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizations = mysqlTable(
  "organizations",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 96 }).notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const organizationMemberships = mysqlTable(
  "organization_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", organizationRoles).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_memberships_org_user_unique").on(table.organizationId, table.userId),
    index("organization_memberships_user_idx").on(table.userId),
  ],
);

export const sites = mysqlTable(
  "sites",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kolkata"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("sites_org_code_unique").on(table.organizationId, table.code),
    index("sites_org_idx").on(table.organizationId),
  ],
);

export const meters = mysqlTable(
  "meters",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
    meterKey: varchar("meterKey", { length: 96 }).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    resourceType: mysqlEnum("resourceType", resourceTypes).notNull(),
    canonicalUnit: varchar("canonicalUnit", { length: 24 }).notNull(),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("meters_org_key_unique").on(table.organizationId, table.meterKey),
    index("meters_site_idx").on(table.siteId),
  ],
);

/** Tenant-owned campus equipment inventory. Optional meter linkage is descriptive and does not assert live telemetry coverage. */
export const campusEquipmentAssets = mysqlTable(
  "campus_equipment_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
    meterId: int("meterId").references(() => meters.id, { onDelete: "set null" }),
    assetKey: varchar("assetKey", { length: 96 }).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    assetType: varchar("assetType", { length: 80 }).notNull(),
    locationDescription: varchar("locationDescription", { length: 240 }),
    lifecycleStatus: varchar("lifecycleStatus", { length: 32 }).notNull().default("active"),
    notes: text("notes"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("equipment_assets_org_key_unique").on(table.organizationId, table.assetKey),
    index("equipment_assets_org_status_idx").on(table.organizationId, table.lifecycleStatus),
    index("equipment_assets_site_idx").on(table.siteId),
    index("equipment_assets_meter_idx").on(table.meterId),
  ],
);

/** Registered gateway/device identity for a tenant-scoped telemetry source. */
export const iotDevices = mysqlTable(
  "iot_devices",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    deviceKey: varchar("deviceKey", { length: 96 }).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    credentialHash: varchar("credentialHash", { length: 128 }).notNull(),
    credentialVersion: int("credentialVersion").notNull().default(1),
    status: mysqlEnum("status", iotDeviceStatuses).notNull().default("active"),
    lastSeenAt: timestamp("lastSeenAt"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("iot_devices_org_key_unique").on(table.organizationId, table.deviceKey),
    index("iot_devices_meter_idx").on(table.meterId),
    index("iot_devices_org_status_idx").on(table.organizationId, table.status),
  ],
);

/** Immutable replay-detection evidence for accepted device telemetry messages. */
export const iotTelemetryReceipts = mysqlTable(
  "iot_telemetry_receipts",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    deviceId: int("deviceId").notNull().references(() => iotDevices.id, { onDelete: "cascade" }),
    readingId: int("readingId").notNull().references(() => sustainabilityReadings.id, { onDelete: "cascade" }),
    messageId: varchar("messageId", { length: 128 }).notNull(),
    observedAt: timestamp("observedAt").notNull(),
    payloadHash: varchar("payloadHash", { length: 128 }).notNull(),
    receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("iot_receipts_device_message_unique").on(table.deviceId, table.messageId),
    index("iot_receipts_org_received_idx").on(table.organizationId, table.receivedAt),
  ],
);

export const ingestionBatches = mysqlTable(
  "ingestion_batches",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    initiatedByUserId: int("initiatedByUserId").notNull().references(() => users.id),
    idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
    source: mysqlEnum("source", readingSources).notNull(),
    status: mysqlEnum("status", ingestionStatuses).notNull().default("processing"),
    totalRows: int("totalRows").notNull().default(0),
    acceptedRows: int("acceptedRows").notNull().default(0),
    rejectedRows: int("rejectedRows").notNull().default(0),
    payloadHash: varchar("payloadHash", { length: 128 }),
    errorSummary: text("errorSummary"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => [
    uniqueIndex("ingestion_batches_org_key_unique").on(table.organizationId, table.idempotencyKey),
    index("ingestion_batches_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

export const sustainabilityReadings = mysqlTable(
  "sustainability_readings",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    ingestionBatchId: int("ingestionBatchId").references(() => ingestionBatches.id, { onDelete: "set null" }),
    observedAt: timestamp("observedAt").notNull(),
    receivedAt: timestamp("receivedAt").defaultNow().notNull(),
    value: decimal("value", { precision: 16, scale: 4 }).notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
    source: mysqlEnum("source", readingSources).notNull(),
    sourceReference: varchar("sourceReference", { length: 160 }),
    idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull(),
    qualityStatus: mysqlEnum("qualityStatus", qualityStatuses).notNull().default("accepted"),
    qualityReason: varchar("qualityReason", { length: 320 }),
    provenance: json("provenance"),
    supersededAt: timestamp("supersededAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("readings_meter_key_unique").on(table.meterId, table.idempotencyKey),
    index("readings_org_observed_idx").on(table.organizationId, table.observedAt),
    index("readings_meter_observed_idx").on(table.meterId, table.observedAt),
  ],
);

/**
 * Tenant-scoped state for a clearly labelled, bounded AIEM demonstration.
 * Demo readings carry matching provenance and are reset separately from
 * operator-entered and connector evidence.
 */
export const demoSimulationSessions = mysqlTable(
  "demo_simulation_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    status: mysqlEnum("status", demoSimulationStatuses).notNull().default("running"),
    cycle: int("cycle").notNull().default(0),
    anchorObservedAt: timestamp("anchorObservedAt").notNull(),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    spikeInjectedAt: timestamp("spikeInjectedAt"),
    resetAt: timestamp("resetAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("demo_sessions_org_status_idx").on(table.organizationId, table.status),
    index("demo_sessions_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

/** A time-bounded, tenant- or site-scoped operational target. */
export const sustainabilityTargets = mysqlTable(
  "sustainability_targets",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    targetType: mysqlEnum("targetType", sustainabilityTargetTypes).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    targetValue: decimal("targetValue", { precision: 16, scale: 4 }).notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
    windowStart: timestamp("windowStart").notNull(),
    windowEnd: timestamp("windowEnd").notNull(),
    status: mysqlEnum("status", sustainabilityTargetStatuses).notNull().default("active"),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("targets_org_status_idx").on(table.organizationId, table.status),
    index("targets_org_window_idx").on(table.organizationId, table.windowStart, table.windowEnd),
    index("targets_site_idx").on(table.siteId),
  ],
);

/** A saved, meter-specific accepted-reading aggregate used as traceable scenario context. */
export const operationalBaselines = mysqlTable(
  "operational_baselines",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    resourceType: mysqlEnum("resourceType", operationalBaselineResourceTypes).notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
    aggregateValue: decimal("aggregateValue", { precision: 18, scale: 4 }).notNull(),
    readingCount: int("readingCount").notNull(),
    latestObservedAt: timestamp("latestObservedAt").notNull(),
    includesSimulatedEvidence: boolean("includesSimulatedEvidence").notNull().default(false),
    windowStart: timestamp("windowStart").notNull(),
    windowEnd: timestamp("windowEnd").notNull(),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("baselines_org_created_idx").on(table.organizationId, table.createdAt),
    index("baselines_org_meter_window_idx").on(table.organizationId, table.meterId, table.windowStart, table.windowEnd),
    index("baselines_site_idx").on(table.siteId),
  ],
);

/**
 * A locked before/after comparison for a completed action. It records only
 * comparable accepted-reading aggregates and their deterministic variance from
 * a saved scenario model; it does not establish a realized savings claim.
 */
export const outcomeMeasurements = mysqlTable(
  "outcome_measurements",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    actionId: int("actionId").notNull().references(() => sustainabilityActions.id, { onDelete: "cascade" }),
    scenarioId: int("scenarioId").notNull().references(() => sustainabilityScenarios.id, { onDelete: "cascade" }),
    baselineId: int("baselineId").notNull().references(() => operationalBaselines.id, { onDelete: "restrict" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "restrict" }),
    resourceType: mysqlEnum("resourceType", operationalBaselineResourceTypes).notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
    baselineValue: decimal("baselineValue", { precision: 18, scale: 4 }).notNull(),
    baselineReadingCount: int("baselineReadingCount").notNull(),
    baselineWindowStart: timestamp("baselineWindowStart").notNull(),
    baselineWindowEnd: timestamp("baselineWindowEnd").notNull(),
    outcomeValue: decimal("outcomeValue", { precision: 18, scale: 4 }).notNull(),
    outcomeReadingCount: int("outcomeReadingCount").notNull(),
    latestOutcomeObservedAt: timestamp("latestOutcomeObservedAt").notNull(),
    outcomeWindowStart: timestamp("outcomeWindowStart").notNull(),
    outcomeWindowEnd: timestamp("outcomeWindowEnd").notNull(),
    includesSimulatedEvidence: boolean("includesSimulatedEvidence").notNull().default(false),
    status: mysqlEnum("status", outcomeMeasurementStatuses).notNull(),
    results: json("results").$type<OutcomeMeasurementResults>().notNull(),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("outcome_measurements_action_unique").on(table.actionId),
    index("outcome_measurements_org_created_idx").on(table.organizationId, table.createdAt),
    index("outcome_measurements_org_meter_idx").on(table.organizationId, table.meterId),
  ],
);

/** Source file and deterministic parse/validation lifecycle for a controlled CSV import. */
export const dataImportFiles = mysqlTable(
  "data_import_files",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
    ingestionBatchId: int("ingestionBatchId").references(() => ingestionBatches.id, { onDelete: "set null" }),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    contentType: varchar("contentType", { length: 128 }).notNull().default("text/csv"),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    contentHash: varchar("contentHash", { length: 128 }).notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull(),
    byteSize: int("byteSize").notNull(),
    status: mysqlEnum("status", dataImportFileStatuses).notNull().default("uploaded"),
    totalRows: int("totalRows").notNull().default(0),
    validRows: int("validRows").notNull().default(0),
    rejectedRows: int("rejectedRows").notNull().default(0),
    errorSummary: text("errorSummary"),
    previewedAt: timestamp("previewedAt"),
    committedAt: timestamp("committedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("data_import_files_org_key_unique").on(table.organizationId, table.idempotencyKey),
    index("data_import_files_org_created_idx").on(table.organizationId, table.createdAt),
    index("data_import_files_batch_idx").on(table.ingestionBatchId),
  ],
);

/** Immutable row-level validation evidence for a CSV import. */
export const dataImportRows = mysqlTable(
  "data_import_rows",
  {
    id: int("id").autoincrement().primaryKey(),
    importFileId: int("importFileId").notNull().references(() => dataImportFiles.id, { onDelete: "cascade" }),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    rowNumber: int("rowNumber").notNull(),
    rawRecord: json("rawRecord").notNull(),
    meterKey: varchar("meterKey", { length: 96 }),
    observedAt: timestamp("observedAt"),
    value: decimal("value", { precision: 16, scale: 4 }),
    unit: varchar("unit", { length: 24 }),
    status: mysqlEnum("status", dataImportRowStatuses).notNull(),
    validationErrors: json("validationErrors"),
    readingId: int("readingId").references(() => sustainabilityReadings.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("data_import_rows_file_number_unique").on(table.importFileId, table.rowNumber),
    index("data_import_rows_org_status_idx").on(table.organizationId, table.status),
    index("data_import_rows_reading_idx").on(table.readingId),
  ],
);

/** Immutable correction lineage; original source readings are retained and superseded only after approval. */
export const readingCorrections = mysqlTable(
  "reading_corrections",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    originalReadingId: int("originalReadingId").notNull().references(() => sustainabilityReadings.id, { onDelete: "cascade" }),
    correctedReadingId: int("correctedReadingId").references(() => sustainabilityReadings.id, { onDelete: "set null" }),
    status: mysqlEnum("status", readingCorrectionStatuses).notNull().default("approved"),
    reason: varchar("reason", { length: 500 }).notNull(),
    submittedByUserId: int("submittedByUserId").notNull().references(() => users.id),
    approvedByUserId: int("approvedByUserId").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("reading_corrections_org_created_idx").on(table.organizationId, table.createdAt),
    index("reading_corrections_original_idx").on(table.originalReadingId),
    index("reading_corrections_corrected_idx").on(table.correctedReadingId),
  ],
);

/** Tenant-governed emissions factor record; only approved valid factors may drive production carbon calculations. */
export const emissionFactors = mysqlTable(
  "emission_factors",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    resourceType: mysqlEnum("resourceType", resourceTypes).notNull(),
    inputUnit: varchar("inputUnit", { length: 24 }).notNull(),
    emittedKgCo2ePerUnit: decimal("emittedKgCo2ePerUnit", { precision: 16, scale: 8 }).notNull(),
    scope: varchar("scope", { length: 48 }).notNull(),
    geography: varchar("geography", { length: 160 }).notNull(),
    methodology: varchar("methodology", { length: 240 }).notNull(),
    sourceName: varchar("sourceName", { length: 240 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 512 }),
    factorVersion: varchar("factorVersion", { length: 64 }).notNull(),
    validFrom: timestamp("validFrom").notNull(),
    validTo: timestamp("validTo"),
    status: mysqlEnum("status", emissionFactorStatuses).notNull().default("draft"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    approvedByUserId: int("approvedByUserId").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("emission_factors_org_version_unique").on(table.organizationId, table.factorVersion),
    index("emission_factors_org_status_idx").on(table.organizationId, table.status),
    index("emission_factors_lookup_idx").on(table.organizationId, table.resourceType, table.inputUnit, table.status, table.validFrom),
  ],
);

export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("eventType", { length: 96 }).notNull(),
    resourceType: varchar("resourceType", { length: 96 }).notNull(),
    resourceId: varchar("resourceId", { length: 96 }),
    payload: json("payload"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("audit_events_org_created_idx").on(table.organizationId, table.createdAt)],
);

/** Accountable sustainability intervention tracked against an organization and optional site. */
export const sustainabilityActions = mysqlTable(
  "sustainability_actions",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    source: varchar("source", { length: 48 }).notNull().default("manual"),
    scenarioId: int("scenarioId").references(() => sustainabilityScenarios.id, { onDelete: "set null" }),
    comparisonId: int("comparisonId").references(() => interventionComparisons.id, { onDelete: "set null" }),
    status: mysqlEnum("status", actionStatuses).notNull().default("proposed"),
    priority: mysqlEnum("priority", actionPriorities).notNull().default("medium"),
    ownerUserId: int("ownerUserId").references(() => users.id, { onDelete: "set null" }),
    expectedCarbonReductionKg: decimal("expectedCarbonReductionKg", { precision: 16, scale: 4 }),
    targetDate: timestamp("targetDate"),
    approvedByUserId: int("approvedByUserId").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approvedAt"),
    approvalNote: text("approvalNote"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("sustainability_actions_org_status_idx").on(table.organizationId, table.status),
    index("sustainability_actions_site_idx").on(table.siteId),
    index("sustainability_actions_scenario_idx").on(table.scenarioId),
    index("sustainability_actions_comparison_idx").on(table.comparisonId),
  ],
);

/** Per-user read state for notifications deterministically derived from existing tenant evidence. */
export const userNotificationStates = mysqlTable(
  "user_notification_states",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    notificationKey: varchar("notificationKey", { length: 160 }).notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_states_org_user_key_unique").on(table.organizationId, table.userId, table.notificationKey),
    index("notification_states_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

/** Saved, reproducible What-If calculation with its full assumptions and server-owned output. */
export const sustainabilityScenarios = mysqlTable(
  "sustainability_scenarios",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    name: varchar("name", { length: 180 }).notNull(),
    status: mysqlEnum("status", scenarioStatuses).notNull().default("saved"),
    assumptions: json("assumptions").$type<ScenarioAssumptions>().notNull(),
    results: json("results").$type<ScenarioResults>().notNull(),
    calculationVersion: varchar("calculationVersion", { length: 32 }).notNull().default("v1"),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("sustainability_scenarios_org_updated_idx").on(table.organizationId, table.updatedAt),
    index("sustainability_scenarios_site_idx").on(table.siteId),
  ],
);

/** Deterministic quality-rule outcomes for a persisted source reading. */
export const dataQualityFindings = mysqlTable(
  "data_quality_findings",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    readingId: int("readingId").notNull().references(() => sustainabilityReadings.id, { onDelete: "cascade" }),
    ruleId: varchar("ruleId", { length: 96 }).notNull(),
    status: mysqlEnum("status", qualityFindingStatuses).notNull(),
    message: varchar("message", { length: 320 }).notNull(),
    details: json("details"),
    evaluationVersion: varchar("evaluationVersion", { length: 32 }).notNull(),
    evaluatedAt: timestamp("evaluatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("quality_findings_reading_rule_version_unique").on(table.readingId, table.ruleId, table.evaluationVersion),
    index("quality_findings_org_evaluated_idx").on(table.organizationId, table.evaluatedAt),
    index("quality_findings_meter_idx").on(table.meterId),
  ],
);

/** Versioned prospective validation policy. Existing findings remain historical evidence under their recorded rule context. */
export const dataQualityRuleProfiles = mysqlTable(
  "data_quality_rule_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    resourceType: mysqlEnum("resourceType", resourceTypes).notNull(),
    highValueCeiling: decimal("highValueCeiling", { precision: 16, scale: 4 }).notNull(),
    futureToleranceMinutes: int("futureToleranceMinutes").notNull().default(5),
    version: int("version").notNull().default(1),
    updatedByUserId: int("updatedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("data_quality_rules_org_resource_unique").on(table.organizationId, table.resourceType), index("data_quality_rules_org_updated_idx").on(table.organizationId, table.updatedAt)],
);

/** Carbon output derived from a source reading and a versioned pilot factor. */
export const carbonCalculations = mysqlTable(
  "carbon_calculations",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    readingId: int("readingId").notNull().references(() => sustainabilityReadings.id, { onDelete: "cascade" }),
    emittedKgCo2e: decimal("emittedKgCo2e", { precision: 16, scale: 4 }).notNull(),
    emissionFactor: decimal("emissionFactor", { precision: 16, scale: 6 }).notNull(),
    factorVersion: varchar("factorVersion", { length: 48 }).notNull(),
    calculationVersion: varchar("calculationVersion", { length: 32 }).notNull(),
    computedAt: timestamp("computedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("carbon_calculations_reading_version_unique").on(table.readingId, table.calculationVersion),
    index("carbon_calculations_org_computed_idx").on(table.organizationId, table.computedAt),
    index("carbon_calculations_meter_idx").on(table.meterId),
  ],
);

/** Persisted evidence of a statistically unusual but quality-accepted reading. */
export const anomalyEvents = mysqlTable(
  "anomaly_events",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").notNull().references(() => sites.id, { onDelete: "cascade" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    readingId: int("readingId").notNull().references(() => sustainabilityReadings.id, { onDelete: "cascade" }),
    detectorVersion: varchar("detectorVersion", { length: 32 }).notNull(),
    severity: mysqlEnum("severity", anomalySeverities).notNull(),
    status: mysqlEnum("status", anomalyStatuses).notNull().default("open"),
    baselineMean: decimal("baselineMean", { precision: 16, scale: 4 }).notNull(),
    baselineStdDev: decimal("baselineStdDev", { precision: 16, scale: 4 }).notNull(),
    observedValue: decimal("observedValue", { precision: 16, scale: 4 }).notNull(),
    zScore: decimal("zScore", { precision: 12, scale: 4 }).notNull(),
    evidence: json("evidence"),
    alertSuppressedByMaintenanceWindowId: int("alertSuppressedByMaintenanceWindowId"),
    detectedAt: timestamp("detectedAt").defaultNow().notNull(),
    acknowledgedAt: timestamp("acknowledgedAt"),
    resolvedAt: timestamp("resolvedAt"),
  },
  (table) => [
    uniqueIndex("anomaly_events_reading_detector_unique").on(table.readingId, table.detectorVersion),
    index("anomaly_events_org_status_idx").on(table.organizationId, table.status),
    index("anomaly_events_meter_detected_idx").on(table.meterId, table.detectedAt),
  ],
);

/** Time-bounded planned work for a single meter. It suppresses matching alert creation but never removes source or anomaly evidence. */
export const maintenanceWindows = mysqlTable(
  "maintenance_windows",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    reason: text("reason").notNull(),
    windowStart: timestamp("windowStart").notNull(),
    windowEnd: timestamp("windowEnd").notNull(),
    cancelledAt: timestamp("cancelledAt"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("maintenance_windows_org_meter_time_idx").on(table.organizationId, table.meterId, table.windowStart, table.windowEnd)],
);

/** Explicit local operating intervals used only to partition anomaly baselines; they never suppress source, quality, carbon, or score evidence. */
export const operatingCalendarWindows = mysqlTable(
  "operating_calendar_windows",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull(),
    weekdays: json("weekdays").$type<number[]>().notNull(),
    startMinuteLocal: int("startMinuteLocal").notNull(),
    endMinuteLocal: int("endMinuteLocal").notNull(),
    isActive: boolean("isActive").notNull().default(true),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("operating_calendar_org_meter_active_idx").on(table.organizationId, table.meterId, table.isActive)],
);

/** Actionable alert generated from a persisted anomaly event. */
export const monitoringAlerts = mysqlTable(
  "monitoring_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    anomalyId: int("anomalyId").notNull().references(() => anomalyEvents.id, { onDelete: "cascade" }),
    severity: mysqlEnum("severity", anomalySeverities).notNull(),
    status: mysqlEnum("status", alertStatuses).notNull().default("open"),
    title: varchar("title", { length: 180 }).notNull(),
    message: text("message").notNull(),
    acknowledgedByUserId: int("acknowledgedByUserId").references(() => users.id, { onDelete: "set null" }),
    acknowledgedAt: timestamp("acknowledgedAt"),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("monitoring_alerts_anomaly_unique").on(table.anomalyId),
    index("monitoring_alerts_org_status_idx").on(table.organizationId, table.status),
  ],
);

/** Transparent 0–100 operational score derived from persisted monitoring evidence. */
export const ecoScoreSnapshots = mysqlTable(
  "eco_score_snapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    score: int("score").notNull(),
    components: json("components").notNull(),
    calculationVersion: varchar("calculationVersion", { length: 32 }).notNull(),
    windowStart: timestamp("windowStart"),
    windowEnd: timestamp("windowEnd"),
    computedAt: timestamp("computedAt").defaultNow().notNull(),
  },
  (table) => [
    index("eco_scores_org_computed_idx").on(table.organizationId, table.computedAt),
    index("eco_scores_site_computed_idx").on(table.siteId, table.computedAt),
  ],
);

/** Durable, idempotent execution record for an organization’s monitoring cycle. */
export const monitoringRuns = mysqlTable(
  "monitoring_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    runKey: varchar("runKey", { length: 160 }).notNull(),
    trigger: mysqlEnum("trigger", monitoringRunTriggers).notNull(),
    status: mysqlEnum("status", monitoringRunStatuses).notNull().default("running"),
    readingsScanned: int("readingsScanned").notNull().default(0),
    qualityFindingsCreated: int("qualityFindingsCreated").notNull().default(0),
    anomaliesCreated: int("anomaliesCreated").notNull().default(0),
    alertsCreated: int("alertsCreated").notNull().default(0),
    ecoScoresUpdated: int("ecoScoresUpdated").notNull().default(0),
    summary: json("summary"),
    errorSummary: text("errorSummary"),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => [
    uniqueIndex("monitoring_runs_org_key_unique").on(table.organizationId, table.runKey),
    index("monitoring_runs_org_started_idx").on(table.organizationId, table.startedAt),
  ],
);

/** Expected cadence and stale threshold for the deployed scheduled monitoring callback. */
export const monitoringServiceTargets = mysqlTable(
  "monitoring_service_targets",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    targetKey: varchar("targetKey", { length: 64 }).notNull().default("scheduled-monitoring"),
    expectedIntervalMinutes: int("expectedIntervalMinutes").notNull().default(15),
    staleAfterMinutes: int("staleAfterMinutes").notNull().default(45),
    isEnabled: boolean("isEnabled").notNull().default(false),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    scheduleCronExpression: varchar("scheduleCronExpression", { length: 64 }),
    schedulerTrialStatus: mysqlEnum("schedulerTrialStatus", schedulerTrialStatuses).notNull().default("draft"),
    schedulerTrialLastRequestedAt: timestamp("schedulerTrialLastRequestedAt"),
    schedulerTrialLastError: varchar("schedulerTrialLastError", { length: 500 }),
    schedulerTrialUpdatedByUserId: int("schedulerTrialUpdatedByUserId").references(() => users.id, { onDelete: "set null" }),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("monitoring_targets_org_key_unique").on(table.organizationId, table.targetKey), uniqueIndex("monitoring_targets_task_uid_unique").on(table.scheduleCronTaskUid)],
);

/** A durable incident/recovery record for failed or stale monitoring work. */
export const monitoringRecoveryEvents = mysqlTable(
  "monitoring_recovery_events",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    monitoringRunId: int("monitoringRunId").references(() => monitoringRuns.id, { onDelete: "set null" }),
    status: mysqlEnum("status", monitoringRecoveryStatuses).notNull().default("open"),
    reason: varchar("reason", { length: 500 }).notNull(),
    retryRunKey: varchar("retryRunKey", { length: 160 }),
    attemptCount: int("attemptCount").notNull().default(0),
    detectedAt: timestamp("detectedAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("monitoring_recovery_org_status_idx").on(table.organizationId, table.status), index("monitoring_recovery_run_idx").on(table.monitoringRunId)],
);

/** Organization policy for the owner-facing alert channel; disabled until a manager explicitly enables it. */
export const alertRoutingPreferences = mysqlTable(
  "alert_routing_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    channel: mysqlEnum("channel", alertDeliveryChannels).notNull().default("owner_notification"),
    minimumSeverity: mysqlEnum("minimumSeverity", anomalySeverities).notNull().default("high"),
    isEnabled: boolean("isEnabled").notNull().default(false),
    updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("alert_routing_org_channel_unique").on(table.organizationId, table.channel)],
);

/** Delivery evidence for each channel decision—successful, failed, queued, or deliberately suppressed. */
export const alertDeliveryAttempts = mysqlTable(
  "alert_delivery_attempts",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    alertId: int("alertId").notNull().references(() => monitoringAlerts.id, { onDelete: "cascade" }),
    routingPreferenceId: int("routingPreferenceId").references(() => alertRoutingPreferences.id, { onDelete: "set null" }),
    channel: mysqlEnum("channel", alertDeliveryChannels).notNull(),
    status: mysqlEnum("status", alertDeliveryStatuses).notNull().default("queued"),
    attemptNumber: int("attemptNumber").notNull().default(1),
    errorSummary: varchar("errorSummary", { length: 500 }),
    providerReference: varchar("providerReference", { length: 160 }),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    deliveredAt: timestamp("deliveredAt"),
  },
  (table) => [uniqueIndex("alert_delivery_alert_channel_attempt_unique").on(table.alertId, table.channel, table.attemptNumber), index("alert_delivery_org_requested_idx").on(table.organizationId, table.requestedAt), index("alert_delivery_alert_idx").on(table.alertId)],
);

/** Organization policy for escalating persistent high-severity monitoring alerts into accountable work. */
export const alertEscalationPolicies = mysqlTable(
  "alert_escalation_policies",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    minimumSeverity: mysqlEnum("minimumSeverity", anomalySeverities).notNull().default("critical"),
    afterMinutes: int("afterMinutes").notNull().default(60),
    isEnabled: boolean("isEnabled").notNull().default(false),
    updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("alert_escalation_policy_org_unique").on(table.organizationId)],
);

/** Immutable lifecycle record for an alert escalated into an accountable sustainability action. */
export const alertEscalations = mysqlTable(
  "alert_escalations",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    alertId: int("alertId").notNull().references(() => monitoringAlerts.id, { onDelete: "cascade" }),
    policyId: int("policyId").references(() => alertEscalationPolicies.id, { onDelete: "set null" }),
    actionId: int("actionId").references(() => sustainabilityActions.id, { onDelete: "set null" }),
    status: mysqlEnum("status", alertEscalationStatuses).notNull().default("pending"),
    dueAt: timestamp("dueAt").notNull(),
    triggeredAt: timestamp("triggeredAt"),
    resolvedAt: timestamp("resolvedAt"),
    reason: varchar("reason", { length: 500 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("alert_escalations_alert_unique").on(table.alertId), index("alert_escalations_org_status_due_idx").on(table.organizationId, table.status, table.dueAt), index("alert_escalations_action_idx").on(table.actionId)],
);

/** Versioned short-horizon forecast derived only from active persisted meter readings. */
export const sustainabilityForecasts = mysqlTable(
  "sustainability_forecasts",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    meterId: int("meterId").notNull().references(() => meters.id, { onDelete: "cascade" }),
    method: mysqlEnum("method", forecastMethods).notNull(),
    status: mysqlEnum("status", forecastStatuses).notNull(),
    horizonPoints: int("horizonPoints").notNull(),
    inputReadingCount: int("inputReadingCount").notNull(),
    forecast: json("forecast").notNull(),
    backtest: json("backtest"),
    calculationVersion: varchar("calculationVersion", { length: 64 }).notNull(),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("forecasts_org_generated_idx").on(table.organizationId, table.generatedAt),
    index("forecasts_meter_generated_idx").on(table.meterId, table.generatedAt),
  ],
);

/** Recommendation record preserving the deterministic evidence IDs and values that justify it. */
export const sustainabilityRecommendations = mysqlTable(
  "sustainability_recommendations",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    siteId: int("siteId").references(() => sites.id, { onDelete: "set null" }),
    anomalyId: int("anomalyId").references(() => anomalyEvents.id, { onDelete: "set null" }),
    forecastId: int("forecastId").references(() => sustainabilityForecasts.id, { onDelete: "set null" }),
    actionId: int("actionId").references(() => sustainabilityActions.id, { onDelete: "set null" }),
    status: mysqlEnum("status", recommendationStatuses).notNull().default("proposed"),
    priority: mysqlEnum("priority", actionPriorities).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    rationale: text("rationale").notNull(),
    expectedImpact: json("expectedImpact").notNull(),
    evidence: json("evidence").notNull(),
    confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
    recommendationVersion: varchar("recommendationVersion", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("recommendations_anomaly_version_unique").on(table.anomalyId, table.recommendationVersion),
    index("recommendations_org_status_idx").on(table.organizationId, table.status),
    index("recommendations_anomaly_idx").on(table.anomalyId),
    index("recommendations_forecast_idx").on(table.forecastId),
  ],
);

/** Human collaboration note attached to an accountable sustainability action. */
export const sustainabilityActionComments = mysqlTable(
  "sustainability_action_comments",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    actionId: int("actionId").notNull().references(() => sustainabilityActions.id, { onDelete: "cascade" }),
    authorUserId: int("authorUserId").notNull().references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("action_comments_action_created_idx").on(table.actionId, table.createdAt),
    index("action_comments_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

/** Evidence reference for action completion; file bytes remain in managed object storage, never this table. */
export const sustainabilityActionEvidence = mysqlTable(
  "sustainability_action_evidence",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    actionId: int("actionId").notNull().references(() => sustainabilityActions.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", actionEvidenceTypes).notNull(),
    label: varchar("label", { length: 240 }).notNull(),
    reference: varchar("reference", { length: 1024 }).notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("action_evidence_action_created_idx").on(table.actionId, table.createdAt),
    index("action_evidence_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

/** Immutable persisted ranking output for a selected deterministic intervention set. */
export const interventionComparisons = mysqlTable(
  "intervention_comparisons",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    scenarioIds: json("scenarioIds").notNull(),
    results: json("results").notNull(),
    rankingVersion: varchar("rankingVersion", { length: 64 }).notNull(),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("comparisons_org_created_idx").on(table.organizationId, table.createdAt)],
);

/** Report snapshot preserves its selection criteria, evidence, and factor disclosure at generation time. */
export const sustainabilityReportSnapshots = mysqlTable(
  "sustainability_report_snapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    status: mysqlEnum("status", reportSnapshotStatuses).notNull().default("generated"),
    criteria: json("criteria").notNull(),
    evidence: json("evidence").notNull(),
    factorDisclosure: text("factorDisclosure").notNull(),
    generatedByUserId: int("generatedByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("report_snapshots_org_created_idx").on(table.organizationId, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type Meter = typeof meters.$inferSelect;
export type SustainabilityReading = typeof sustainabilityReadings.$inferSelect;
export type SustainabilityAction = typeof sustainabilityActions.$inferSelect;
export type SustainabilityScenario = typeof sustainabilityScenarios.$inferSelect;
export type DataQualityFinding = typeof dataQualityFindings.$inferSelect;
export type CarbonCalculation = typeof carbonCalculations.$inferSelect;
export type AnomalyEvent = typeof anomalyEvents.$inferSelect;
export type MonitoringAlert = typeof monitoringAlerts.$inferSelect;
export type EcoScoreSnapshot = typeof ecoScoreSnapshots.$inferSelect;
export type MonitoringRun = typeof monitoringRuns.$inferSelect;
export type MonitoringServiceTarget = typeof monitoringServiceTargets.$inferSelect;
export type MonitoringRecoveryEvent = typeof monitoringRecoveryEvents.$inferSelect;
export type AlertRoutingPreference = typeof alertRoutingPreferences.$inferSelect;
export type AlertDeliveryAttempt = typeof alertDeliveryAttempts.$inferSelect;
export type AlertEscalationPolicy = typeof alertEscalationPolicies.$inferSelect;
export type AlertEscalation = typeof alertEscalations.$inferSelect;
export type DataImportFile = typeof dataImportFiles.$inferSelect;
export type DataImportRow = typeof dataImportRows.$inferSelect;
export type ReadingCorrection = typeof readingCorrections.$inferSelect;
export type EmissionFactor = typeof emissionFactors.$inferSelect;
export type OperationalBaseline = typeof operationalBaselines.$inferSelect;
export type SustainabilityForecast = typeof sustainabilityForecasts.$inferSelect;
export type SustainabilityRecommendation = typeof sustainabilityRecommendations.$inferSelect;
export type SustainabilityActionComment = typeof sustainabilityActionComments.$inferSelect;
export type SustainabilityActionEvidence = typeof sustainabilityActionEvidence.$inferSelect;
export type InterventionComparison = typeof interventionComparisons.$inferSelect;
export type SustainabilityReportSnapshot = typeof sustainabilityReportSnapshots.$inferSelect;
