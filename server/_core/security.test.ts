import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders, createSimpleRateLimitMiddleware, isSameOriginMutation, sameOriginMutationMiddleware, securityHeadersMiddleware } from "./security";

describe("security headers", () => {
  it("applies baseline browser protections in every environment", () => {
    const response = { setHeader: vi.fn() };
    applySecurityHeaders(response, false);

    expect(response.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(response.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    expect(response.setHeader).toHaveBeenCalledWith("Referrer-Policy", "strict-origin-when-cross-origin");
    expect(response.setHeader).toHaveBeenCalledWith("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    expect(response.setHeader).toHaveBeenCalledWith("Cross-Origin-Resource-Policy", "same-origin");
    expect(response.setHeader).not.toHaveBeenCalledWith("Strict-Transport-Security", expect.anything());
  });

  it("adds restrictive production CSP and HSTS without exposing request data", () => {
    const response = { setHeader: vi.fn() };
    applySecurityHeaders(response, true);

    const cspCall = response.setHeader.mock.calls.find(([name]) => name === "Content-Security-Policy");
    expect(cspCall?.[1]).toContain("default-src 'self'");
    expect(cspCall?.[1]).toContain("frame-ancestors 'none'");
    expect(cspCall?.[1]).toContain("form-action 'self'");
    expect(cspCall?.[1]).toContain("script-src 'self'");
    expect(cspCall?.[1]).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(cspCall?.[1]).toContain("connect-src 'self'");
    expect(response.setHeader).toHaveBeenCalledWith("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  });

  it("exposes a conventional middleware next contract", () => {
    const response = { setHeader: vi.fn() };
    const next = vi.fn();
    securityHeadersMiddleware(false)({}, response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(response.setHeader).toHaveBeenCalled();
  });

  it("accepts same-origin unsafe requests and rejects cross-origin browser mutations in production", () => {
    const sameOrigin = { method: "POST", protocol: "https", headers: { origin: "https://ecosphere.example" }, get: () => "ecosphere.example" } as any;
    expect(isSameOriginMutation(sameOrigin)).toBe(true);
    expect(isSameOriginMutation({ ...sameOrigin, headers: { origin: "https://attacker.example" } })).toBe(false);

    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    sameOriginMutationMiddleware(true)({ ...sameOrigin, headers: { origin: "https://attacker.example" } }, response, next);
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
  });

  it("bounds repeated API traffic per request origin bucket", () => {
    const limit = createSimpleRateLimitMiddleware({ windowMs: 60_000, maxRequests: 2 });
    const response = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const request = { ip: "203.0.113.7" } as any;
    const next = vi.fn();
    limit(request, response, next);
    limit(request, response, next);
    limit(request, response, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith({ error: "rate-limit-exceeded" });
  });
});
