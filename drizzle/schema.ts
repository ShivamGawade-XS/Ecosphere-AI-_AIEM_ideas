import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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

export const campuses = mysqlTable("campuses", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  mode: mysqlEnum("mode", ["demo", "live"]).default("demo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("campuses_slug_unique").on(table.slug)]);

export const telemetry = mysqlTable("telemetry", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  metric: mysqlEnum("metric", ["energy", "water", "waste", "carbon"]).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  isSimulated: boolean("isSimulated").default(true).notNull(),
  metadata: text("metadata"),
  capturedAt: timestamp("capturedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("telemetry_campus_metric_captured_idx").on(table.campusId, table.metric, table.capturedAt)]);

export const sustainabilityAlerts = mysqlTable("sustainabilityAlerts", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  metric: mysqlEnum("metric", ["energy", "water", "waste", "carbon"]).notNull(),
  observedValue: decimal("observedValue", { precision: 12, scale: 2 }).notNull(),
  threshold: decimal("threshold", { precision: 12, scale: 2 }).notNull(),
  recommendedAction: text("recommendedAction").notNull(),
  isSimulated: boolean("isSimulated").default(true).notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  lastNotifiedAt: timestamp("lastNotifiedAt"),
}, table => [index("alerts_campus_status_idx").on(table.campusId, table.status)]);

export const dataSources = mysqlTable("dataSources", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["csv", "sensor", "api"]).notNull(),
  status: mysqlEnum("status", ["ready", "connected", "paused"]).default("ready").notNull(),
  approved: boolean("approved").default(false).notNull(),
  fieldMapping: text("fieldMapping"),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("sources_campus_idx").on(table.campusId)]);

export const monitoringSettings = mysqlTable("monitoringSettings", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  highSeverityNotifications: boolean("highSeverityNotifications").default(true).notNull(),
  scheduleMinutes: int("scheduleMinutes").default(15).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastScheduleCheckAt: timestamp("lastScheduleCheckAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("monitoring_settings_campus_unique").on(table.campusId), index("monitoring_settings_task_idx").on(table.scheduleCronTaskUid)]);

export const sustainabilityScenarios = mysqlTable("sustainabilityScenarios", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  energyReductionPct: decimal("energyReductionPct", { precision: 5, scale: 2 }).notNull(),
  waterReductionPct: decimal("waterReductionPct", { precision: 5, scale: 2 }).notNull(),
  wasteDiversionPct: decimal("wasteDiversionPct", { precision: 5, scale: 2 }).notNull(),
  projectedCo2Kg: decimal("projectedCo2Kg", { precision: 12, scale: 2 }).notNull(),
  projectedSavingsInr: decimal("projectedSavingsInr", { precision: 12, scale: 2 }).notNull(),
  isSimulated: boolean("isSimulated").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("scenarios_campus_idx").on(table.campusId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
