import { describe, expect, it } from "vitest";
import { hasAuthenticationConfiguration, hasStrongSessionSecret } from "./env";

describe("environment security gates", () => {
  it("rejects empty and short session secrets while accepting the managed 22-character secret shape", () => {
    expect(hasStrongSessionSecret("")).toBe(false);
    expect(hasStrongSessionSecret("short-secret")).toBe(false);
    expect(hasStrongSessionSecret("a-secure-managed-secret")).toBe(true);
  });

  it("requires app, OAuth, and session configuration for readiness", () => {
    expect(hasAuthenticationConfiguration({ appId: "app", oAuthServerUrl: "https://oauth.example", cookieSecret: "a-secure-managed-secret" })).toBe(true);
    expect(hasAuthenticationConfiguration({ appId: "", oAuthServerUrl: "https://oauth.example", cookieSecret: "a-secure-managed-secret" })).toBe(false);
  });
});
