import { describe, expect, it } from "vitest";
import { calculateEcoScore, calculateForecast, calculateSimulation, detectEnergyAnomaly, getSdgImpact } from "./sustainability";

describe("EcoSphere sustainability calculations", () => {
  it("calculates a bounded and traceable EcoScore", () => {
    const score = calculateEcoScore({ monthlyEnergyKwh: 12240, monthlyWaterKl: 592, monthlyWasteKg: 416, monthlyCarbonKg: 8689 });
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(score.energy).toBeLessThan(100);
    expect(score.waste).toBe(100);
  });

  it("flags an HVAC-like energy spike above the deterministic 25 percent threshold", () => {
    const previous = [650, 662, 658, 670, 655, 665, 660, 668].map((value, index) => ({ timestamp: index, value, unit: "kWh", simulated: true }));
    const result = detectEnergyAnomaly(1040, previous);
    expect(result.isAnomaly).toBe(true);
    expect(result.baseline).toBe(661);
    expect(result.ratio).toBeGreaterThan(1.5);
  });

  it("produces transparent simulation outcomes from fixed conservation measures", () => {
    const result = calculateSimulation({ energyKwh: 12000, waterKl: 600, wasteKg: 420 }, { energyReductionPct: 15, waterReductionPct: 8, wasteDiversionPct: 12 });
    expect(result.energyAvoidedKwh).toBe(1800);
    expect(result.co2AvoidedKg).toBe(1278);
    expect(result.monthlySavingsInr).toBe(17640);
    expect(result.ecoScoreLift).toBeGreaterThan(0);
  });

  it("derives a directional forecast from the latest telemetry slope", () => {
    const forecast = calculateForecast([100, 104, 108, 112, 116, 120].map((value, index) => ({ timestamp: index, value, unit: "kWh", simulated: true })));
    expect(forecast.nextValue).toBeGreaterThan(110);
    expect(forecast.changePct).toBeGreaterThan(0);
  });

  it("maps measurable outcomes into bounded SDG indicators", () => {
    const impact = getSdgImpact({ co2AvoidedKg: 1278, energyAvoidedKwh: 1800, wasteDivertedKg: 50 });
    expect(impact).toHaveLength(4);
    expect(impact[0]).toMatchObject({ id: "SDG 13", value: 100 });
    expect(impact.every(item => item.value >= 0 && item.value <= 100)).toBe(true);
  });
});
