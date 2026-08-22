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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type Meter = typeof meters.$inferSelect;
export type SustainabilityReading = typeof sustainabilityReadings.$inferSelect;
