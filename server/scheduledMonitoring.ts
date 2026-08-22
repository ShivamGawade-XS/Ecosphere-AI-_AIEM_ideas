import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { runScheduledMonitoring } from "./sustainability";

export async function scheduledMonitoringHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await runScheduledMonitoring(user.taskUid);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduled monitoring error";
    console.error("[EcoSphere Scheduled Monitoring]", error);
    return res.status(500).json({ error: message, timestamp: new Date().toISOString(), context: { path: req.path } });
  }
}
