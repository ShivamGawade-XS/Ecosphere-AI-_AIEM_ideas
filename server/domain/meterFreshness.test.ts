import { describe, expect, it } from "vitest";
import { assessMeterFreshness } from "./meterFreshness";

describe("assessMeterFreshness", () => {
  const now = new Date("2026-08-25T12:00:00.000Z");

  it("labels evidence by explicit 24-hour and 72-hour boundaries", () => {
    expect(assessMeterFreshness(new Date("2026-08-24T12:00:00.000Z"), now)).toMatchObject({ state: "fresh", ageHours: 24 });
    expect(assessMeterFreshness(new Date("2026-08-22T12:00:00.000Z"), now)).toMatchObject({ state: "aging", ageHours: 72 });
    expect(assessMeterFreshness(new Date("2026-08-22T11:59:59.000Z"), now)).toMatchObject({ state: "stale" });
  });

  it("preserves an explicit no-evidence state rather than implying a meter is current", () => {
    expect(assessMeterFreshness(null, now)).toMatchObject({ state: "no_accepted_evidence", ageHours: null, disclosure: expect.stringContaining("No accepted") });
  });
});
