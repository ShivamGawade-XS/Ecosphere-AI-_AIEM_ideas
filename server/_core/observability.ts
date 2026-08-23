import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

type RequestTelemetryInput = {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp?: Date;
};

export function buildRequestTelemetry(input: RequestTelemetryInput) {
  return {
    event: "http.request.completed",
    requestId: input.requestId,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    timestamp: (input.timestamp ?? new Date()).toISOString(),
  };
}

/** Emits route-level operational telemetry only. Never include query strings, request bodies, headers, or raw errors. */
export function operationalRequestTelemetry(): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      const entry = buildRequestTelemetry({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: performance.now() - startedAt,
      });
      const write = res.statusCode >= 500 ? console.error : console.info;
      write(JSON.stringify(entry));
    });
    next();
  };
}
