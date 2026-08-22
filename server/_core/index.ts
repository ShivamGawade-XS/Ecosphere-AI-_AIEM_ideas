import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { serveStatic, setupVite } from "./vite";
import { runMonitoringForOrganization } from "../workers/monitoringWorker";
import { getDb, getOrganizationIdForScheduleTaskUid } from "../db";
import { createLivenessPayload, createReadinessResponse } from "./health";
import { operationalRequestTelemetry } from "./observability";
import { securityHeadersMiddleware } from "./security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  const server = createServer(app);
  app.use(securityHeadersMiddleware(process.env.NODE_ENV === "production"));
  // Configure body parser with larger size limit for file uploads
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
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.post("/api/scheduled/monitoring", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ ok: false, error: "cron-only" });
      }
      const organizationId = await getOrganizationIdForScheduleTaskUid(user.taskUid);
      if (!organizationId) return res.json({ ok: true, taskUid: user.taskUid, skipped: "orphan" });
      const minuteBucket = Math.floor(Date.now() / 60_000);
      const result = await runMonitoringForOrganization({
        organizationId,
        runKey: `scheduled:${user.taskUid}:${minuteBucket}`,
        trigger: "scheduled",
      });
      if (result.status === "failed") {
        return res.status(500).json({ ok: false, taskUid: user.taskUid, organizationId, result });
      }
      return res.json({ ok: true, taskUid: user.taskUid, organizationId, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scheduled monitoring error";
      return res.status(500).json({
        ok: false,
        error: message,
        context: { path: "/api/scheduled/monitoring" },
        timestamp: new Date().toISOString(),
      });
    }
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
