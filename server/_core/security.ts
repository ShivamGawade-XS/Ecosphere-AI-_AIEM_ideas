import type { Request, Response } from "express";

type RateLimitOptions = { windowMs: number; maxRequests: number };
type RateLimitBucket = { count: number; resetAt: number };

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value?.split(",")[0]?.trim();
}

function isUnsafeMethod(method: string | undefined) {
  return !["GET", "HEAD", "OPTIONS"].includes((method ?? "GET").toUpperCase());
}

export function isSameOriginMutation(request: Pick<Request, "headers" | "method" | "protocol" | "get">) {
  if (!isUnsafeMethod(request.method)) return true;
  const origin = firstHeaderValue(request.headers.origin);
  if (!origin) return true;
  const protocol = firstHeaderValue(request.headers["x-forwarded-proto"]) ?? request.protocol;
  const host = firstHeaderValue(request.headers["x-forwarded-host"]) ?? request.get("host");
  return Boolean(protocol && host) && origin === `${protocol}://${host}`;
}

export function sameOriginMutationMiddleware(isProduction: boolean) {
  return (
    request: Pick<Request, "headers" | "method" | "protocol" | "get">,
    response: Pick<Response, "status" | "json">,
    next: () => void,
  ) => {
    if (!isProduction || isSameOriginMutation(request)) return next();
    response.status(403).json({ error: "cross-origin-request-rejected" });
  };
}

export function createSimpleRateLimitMiddleware({ windowMs, maxRequests }: RateLimitOptions) {
  const buckets = new Map<string, RateLimitBucket>();
  return (
    request: Pick<Request, "ip">,
    response: Pick<Response, "setHeader" | "status" | "json">,
    next: () => void,
  ) => {
    const now = Date.now();
    const key = request.ip || "unknown";
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 10_000) {
      for (const [bucketKey, candidate] of Array.from(buckets.entries())) {
        if (candidate.resetAt <= now) buckets.delete(bucketKey);
      }
    }
    response.setHeader("RateLimit-Limit", String(maxRequests));
    response.setHeader("RateLimit-Remaining", String(Math.max(0, maxRequests - bucket.count)));
    if (bucket.count <= maxRequests) return next();
    response.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    response.status(429).json({ error: "rate-limit-exceeded" });
  };
}

/**
 * Security headers shared by every HTTP response. The CSP is intentionally
 * enabled only for production because Vite's development runtime requires
 * development-only script and websocket sources.
 */
export function applySecurityHeaders(response: Pick<Response, "setHeader">, isProduction: boolean) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  if (isProduction) {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; script-src 'self'; connect-src 'self'"
    );
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

export function securityHeadersMiddleware(isProduction: boolean) {
  return (_request: unknown, response: Pick<Response, "setHeader">, next: () => void) => {
    applySecurityHeaders(response, isProduction);
    next();
  };
}
