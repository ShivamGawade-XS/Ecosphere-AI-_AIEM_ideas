export const FORECAST_METHODS = ["moving_average_v1", "last_value_v1"] as const;
export const FORECAST_METHOD = "moving_average_v1" as const;
export const FORECAST_CALCULATION_VERSION = "deterministic-model-selection-v2" as const;
export const MINIMUM_FORECAST_INPUTS = 4;

export type ForecastMethod = (typeof FORECAST_METHODS)[number];
export type ForecastInput = { observedAt: Date; value: number };
export type ForecastPoint = { step: number; predictedValue: number };
export type ForecastBacktest = {
  evaluatedPointCount: number;
  meanAbsoluteError: number | null;
  meanAbsolutePercentageError: number | null;
};
export type ForecastOutput = {
  method: ForecastMethod;
  calculationVersion: typeof FORECAST_CALCULATION_VERSION;
  status: "ready" | "insufficient_data";
  inputReadingCount: number;
  horizonPoints: number;
  windowSize: number;
  points: ForecastPoint[];
  backtest: ForecastBacktest | null;
  selection?: {
    metric: "rolling_holdout_mae";
    candidates: Array<{ method: ForecastMethod; meanAbsoluteError: number | null; evaluatedPointCount: number }>;
    selectedBecause: string;
  };
  insufficiencyReason?: string;
};

const round = (value: number) => Math.round(value * 10_000) / 10_000;
const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

function createPoints(method: ForecastMethod, values: number[], horizonPoints: number, windowSize: number): ForecastPoint[] {
  const rolling = [...values];
  const points: ForecastPoint[] = [];
  for (let step = 1; step <= horizonPoints; step += 1) {
    const predictedValue = method === "last_value_v1"
      ? round(rolling[rolling.length - 1] ?? 0)
      : round(mean(rolling.slice(-Math.min(windowSize, rolling.length))));
    points.push({ step, predictedValue });
    rolling.push(predictedValue);
  }
  return points;
}

function evaluateCandidate(method: ForecastMethod, values: number[], windowSize: number): ForecastBacktest {
  const holdoutCount = Math.min(3, Math.max(1, values.length - windowSize));
  const errors: number[] = [];
  const percentageErrors: number[] = [];
  for (let index = values.length - holdoutCount; index < values.length; index += 1) {
    const training = values.slice(Math.max(0, index - windowSize), index);
    const predicted = method === "last_value_v1" ? training[training.length - 1] ?? 0 : mean(training);
    const actual = values[index];
    errors.push(Math.abs(actual - predicted));
    if (actual !== 0) percentageErrors.push(Math.abs(actual - predicted) / Math.abs(actual));
  }
  return {
    evaluatedPointCount: errors.length,
    meanAbsoluteError: errors.length ? round(mean(errors)) : null,
    meanAbsolutePercentageError: percentageErrors.length ? round(mean(percentageErrors) * 100) : null,
  };
}

export function buildMovingAverageForecast(input: { readings: ForecastInput[]; horizonPoints: number; windowSize?: number }): ForecastOutput {
  const horizonPoints = Math.max(1, Math.min(24, Math.floor(input.horizonPoints)));
  const windowSize = Math.max(2, Math.min(12, Math.floor(input.windowSize ?? MINIMUM_FORECAST_INPUTS)));
  const readings = [...input.readings]
    .filter((item) => Number.isFinite(item.value) && item.value >= 0 && !Number.isNaN(item.observedAt.getTime()))
    .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());

  if (readings.length < MINIMUM_FORECAST_INPUTS) {
    return { method: FORECAST_METHOD, calculationVersion: FORECAST_CALCULATION_VERSION, status: "insufficient_data", inputReadingCount: readings.length, horizonPoints, windowSize, points: [], backtest: null, insufficiencyReason: `At least ${MINIMUM_FORECAST_INPUTS} valid historical readings are required for deterministic pilot forecasting.` };
  }

  const values = readings.map((item) => item.value);
  const candidateBacktests = FORECAST_METHODS.map((method) => ({ method, backtest: evaluateCandidate(method, values, windowSize) }));
  const selected = [...candidateBacktests].sort((left, right) => {
    const errorDifference = (left.backtest.meanAbsoluteError ?? Number.POSITIVE_INFINITY) - (right.backtest.meanAbsoluteError ?? Number.POSITIVE_INFINITY);
    return errorDifference || left.method.localeCompare(right.method);
  })[0];

  return {
    method: selected.method,
    calculationVersion: FORECAST_CALCULATION_VERSION,
    status: "ready",
    inputReadingCount: readings.length,
    horizonPoints,
    windowSize,
    points: createPoints(selected.method, values, horizonPoints, windowSize),
    backtest: selected.backtest,
    selection: {
      metric: "rolling_holdout_mae",
      candidates: candidateBacktests.map(({ method, backtest }) => ({ method, meanAbsoluteError: backtest.meanAbsoluteError, evaluatedPointCount: backtest.evaluatedPointCount })),
      selectedBecause: `Selected ${selected.method} because it had the lowest rolling holdout MAE among the available deterministic pilot methods; this is not a predictive-accuracy guarantee.`,
    },
  };
}
