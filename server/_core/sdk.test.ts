import { describe, expect, it } from "vitest";
import { normalizeSessionLifetime, SESSION_MAX_AGE_MS } from "./sdk";

describe("normalizeSessionLifetime", () => {
  it("uses the twelve-hour application maximum for absent, invalid, and non-positive values", () => {
    expect(normalizeSessionLifetime()).toBe(SESSION_MAX_AGE_MS);
    expect(normalizeSessionLifetime(Number.NaN)).toBe(SESSION_MAX_AGE_MS);
    expect(normalizeSessionLifetime(0)).toBe(SESSION_MAX_AGE_MS);
    expect(normalizeSessionLifetime(-1)).toBe(SESSION_MAX_AGE_MS);
  });

  it("preserves safe shorter durations and caps accidental longer requests", () => {
    expect(normalizeSessionLifetime(15 * 60 * 1000)).toBe(15 * 60 * 1000);
    expect(normalizeSessionLifetime(SESSION_MAX_AGE_MS * 2)).toBe(SESSION_MAX_AGE_MS);
  });
});
