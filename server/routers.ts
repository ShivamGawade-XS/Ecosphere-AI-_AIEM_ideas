import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { actionPriorities, actionStatuses, readingSources, resourceTypes } from "../drizzle/schema";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import { calculateScenario, SCENARIO_CALCULATION_VERSION } from "./domain/scenarios";
import { runMonitoringForOrganization } from "./workers/monitoringWorker";

const mutableRoles = ["owner", "manager", "operator"] as const;
const scenarioAssumptionsSchema = z.object({
  baselineEnergyKwh: z.number().finite().nonnegative().max(999_999_999),
  baselineWaterM3: z.number().finite().nonnegative().max(999_999_999),
  baselineWasteKg: z.number().finite().nonnegative().max(999_999_999),
  energyReductionPct: z.number().finite().min(0).max(100),
  renewableSharePct: z.number().finite().min(0).max(100),
  waterReductionPct: z.number().finite().min(0).max(100),
  wasteReductionPct: z.number().finite().min(0).max(100),
  recyclingPct: z.number().finite().min(0).max(100),
  investmentInr: z.number().finite().nonnegative().max(999_999_999),
});

async function requireOrganizationRole(userId: number, organizationId: number, acceptedRoles?: readonly string[]) {
  const membership = await db.getOrganizationMembership(userId, organizationId);
  if (!membership || (acceptedRoles && !acceptedRoles.includes(membership.role))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this organization." });
  }
  return membership;
}

