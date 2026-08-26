import { describe, expect, it } from "vitest";
import { assertValidTimeZone, classifyOperatingCalendar } from "./operatingCalendar";

describe("operating calendar context", () => {
  const weekdayWindow = { id: 7, timezone: "Asia/Kolkata", weekdays: [1, 2, 3, 4, 5], startMinuteLocal: 9 * 60, endMinuteLocal: 18 * 60, isActive: true };

  it("classifies a reading in an explicit local operating interval", () => {
    const result = classifyOperatingCalendar({ windows: [weekdayWindow], observedAt: new Date("2026-08-24T04:30:00.000Z") });
    expect(result).toEqual({ state: "operating", matchedWindowIds: [7], baselineBucket: "operating" });
  });

  it("retains explicit off-hours evidence instead of treating it as absent or suppressed", () => {
    const result = classifyOperatingCalendar({ windows: [weekdayWindow], observedAt: new Date("2026-08-24T15:30:00.000Z") });
    expect(result).toEqual({ state: "outside_configured_hours", matchedWindowIds: [], baselineBucket: "outside_configured_hours" });
  });

  it("keeps existing behavior unconfigured until a tenant opts into a calendar", () => {
    expect(classifyOperatingCalendar({ windows: [], observedAt: new Date("2026-08-24T04:30:00.000Z") })).toEqual({ state: "unconfigured", matchedWindowIds: [], baselineBucket: "unconfigured" });
    expect(() => assertValidTimeZone("Not/A_Zone")).toThrow(/IANA timezone/i);
  });
});
