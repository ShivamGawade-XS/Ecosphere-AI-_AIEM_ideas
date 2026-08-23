import type { Response } from "express";

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
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:"
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
