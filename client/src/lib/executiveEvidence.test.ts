import { describe, expect, it } from "vitest";
import { summarizeExecutiveEvidence } from "./executiveEvidence";

describe("executive evidence summary", () => {
  it("renders only stored evidence fields and retains modeled/simulated disclosures", () => {
    const summary = summarizeExecutiveEvidence({ criteria: { generatedAt: "2026-08-24T00:00:00.000Z", version: "evidence-snapshot-v2" }, evidence: { targetAssessments: [{ target: { label: "Energy target", targetType: "energy", targetValue: 120, unit: "kWh" }, achievedValue: 99, assessment: { state: "achieved", freshness: "fresh" } }], scenarios: [{ results: { sdgImpact: { contributions: [{ sdg: 13, title: "Climate Action", contributionIndex: 64 }] } } }], comparisons: [{ id: 1 }], recommendations: [{ id: 2 }], demoSimulation: { explicitlySimulated: true, disclosure: "Guided Campus Simulation evidence is deterministic test data." } }, factorDisclosure: "Pilot factor disclosure" });
    expect(summary).toMatchObject({ version: "evidence-snapshot-v2", scenarioCount: 1, comparisonCount: 1, recommendationCount: 1, hasSimulatedEvidence: true, factorDisclosure: "Pilot factor disclosure" });
    expect(summary.targetAssessments[0]).toMatchObject({ label: "Energy target", state: "achieved", freshness: "fresh" });
    expect(summary.sdgContributions).toEqual([{ sdg: 13, title: "Climate Action", index: 64 }]);
  });
});
