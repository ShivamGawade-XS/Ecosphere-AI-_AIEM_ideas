import { describe, expect, it } from "vitest";
import { buildDemoBaseline, buildDemoCycle, buildDemoHvacSpike, demoReadingIdempotencyKey } from "./demoSimulation";

describe("AIEM Campus deterministic demo data", () => {
  const baseTime = new Date("2026-08-24T09:00:00.000Z");

  it("creates four ordered HVAC baselines before any controlled spike", () => {
    const readings = buildDemoBaseline(baseTime);
    const hvac = readings.filter((reading) => reading.meterKey === "demo-hvac-energy");
    expect(hvac.map((reading) => reading.value)).toEqual([97.4, 98.6, 99.1, 97.9]);
    expect(hvac.every((reading) => reading.kind === "baseline")).toBe(true);
    expect(hvac.every((reading, index) => index === 0 || reading.observedAt > hvac[index - 1].observedAt)).toBe(true);
  });

  it("produces bounded, repeatable normal cycles across every demo resource", () => {
    const first = buildDemoCycle({ cycle: 1, baseTime });
    const seventh = buildDemoCycle({ cycle: 7, baseTime });
    expect(first.map((reading) => [reading.meterKey, reading.value, reading.unit])).toEqual([
      ["demo-hvac-energy", 100.2, "kWh"],
      ["demo-water", 5.1, "m³"],
      ["demo-waste", 18.2, "kg"],
    ]);
    expect(seventh.map((reading) => reading.value)).toEqual(first.map((reading) => reading.value));
    expect(seventh.every((reading) => reading.kind === "cycle")).toBe(true);
  });

  it("uses a unique, deterministic sequence key and a fixed injected HVAC spike", () => {
    const spike = buildDemoHvacSpike({ cycle: 3, baseTime });
    expect(spike).toMatchObject({ meterKey: "demo-hvac-energy", value: 260, unit: "kWh", kind: "spike", sequence: 4 });
    expect(demoReadingIdempotencyKey({ sessionId: 9, meterKey: spike.meterKey, kind: spike.kind, sequence: spike.sequence })).toBe(
      "demo:aiem-campus-demo-v1:session:9:demo-hvac-energy:spike:4",
    );
  });
});
