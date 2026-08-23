export const FORECAST_METHOD = "moving_average_v1" as const;
export const FORECAST_CALCULATION_VERSION = "moving-average-v1" as const;
export const MINIMUM_FORECAST_INPUTS = 4;

export type ForecastInput = { observedAt: Date; value: number };
export type ForecastPoint = { step: number; predictedValue: number };
export type ForecastBacktest = {
  evaluatedPointCount: number;
  meanAbsoluteError: number | null;
  meanAbsolutePercentageError: number | null;
};
export type ForecastOutput = {
  method: typeof FORECAST_METHOD;
  calculationVersion: typeof FORECAST_CALCULATION_VERSION;
  status: "ready" | "insufficient_data";
  inputReadingCount: number;
  horizonPoints: number;
  windowSize: number;
  points: ForecastPoint[];
  backtest: ForecastBacktest | null;
  insufficiencyReason?: string;
};

const round = (value: number) => Math.round(value * 10_000) / 10_000;

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function buildMovingAverageForecast(input: { readings: ForecastInput[]; horizonPoints: number; windowSize?: number }): ForecastOutput {
  const horizonPoints = Math.max(1, Math.min(24, Math.floor(input.horizonPoints)));
  const windowSize = Math.max(2, Math.min(12, Math.floor(input.windowSize ?? MINIMUM_FORECAST_INPUTS)));
  const readings = [...input.readings]
    .filter((item) => Number.isFinite(item.value) && item.value >= 0 && !Number.isNaN(item.observedAt.getTime()))
    .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());

  if (readings.length < MINIMUM_FORECAST_INPUTS) {
    return {
      method: FORECAST_METHOD,
      calculationVersion: FORECAST_CALCULATION_VERSION,
      status: "insufficient_data",
      inputReadingCount: readings.length,
      horizonPoints,
      windowSize,
      points: [],
      backtest: null,
      insufficiencyReason: `At least ${MINIMUM_FORECAST_INPUTS} valid historical readings are required for the pilot forecast method.`,
    };
  }

  const values = readings.map((item) => item.value);
  const rolling = [...values];
  const points: ForecastPoint[] = [];
  for (let step = 1; step <= horizonPoints; step += 1) {
    const predictedValue = round(mean(rolling.slice(-Math.min(windowSize, rolling.length))));
    points.push({ step, predictedValue });
    rolling.push(predictedValue);
  }

  const holdoutCount = Math.min(3, Math.max(1, values.length - windowSize));
  const errors: number[] = [];
  const percentageErrors: number[] = [];
  for (let index = values.length - holdoutCount; index < values.length; index += 1) {
    const training = values.slice(Math.max(0, index - windowSize), index);
    const predicted = mean(training);
    const actual = values[index];
    errors.push(Math.abs(actual - predicted));
    if (actual !== 0) percentageErrors.push(Math.abs(actual - predicted) / Math.abs(actual));
  }

  return {
    method: FORECAST_METHOD,
    calculationVersion: FORECAST_CALCULATION_VERSION,
    status: "ready",
    inputReadingCount: readings.length,
    horizonPoints,
    windowSize,
    points,
    backtest: {
      evaluatedPointCount: errors.length,
      meanAbsoluteError: errors.length ? round(mean(errors)) : null,
      meanAbsolutePercentageError: percentageErrors.length ? round(mean(percentageErrors) * 100) : null,
    },
  };
}
