import { describe, expect, it } from "vitest";
import { decodeOAuthState, encodeOAuthState } from "./const";

describe("OAuth state encoding", () => {
  it("round-trips UTF-8 redirect paths through base64url without query-unsafe characters", () => {
    const encoded = encodeOAuthState({ redirectUri: "https://example.test/api/oauth/callback?campus=Goa/गोवा", nonce: "n-_1" });
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeOAuthState(encoded)).toEqual({ redirectUri: "https://example.test/api/oauth/callback?campus=Goa/गोवा", nonce: "n-_1" });
  });

  it("contains malformed callback state without throwing", () => {
    expect(decodeOAuthState("not+url-safe")).toEqual({ redirectUri: "" });
  });
});