const readinessItems = [
  { id: "architecture", title: "Service-oriented migration plan", status: "complete", area: "Architecture", evidence: "Documented service boundaries, ownership, deployment topology, and extraction sequence." },
  { id: "identity", title: "Authenticated platform foundation", status: "complete", area: "Security", evidence: "OAuth-backed user context and protected procedures are enabled." },
  { id: "tenancy", title: "Organization and role boundaries", status: "complete", area: "Security", evidence: "Organization memberships and server-side role checks scope protected APIs." },
  { id: "ingestion", title: "Validated meter reading ingestion", status: "complete", area: "Data", evidence: "Authenticated, idempotent reading ingestion persists unit, source, time, and provenance." },
  { id: "registry", title: "Site and meter registry", status: "complete", area: "Data", evidence: "Tenant-scoped sites and meters define canonical resource units before ingest." },
  { id: "audit", title: "Audit evidence", status: "complete", area: "Governance", evidence: "Core creation and ingestion actions create append-only audit events." },
  { id: "scenarios", title: "Server-authoritative scenario engine", status: "in_progress", area: "Product", evidence: "Public prototype has transparent local modeling; authoritative persisted scenarios are next." },
  { id: "analytics", title: "Monitoring, anomaly, carbon, and EcoScore worker", status: "in_progress", area: "Reliability", evidence: "Deterministic browser-independent worker, idempotent runs, quality checks, anomaly events, alerts, carbon calculations, and EcoScore snapshots are implemented; deployed scheduling remains a release task." },
  { id: "notifications", title: "Alert delivery and escalation", status: "planned", area: "Operations", evidence: "Requires notification preferences, event routing, delivery records, and incident ownership." },
  { id: "observability", title: "Production telemetry and service objectives", status: "planned", area: "Operations", evidence: "Requires structured logs, traces, metrics, dashboards, alerts, and recovery drills." },
  { id: "assurance", title: "Automated release quality gates", status: "in_progress", area: "Quality", evidence: "Core tests are being introduced; integration, E2E, accessibility, performance, and security gates remain." },
] as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  organizations: router({
    mine: protectedProcedure.query(({ ctx }) => db.listOrganizationsForUser(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(3).max(160) }))
      .mutation(({ ctx, input }) => db.createOrganizationForUser({ userId: ctx.user.id, name: input.name })),
  }),

  sites: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listSites(input.organizationId);
      }),
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number().int().positive(),
        name: z.string().trim().min(3).max(160),
        code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,64}$/),
        timezone: z.string().trim().min(3).max(64).default("Asia/Kolkata"),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        return db.createSite({ ...input, userId: ctx.user.id });
      }),
  }),

  meters: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive(), siteId: z.number().int().positive().optional() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listMeters(input.organizationId, input.siteId);
      }),
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number().int().positive(),
        siteId: z.number().int().positive(),
        meterKey: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,96}$/),
        displayName: z.string().trim().min(3).max(160),
        resourceType: z.enum(resourceTypes),
        canonicalUnit: z.string().trim().min(1).max(24),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        const site = (await db.listSites(input.organizationId)).find((item) => item.id === input.siteId);
        if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found in this organization." });
        return db.createMeter({ ...input, userId: ctx.user.id });
      }),
  }),

  readings: router({
    ingest: protectedProcedure
      .input(z.object({
        organizationId: z.number().int().positive(),
        siteId: z.number().int().positive(),
        meterId: z.number().int().positive(),
        observedAt: z.date(),
        value: z.number().finite().nonnegative().max(999_999_999),
        unit: z.string().trim().min(1).max(24),
        source: z.enum(readingSources).default("api"),
        idempotencyKey: z.string().trim().min(8).max(160),
        sourceReference: z.string().trim().max(160).optional(),
        provenance: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        if (input.observedAt.getTime() > Date.now() + 10 * 60 * 1000) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Observed time cannot be more than ten minutes in the future." });
        }
        const meter = await db.getMeterById(input.organizationId, input.meterId);
        if (!meter || meter.siteId !== input.siteId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Active meter not found in the selected site." });
        }
        if (meter.canonicalUnit.toLowerCase() !== input.unit.toLowerCase()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Unit must match the meter canonical unit (${meter.canonicalUnit}).` });
        }
        return db.ingestReading({ ...input, userId: ctx.user.id });
      }),
    recent: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listRecentReadings(input.organizationId);
      }),
  }),

  ingestion: router({
    recent: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listIngestionBatches(input.organizationId);
      }),
  }),

  operations: router({
    overview: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.getOperationsOverview(input.organizationId);
      }),
  }),

  monitoring: router({
    status: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.getMonitoringStatus(input.organizationId);
      }),
    runOnce: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive(), runKey: z.string().trim().min(8).max(160).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        const runKey = input.runKey ?? `manual:${input.organizationId}:${ctx.user.id}:${Date.now()}`;
        return runMonitoringForOrganization({ organizationId: input.organizationId, runKey, trigger: "manual" });
      }),
  }),

  analytics: router({
    overview: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.getMonitoringOverview(input.organizationId);
      }),
    anomalies: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listRecentAnomalies(input.organizationId);
      }),
    qualityFindings: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listRecentQualityFindings(input.organizationId);
      }),
    ecoScoreHistory: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive(), limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listEcoScoreHistory(input.organizationId, input.limit);
      }),
  }),

  alerts: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listRecentMonitoringAlerts(input.organizationId);
      }),
    acknowledge: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive(), alertId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        const result = await db.acknowledgeMonitoringAlert({ ...input, userId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Alert not found in this organization." });
        return result;
      }),
  }),

  actions: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listSustainabilityActions(input.organizationId);
      }),
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number().int().positive(),
        siteId: z.number().int().positive().optional(),
        title: z.string().trim().min(3).max(180),
        description: z.string().trim().max(5_000).optional(),
        priority: z.enum(actionPriorities).default("medium"),
        expectedCarbonReductionKg: z.number().finite().nonnegative().max(999_999_999).optional(),
        targetDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        if (input.siteId) {
          const site = (await db.listSites(input.organizationId)).find((item) => item.id === input.siteId);
          if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found in this organization." });
        }
        return db.createSustainabilityAction({ ...input, userId: ctx.user.id });
      }),
    updateStatus: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive(), actionId: z.number().int().positive(), status: z.enum(actionStatuses) }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        const result = await db.updateSustainabilityActionStatus({ ...input, userId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Action not found in this organization." });
        return result;
      }),
  }),

  intelligence: router({
    readiness: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        const [overview, monitoring] = await Promise.all([
          db.getOperationsOverview(input.organizationId),
          db.getMonitoringStatus(input.organizationId),
        ]);
        return {
          overview,
          pipeline: [
            { id: "registry", label: "Meter registry", state: overview.meterCount > 0 ? "ready" : "blocked", evidence: `${overview.meterCount} registered meter${overview.meterCount === 1 ? "" : "s"}` },
            { id: "readings", label: "Validated readings", state: overview.readingCount > 0 ? "ready" : "waiting", evidence: `${overview.readingCount} persisted reading${overview.readingCount === 1 ? "" : "s"}` },
            { id: "analytics", label: "Deterministic monitoring and anomaly pipeline", state: monitoring.latestRun ? "ready" : "waiting", evidence: monitoring.latestRun ? `Latest run: ${monitoring.latestRun.status}; ${monitoring.openAlertCount} open alert${monitoring.openAlertCount === 1 ? "" : "s"}.` : "Awaiting a manual or scheduled monitoring run." },
            { id: "forecast", label: "Forecasting", state: "planned", evidence: "Forecasting is not yet implemented; the current EcoScore is not a forecast." },
            { id: "recommendations", label: "Evidence-linked recommendations", state: "planned", evidence: "Recommendation explanations remain planned; no LLM is invoked by the monitoring worker." },
          ] as const,
        };
      }),
  }),

  reports: router({
    summary: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        const [overview, recentBatches] = await Promise.all([db.getOperationsOverview(input.organizationId), db.listIngestionBatches(input.organizationId)]);
        return { overview, recentBatches };
      }),
  }),

  scenarios: router({
    preview: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive(), assumptions: scenarioAssumptionsSchema }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return { results: calculateScenario(input.assumptions), calculationVersion: SCENARIO_CALCULATION_VERSION };
      }),
    save: protectedProcedure
      .input(z.object({
        organizationId: z.number().int().positive(),
        siteId: z.number().int().positive().optional(),
        name: z.string().trim().min(3).max(180),
        assumptions: scenarioAssumptionsSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId, mutableRoles);
        if (input.siteId) {
          const site = (await db.listSites(input.organizationId)).find((item) => item.id === input.siteId);
          if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found in this organization." });
        }
        const results = calculateScenario(input.assumptions);
        const scenario = await db.createSustainabilityScenario({ ...input, results, calculationVersion: SCENARIO_CALCULATION_VERSION, userId: ctx.user.id });
        return { scenario, results, calculationVersion: SCENARIO_CALCULATION_VERSION };
      }),
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOrganizationRole(ctx.user.id, input.organizationId);
        return db.listSustainabilityScenarios(input.organizationId);
      }),
  }),

  implementation: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const organizations = await db.listOrganizationsForUser(ctx.user.id);
      const complete = readinessItems.filter((item) => item.status === "complete").length;
      return {
        updatedAt: new Date(),
        summary: {
          total: readinessItems.length,
          complete,
          inProgress: readinessItems.filter((item) => item.status === "in_progress").length,
          planned: readinessItems.filter((item) => item.status === "planned").length,
          organizationCount: organizations.length,
        },
        items: readinessItems,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
