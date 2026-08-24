export function materializeReportSnapshot(input: {
  organizationId: number;
  generatedAt: Date;
  overview: unknown;
  monitoring: unknown;
  forecasts: unknown[];
  recommendations: unknown[];
  comparisons: unknown[];
  targetAssessments: unknown[];
  scenarios: unknown[];
  latestDemoSimulation: { status: string; simulationVersion?: string | null; anchorObservedAt: Date } | null;
  approvedFactors: Array<{ factorVersion: string; sourceName: string }>;
}) {
  const factorDisclosure = input.approvedFactors.length
    ? `This evidence snapshot uses tenant-governed factor records only where calculations selected them. Approved factor references: ${input.approvedFactors.map((factor) => `${factor.factorVersion} (${factor.sourceName})`).join("; ")}.`
    : "No approved tenant emission factors are currently available. Existing pilot carbon outputs may use the clearly labelled 0.82 kgCO2e/kWh fallback and are not certified or regional reporting figures.";
  return {
    criteria: { organizationId: input.organizationId, scope: "current tenant-bound persisted records", generatedAt: input.generatedAt.toISOString(), version: "evidence-snapshot-v2" },
    evidence: {
      overview: input.overview,
      monitoring: input.monitoring,
      forecasts: input.forecasts.slice(0, 10),
      recommendations: input.recommendations.slice(0, 20),
      comparisons: input.comparisons.slice(0, 10),
      targetAssessments: input.targetAssessments.slice(0, 30),
      scenarios: input.scenarios.slice(0, 10),
      demoSimulation: input.latestDemoSimulation ? {
        ...input.latestDemoSimulation,
        explicitlySimulated: true,
        disclosure: "Guided Campus Simulation evidence is deterministic test data, not live campus telemetry.",
      } : null,
    },
    factorDisclosure,
  };
}
