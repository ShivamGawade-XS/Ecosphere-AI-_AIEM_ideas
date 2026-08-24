import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { decodeOAuthState, encodeOAuthState } from "../../shared/const";
import { getOAuthStateCookieOptions } from "./cookies";

describe("OAuth state and callback cookie lifecycle", () => {
  it("round-trips UTF-8 state through query-safe base64url encoding", () => {
    const input = { redirectUri: "https://example.test/api/oauth/callback?campus=Goa/गोवा", nonce: "n-_1" };
    const encoded = encodeOAuthState(input);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeOAuthState(encoded)).toEqual(input);
  });

  it("uses callback cookie options that match a proxied HTTPS request", () => {
    const request = { protocol: "http", headers: { "x-forwarded-proto": "https" } } as unknown as Request;
    expect(getOAuthStateCookieOptions(request)).toEqual({ path: "/", sameSite: "lax", secure: true });
  });
});
