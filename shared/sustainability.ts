export const DEMO_ELECTRICITY_EMISSION_FACTOR = 0.71;
export const DEMO_ELECTRICITY_RATE_INR = 9.8;

export type MetricName = "energy" | "water" | "waste" | "carbon";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "open" | "acknowledged" | "resolved";

export type TimeSeriesPoint = {
  timestamp: number;
  value: number;
  unit: string;
  simulated: boolean;
};

export type SimulationInput = {
  energyReductionPct: number;
  waterReductionPct: number;
  wasteDiversionPct: number;
};

export type SimulationResult = SimulationInput & {
  energyAvoidedKwh: number;
  waterAvoidedKl: number;
  wasteDivertedKg: number;
  co2AvoidedKg: number;
  monthlySavingsInr: number;
  ecoScoreLift: number;
  interventionRank: number;
  summary: string;
};

export type EcoScoreBreakdown = {
  total: number;
  energy: number;
  water: number;
  waste: number;
  carbon: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calculateEcoScore(input: {
  monthlyEnergyKwh: number;
  monthlyWaterKl: number;
  monthlyWasteKg: number;
  monthlyCarbonKg: number;
}): EcoScoreBreakdown {
  const energy = clamp(100 - Math.max(0, input.monthlyEnergyKwh - 10800) / 72, 0, 100);
  const water = clamp(100 - Math.max(0, input.monthlyWaterKl - 560) / 5.6, 0, 100);
  const waste = clamp(100 - Math.max(0, input.monthlyWasteKg - 420) / 4.2, 0, 100);
  const carbon = clamp(100 - Math.max(0, input.monthlyCarbonKg - 7600) / 50, 0, 100);
  const total = energy * 0.34 + water * 0.22 + waste * 0.18 + carbon * 0.26;

  return {
    total: Math.round(total),
    energy: Math.round(energy),
    water: Math.round(water),
    waste: Math.round(waste),
    carbon: Math.round(carbon),
  };
}

export function calculateForecast(points: TimeSeriesPoint[]) {
  if (points.length === 0) return { nextValue: 0, changePct: 0 };
  const recent = points.slice(-6);
  const average = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
  const first = recent[0]?.value ?? average;
  const last = recent[recent.length - 1]?.value ?? average;
  const perStepTrend = recent.length > 1 ? (last - first) / (recent.length - 1) : 0;
  const nextValue = Math.max(0, average + perStepTrend * 1.5);
  return {
    nextValue: round(nextValue),
    changePct: round(first === 0 ? 0 : ((nextValue - average) / average) * 100),
  };
}

export function detectEnergyAnomaly(value: number, previousPoints: TimeSeriesPoint[]) {
  const baseline = previousPoints.slice(-8);
  if (baseline.length < 4) return { isAnomaly: false, baseline: 0, ratio: 1 };
  const average = baseline.reduce((sum, point) => sum + point.value, 0) / baseline.length;
  const ratio = average === 0 ? 1 : value / average;
  return {
    isAnomaly: ratio >= 1.25,
    baseline: round(average),
    ratio: round(ratio, 2),
  };
}

export function calculateSimulation(
  baseline: { energyKwh: number; waterKl: number; wasteKg: number },
  input: SimulationInput
): SimulationResult {
  const energyAvoidedKwh = baseline.energyKwh * (input.energyReductionPct / 100);
  const waterAvoidedKl = baseline.waterKl * (input.waterReductionPct / 100);
  const wasteDivertedKg = baseline.wasteKg * (input.wasteDiversionPct / 100);
  const co2AvoidedKg = energyAvoidedKwh * DEMO_ELECTRICITY_EMISSION_FACTOR;
  const monthlySavingsInr = energyAvoidedKwh * DEMO_ELECTRICITY_RATE_INR;
  const impactIndex = energyAvoidedKwh * 0.55 + waterAvoidedKl * 7 + wasteDivertedKg * 2;
  const interventionRank = impactIndex > 950 ? 1 : impactIndex > 450 ? 2 : 3;

  return {
    ...input,
    energyAvoidedKwh: round(energyAvoidedKwh),
    waterAvoidedKl: round(waterAvoidedKl),
    wasteDivertedKg: round(wasteDivertedKg),
    co2AvoidedKg: round(co2AvoidedKg),
    monthlySavingsInr: Math.round(monthlySavingsInr),
    ecoScoreLift: Math.min(18, Math.round(input.energyReductionPct * 0.48 + input.waterReductionPct * 0.2 + input.wasteDiversionPct * 0.16)),
    interventionRank,
    summary: `Projected monthly reduction: ${round(co2AvoidedKg)} kgCO₂e and ₹${Math.round(monthlySavingsInr).toLocaleString("en-IN")} in electricity cost using prototype demo factors.`,
  };
}

export function getSdgImpact(input: { co2AvoidedKg: number; energyAvoidedKwh: number; wasteDivertedKg: number }) {
  const climate = Math.min(100, Math.round(input.co2AvoidedKg / 11));
  const energy = Math.min(100, Math.round(input.energyAvoidedKwh / 16));
  const cities = Math.min(100, Math.round((input.energyAvoidedKwh + input.wasteDivertedKg) / 23));
  const consumption = Math.min(100, Math.round(input.wasteDivertedKg / 4));
  return [
    { id: "SDG 13", title: "Climate Action", value: climate, colour: "#2f8f72" },
    { id: "SDG 7", title: "Clean Energy", value: energy, colour: "#f0b429" },
    { id: "SDG 11", title: "Sustainable Cities", value: cities, colour: "#d66a52" },
    { id: "SDG 12", title: "Responsible Consumption", value: consumption, colour: "#a664d8" },
  ];
}
