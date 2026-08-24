import { describe, expect, it } from "vitest";
import { utcDateBoundary } from "./utcDates";

describe("UTC calendar target boundaries", () => {
  it("converts a date-only target window without relying on the browser timezone", () => {
    expect(utcDateBoundary("2026-03-29", "start").toISOString()).toBe("2026-03-29T00:00:00.000Z");
    expect(utcDateBoundary("2026-03-29", "end").toISOString()).toBe("2026-03-29T23:59:59.999Z");
  });
});
