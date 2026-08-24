import { describe, expect, it } from "vitest";
import { buildMovingAverageForecast } from "./forecasting";

describe("buildMovingAverageForecast", () => {
  it("returns an explicit insufficiency state below the minimum evidence threshold", () => {
    const forecast = buildMovingAverageForecast({
      readings: [
        { observedAt: new Date("2026-01-01T00:00:00Z"), value: 10 },
        { observedAt: new Date("2026-01-01T01:00:00Z"), value: 11 },
        { observedAt: new Date("2026-01-01T02:00:00Z"), value: 12 },
      ],
      horizonPoints: 3,
    });

    expect(forecast).toMatchObject({ status: "insufficient_data", inputReadingCount: 3, points: [], backtest: null });
  });

  it("selects the lower-error deterministic candidate and records comparable holdout evidence", () => {
    const forecast = buildMovingAverageForecast({
      readings: [10, 20, 30, 40, 50, 60].map((value, index) => ({ observedAt: new Date(1_700_000_000_000 + index * 3_600_000), value })),
      horizonPoints: 2,
      windowSize: 4,
    });

    expect(forecast.status).toBe("ready");
    expect(forecast.method).toBe("last_value_v1");
    expect(forecast.points).toEqual([{ step: 1, predictedValue: 60 }, { step: 2, predictedValue: 60 }]);
    expect(forecast.backtest).toEqual({ evaluatedPointCount: 2, meanAbsoluteError: 10, meanAbsolutePercentageError: 18.3333 });
    expect(forecast.selection).toMatchObject({ metric: "rolling_holdout_mae", candidates: [{ method: "moving_average_v1", meanAbsoluteError: 25 }, { method: "last_value_v1", meanAbsoluteError: 10 }] });
  });

  it("sorts readings by observed time and bounds the requested horizon", () => {
    const forecast = buildMovingAverageForecast({
      readings: [40, 10, 30, 20].map((value, index) => ({ observedAt: new Date(1_700_000_000_000 + (3 - index) * 3_600_000), value })),
      horizonPoints: 99,
    });

    expect(forecast.horizonPoints).toBe(24);
    expect(forecast.points[0]).toEqual({ step: 1, predictedValue: 25 });
  });

  it("uses a deterministic lexical tie-break when comparable candidates have equal holdout error", () => {
    const forecast = buildMovingAverageForecast({
      readings: [40, 40, 40, 40, 40].map((value, index) => ({ observedAt: new Date(1_700_000_000_000 + index * 3_600_000), value })),
      horizonPoints: 1,
    });
    expect(forecast.method).toBe("last_value_v1");
    expect(forecast.selection?.selectedBecause).toMatch(/not a predictive-accuracy guarantee/);
  });
});
