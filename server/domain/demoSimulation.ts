export const DEMO_SIMULATION_VERSION = "aiem-campus-demo-v1" as const;
export const DEMO_SITE_CODE = "AIEM-DEMO" as const;

export type DemoMeterDefinition = {
  meterKey: "demo-hvac-energy" | "demo-water" | "demo-waste";
  displayName: string;
  resourceType: "energy" | "water" | "waste";
  canonicalUnit: "kWh" | "m³" | "kg";
};

export const DEMO_METERS: readonly DemoMeterDefinition[] = [
  { meterKey: "demo-hvac-energy", displayName: "Demo HVAC Electricity", resourceType: "energy", canonicalUnit: "kWh" },
  { meterKey: "demo-water", displayName: "Demo Campus Water", resourceType: "water", canonicalUnit: "m³" },
  { meterKey: "demo-waste", displayName: "Demo Campus Waste", resourceType: "waste", canonicalUnit: "kg" },
] as const;

export type DemoReading = {
  meterKey: DemoMeterDefinition["meterKey"];
  value: number;
  unit: DemoMeterDefinition["canonicalUnit"];
  observedAt: Date;
  sequence: number;
  kind: "baseline" | "cycle" | "spike";
};

const HVAC_BASELINE = [97.4, 98.6, 99.1, 97.9] as const;
const HVAC_CYCLES = [100.2, 98.8, 101.1, 99.6, 100.5, 98.9] as const;
const WATER_CYCLES = [5.1, 5.3, 5.2, 5.4, 5.2, 5.3] as const;
const WASTE_CYCLES = [18.2, 18.6, 18.4, 18.7, 18.3, 18.5] as const;

function atMinutesBefore(base: Date, minutes: number) {
  return new Date(base.getTime() - minutes * 60_000);
}

function atMinutesAfter(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

/**
 * Creates the four eligible HVAC baseline observations needed by the rolling
 * detector, plus representative water and waste records. All records are
 * explicitly simulated and must never be presented as campus telemetry.
 */
export function buildDemoBaseline(baseTime: Date): DemoReading[] {
  const readings: DemoReading[] = [];
  HVAC_BASELINE.forEach((value, index) => {
    readings.push({
      meterKey: "demo-hvac-energy",
      value,
      unit: "kWh",
      observedAt: atMinutesBefore(baseTime, (HVAC_BASELINE.length - index) * 5),
      sequence: index + 1,
      kind: "baseline",
    });
  });
  readings.push(
    { meterKey: "demo-water", value: WATER_CYCLES[0], unit: "m³", observedAt: atMinutesBefore(baseTime, 10), sequence: 1, kind: "baseline" },
    { meterKey: "demo-waste", value: WASTE_CYCLES[0], unit: "kg", observedAt: atMinutesBefore(baseTime, 10), sequence: 1, kind: "baseline" },
  );
  return readings;
}

/** One bounded normal simulation cycle. The sequence wraps deterministically. */
export function buildDemoCycle(input: { cycle: number; baseTime: Date }): DemoReading[] {
  const cycle = Math.max(1, Math.floor(input.cycle));
  const index = (cycle - 1) % HVAC_CYCLES.length;
  const observedAt = atMinutesAfter(input.baseTime, cycle * 5);
  return [
    { meterKey: "demo-hvac-energy", value: HVAC_CYCLES[index], unit: "kWh", observedAt, sequence: cycle, kind: "cycle" },
    { meterKey: "demo-water", value: WATER_CYCLES[index], unit: "m³", observedAt, sequence: cycle, kind: "cycle" },
    { meterKey: "demo-waste", value: WASTE_CYCLES[index], unit: "kg", observedAt, sequence: cycle, kind: "cycle" },
  ];
}

/**
 * Creates a single controlled HVAC spike after four normal baseline readings.
 * Its magnitude is intentionally fixed so a demo is reproducible and its
 * provenance can be disclosed exactly.
 */
export function buildDemoHvacSpike(input: { cycle: number; baseTime: Date }): DemoReading {
  const cycle = Math.max(1, Math.floor(input.cycle));
  return {
    meterKey: "demo-hvac-energy",
    value: 260,
    unit: "kWh",
    observedAt: atMinutesAfter(input.baseTime, (cycle + 1) * 5),
    sequence: cycle + 1,
    kind: "spike",
  };
}

export function demoReadingIdempotencyKey(input: { sessionId: number; meterKey: string; kind: DemoReading["kind"]; sequence: number }) {
  return `demo:${DEMO_SIMULATION_VERSION}:session:${input.sessionId}:${input.meterKey}:${input.kind}:${input.sequence}`;
}
