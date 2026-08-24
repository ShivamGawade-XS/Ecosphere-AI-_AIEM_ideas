/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { OAUTH_STATE_COOKIE } from "@shared/const";
import { createOAuthStateCookie } from "./const";

describe("OAuth state-cookie lifecycle", () => {
  it("uses the same host-only callback name with a bounded, secure Lax lifetime", () => {
    expect(createOAuthStateCookie("nonce-123")).toBe(`${OAUTH_STATE_COOKIE}=nonce-123; Path=/; Max-Age=600; SameSite=Lax; Secure`);
  });
});
