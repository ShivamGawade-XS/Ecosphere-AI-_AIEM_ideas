import { describe, expect, it } from "vitest";
import { compareOutcomeMeasurement } from "./outcomeMeasurement";

describe("compareOutcomeMeasurement", () => {
  it("keeps a comparable accepted-reading window distinct from a causal or financial claim", () => {
    expect(compareOutcomeMeasurement({ baselineValue: 100, outcomeValue: 84, modeledProjectedValue: 80, includesSimulatedEvidence: false })).toEqual({
      status: "comparable",
      results: {
        modeledProjectedValue: 80,
        modeledReductionValue: 20,
        observedReductionValue: 16,
        observedReductionPct: 16,
        varianceFromModeledValue: -4,
        disclosure: "This comparison reports accepted-reading aggregates against a saved model. It does not prove causation, certified reduction, realized savings, or financial performance.",
      },
    });
  });

  it("labels comparisons with simulated evidence rather than presenting them as realized outcomes", () => {
    expect(compareOutcomeMeasurement({ baselineValue: 100, outcomeValue: 70, modeledProjectedValue: 80, includesSimulatedEvidence: true })).toMatchObject({
      status: "simulated_evidence",
      results: { observedReductionValue: 30, varianceFromModeledValue: 10, disclosure: expect.stringContaining("simulated evidence") },
    });
  });

  it("rejects invalid aggregates", () => {
    expect(() => compareOutcomeMeasurement({ baselineValue: 0, outcomeValue: 1, modeledProjectedValue: 1, includesSimulatedEvidence: false })).toThrow("positive baseline");
  });
});
