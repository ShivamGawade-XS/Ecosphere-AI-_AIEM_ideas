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
};

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("readings_meter_key_unique").on(table.meterId, table.idempotencyKey),
    index("readings_org_observed_idx").on(table.organizationId, table.observedAt),
    index("readings_meter_observed_idx").on(table.meterId, table.observedAt),
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
    status: mysqlEnum("status", actionStatuses).notNull().default("proposed"),
    priority: mysqlEnum("priority", actionPriorities).notNull().default("medium"),
    ownerUserId: int("ownerUserId").references(() => users.id, { onDelete: "set null" }),
    expectedCarbonReductionKg: decimal("expectedCarbonReductionKg", { precision: 16, scale: 4 }),
    targetDate: timestamp("targetDate"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("sustainability_actions_org_status_idx").on(table.organizationId, table.status),
    index("sustainability_actions_site_idx").on(table.siteId),
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
