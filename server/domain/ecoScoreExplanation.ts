type PersistedScore = { id: number; score: number; calculationVersion: string; computedAt: Date; windowStart: Date | null; windowEnd: Date | null; components: unknown };
const numberFrom = (record: Record<string, unknown>, key: string) => typeof record[key] === "number" && Number.isFinite(record[key]) ? record[key] : null;

export function explainPersistedEcoScore(snapshot: PersistedScore) {
  const components = snapshot.components && typeof snapshot.components === "object" && !Array.isArray(snapshot.components) ? snapshot.components as Record<string, unknown> : {};
  return {
    snapshot: { id: snapshot.id, score: snapshot.score, calculationVersion: snapshot.calculationVersion, computedAt: snapshot.computedAt, windowStart: snapshot.windowStart, windowEnd: snapshot.windowEnd },
    penalties: [
      { id: "quality", label: "Data-quality penalty", value: numberFrom(components, "qualityPenalty"), unit: "points", evidence: "Failed and warning quality findings at score calculation time." },
      { id: "anomaly", label: "Open-anomaly penalty", value: numberFrom(components, "anomalyPenalty"), unit: "points", evidence: "Open persisted anomaly severity at score calculation time." },
      { id: "carbon-trend", label: "Carbon-trend penalty", value: numberFrom(components, "carbonTrendPenalty"), unit: "points", evidence: "Latest energy-carbon value compared with the stored prior-window average." },
    ],
    evidence: [
      { id: "failed-quality", label: "Failed quality findings", value: numberFrom(components, "failedQualityFindings") },
      { id: "warning-quality", label: "Warning quality findings", value: numberFrom(components, "warningQualityFindings") },
      { id: "open-anomalies", label: "Open anomalies", value: numberFrom(components, "openAnomalyCount") },
      { id: "carbon-baseline", label: "Stored carbon baseline", value: numberFrom(components, "carbonBaselineKg"), unit: "kgCO₂e" },
      { id: "latest-carbon", label: "Latest energy carbon", value: numberFrom(components, "latestEnergyCarbonKg"), unit: "kgCO₂e" },
    ],
    formula: "100 minus the persisted quality, open-anomaly, and carbon-trend penalties; bounded from 0 to 100 and rounded by the recorded calculation version.",
    disclosure: "EcoScore is a transparent pilot operational score derived from persisted monitoring evidence. It is not a certified ESG rating, a live data guarantee, a causal diagnosis, or a carbon-reporting assurance statement.",
  };
}
