import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders, securityHeadersMiddleware } from "./security";

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
    expect(cspCall?.[1]).toContain("connect-src 'self' https: wss:");
    expect(response.setHeader).toHaveBeenCalledWith("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  });

  it("exposes a conventional middleware next contract", () => {
    const response = { setHeader: vi.fn() };
    const next = vi.fn();
    securityHeadersMiddleware(false)({}, response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(response.setHeader).toHaveBeenCalled();
  });
});
