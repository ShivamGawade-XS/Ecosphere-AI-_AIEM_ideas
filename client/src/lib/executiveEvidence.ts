type RecordValue = Record<string, unknown>;

const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown, fallback = "Not recorded"): string => typeof value === "string" && value.trim() ? value : fallback;
const numeric = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;

export type StoredEvidenceSnapshot = { criteria: unknown; evidence: unknown; factorDisclosure: string };

export function summarizeExecutiveEvidence(snapshot: StoredEvidenceSnapshot) {
  const criteria = record(snapshot.criteria);
  const evidence = record(snapshot.evidence);
  const targetAssessments = array(evidence.targetAssessments).map((value) => {
    const item = record(value); const target = record(item.target); const assessment = record(item.assessment);
    return { label: text(target.label), metric: text(target.targetType), targetValue: numeric(target.targetValue), achievedValue: numeric(item.achievedValue), unit: text(target.unit, "unit not recorded"), state: text(assessment.state), freshness: text(assessment.freshness) };
  });
  const scenarios = array(evidence.scenarios);
  const sdgContributions = scenarios.flatMap((value) => {
    const scenario = record(value);
    const results = record(scenario.results);
    return array(record(results.sdgImpact).contributions);
  }).map((value) => {
    const contribution = record(value); return { sdg: numeric(contribution.sdg), title: text(contribution.title), index: numeric(contribution.contributionIndex) };
  });
  const demoSimulation = record(evidence.demoSimulation);
  return {
    generatedAt: text(criteria.generatedAt), version: text(criteria.version), overview: record(evidence.overview), monitoring: record(evidence.monitoring), targetAssessments, scenarioCount: scenarios.length, comparisonCount: array(evidence.comparisons).length, recommendationCount: array(evidence.recommendations).length, sdgContributions,
    demoDisclosure: text(demoSimulation.disclosure, "No guided simulation evidence is included in this snapshot."), hasSimulatedEvidence: demoSimulation.explicitlySimulated === true,
    factorDisclosure: snapshot.factorDisclosure,
  };
}
