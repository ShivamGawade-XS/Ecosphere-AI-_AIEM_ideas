import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { getDb, getOrganizationIdForScheduleTaskUid } from "../db";
import { runMonitoringForOrganization } from "../workers/monitoringWorker";
import { createContext } from "./context";
import { createLivenessPayload, createReadinessResponse } from "./health";
import { operationalRequestTelemetry } from "./observability";
import { registerOAuthRoutes } from "./oauth";
import { securityHeadersMiddleware } from "./security";
import { sdk } from "./sdk";
import { registerStorageProxy } from "./storageProxy";
import { resolveVercelCron } from "./vercelCron";

/**
 * Builds the complete HTTP application without binding a port. This lets the
 * same routes run under the local Node server and a Vercel Node.js Function.
 */
export function createApplication() {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeadersMiddleware(process.env.NODE_ENV === "production"));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(operationalRequestTelemetry());
  app.get("/healthz", (_req, res) => res.status(200).json(createLivenessPayload()));
  app.get("/readyz", async (_req, res) => {
    const database = await getDb();
    const readiness = createReadinessResponse(Boolean(database));
    return res.status(readiness.status).json(readiness.body);
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.all("/api/scheduled/monitoring", async (req, res) => {
    try {
      const vercelCron = resolveVercelCron({
        authorization: req.header("authorization"),
        cronSecret: process.env.CRON_SECRET,
        organizationId: process.env.VERCEL_CRON_ORGANIZATION_ID,
      });
      if (vercelCron.state === "misconfigured") {
        return res.status(503).json({ ok: false, error: "vercel-cron-misconfigured" });
      }
      if (vercelCron.state === "rejected") {
        return res.status(403).json({ ok: false, error: "cron-only" });
      }

      let organizationId: number;
      let scheduler: "managed" | "vercel";
      let taskUid: string | undefined;
      if (vercelCron.state === "authorized") {
        organizationId = vercelCron.organizationId;
        scheduler = "vercel";
      } else {
        const user = await sdk.authenticateRequest(req);
        if (!user.isCron || !user.taskUid) {
          return res.status(403).json({ ok: false, error: "cron-only" });
        }
        const resolvedOrganizationId = await getOrganizationIdForScheduleTaskUid(user.taskUid);
        if (!resolvedOrganizationId) return res.json({ ok: true, taskUid: user.taskUid, skipped: "orphan" });
        organizationId = resolvedOrganizationId;
        scheduler = "managed";
        taskUid = user.taskUid;
      }
      const minuteBucket = Math.floor(Date.now() / 60_000);
      const result = await runMonitoringForOrganization({
        organizationId,
        runKey: `scheduled:${scheduler}:${taskUid ?? organizationId}:${minuteBucket}`,
        trigger: "scheduled",
      });
      if (result.status === "failed") {
        return res.status(500).json({ ok: false, scheduler, taskUid, organizationId, result });
      }
      return res.json({ ok: true, scheduler, taskUid, organizationId, result });
    } catch (_error) {
      return res.status(500).json({
        ok: false,
        error: "scheduled-monitoring-failed",
        context: { path: "/api/scheduled/monitoring" },
        timestamp: new Date().toISOString(),
      });
    }
  });
  return app;
}
