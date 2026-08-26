import { describe, expect, it } from "vitest";
import { explainPersistedEcoScore } from "./ecoScoreExplanation";

describe("explainPersistedEcoScore", () => {
  it("exposes stored score components without inferring missing values", () => {
    const result = explainPersistedEcoScore({ id: 4, score: 72, calculationVersion: "ecoscore-v1", computedAt: new Date("2026-08-25T00:00:00.000Z"), windowStart: null, windowEnd: null, components: { qualityPenalty: 20, anomalyPenalty: 8, carbonTrendPenalty: 0, failedQualityFindings: 1, openAnomalyCount: 1 } });
    expect(result.snapshot).toMatchObject({ id: 4, score: 72, calculationVersion: "ecoscore-v1" });
    expect(result.penalties).toEqual(expect.arrayContaining([expect.objectContaining({ id: "quality", value: 20 }), expect.objectContaining({ id: "anomaly", value: 8 })]));
    expect(result.evidence).toEqual(expect.arrayContaining([expect.objectContaining({ id: "warning-quality", value: null })]));
    expect(result.disclosure).toMatch(/not a certified ESG rating/i);
  });
});
