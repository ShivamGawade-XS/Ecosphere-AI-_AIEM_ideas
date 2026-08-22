import * as db from "../db";
import { deliverOwnerNotificationForAlert } from "../monitoring/alertDelivery";
import {
  ANOMALY_DETECTOR_VERSION,
  DATA_QUALITY_VERSION,
  calculateCarbonForReading,
  calculateEcoScore,
  detectReadingAnomaly,
  evaluateReadingQuality,
  type AnomalySeverity,
} from "../domain/monitoring";

export type MonitoringTrigger = "manual" | "scheduled" | "cli";

export type MonitoringRunSummary = {
  organizationId: number;
  runKey: string;
  status: "completed" | "failed" | "skipped";
  readingsScanned: number;
  qualityFindingsCreated: number;
  anomaliesCreated: number;
  alertsCreated: number;
  ecoScoresUpdated: number;
  latestEcoScore: number | null;
  errorSummary?: string;
};

function alertMessage(input: { meterName: string; observedValue: number; baselineMean: number; zScore: number }) {
  return `${input.meterName} recorded ${input.observedValue.toFixed(4)} against a rolling baseline of ${input.baselineMean.toFixed(4)} (z-score ${input.zScore.toFixed(2)}).`;
}

function resolveApprovedFactor(input: {
  factors: Awaited<ReturnType<typeof db.listApprovedEmissionFactors>>;
  resourceType: string;
  unit: string;
  observedAt: Date;
}) {
  return input.factors
    .filter((factor) => factor.resourceType === input.resourceType && factor.inputUnit.toLowerCase() === input.unit.toLowerCase())
    .filter((factor) => factor.validFrom.getTime() <= input.observedAt.getTime() && (!factor.validTo || factor.validTo.getTime() >= input.observedAt.getTime()))
    .sort((left, right) => right.validFrom.getTime() - left.validFrom.getTime())[0] ?? null;
}

export async function runMonitoringForOrganization(input: {
  organizationId: number;
  runKey: string;
  trigger: MonitoringTrigger;
}): Promise<MonitoringRunSummary> {
  const started = await db.beginMonitoringRun(input);
  if (!started.created) {
    const prior = started.summary ?? {
      readingsScanned: 0,
      qualityFindingsCreated: 0,
      anomaliesCreated: 0,
      alertsCreated: 0,
      ecoScoresUpdated: 0,
      latestEcoScore: null,
    };
    return {
      organizationId: input.organizationId,
      runKey: input.runKey,
      status: "skipped",
      readingsScanned: prior.readingsScanned,
      qualityFindingsCreated: prior.qualityFindingsCreated,
      anomaliesCreated: prior.anomaliesCreated,
      alertsCreated: prior.alertsCreated,
      ecoScoresUpdated: prior.ecoScoresUpdated,
      latestEcoScore: prior.latestEcoScore,
    };
  }

  try {
    const [readings, pendingReadings, approvedFactors] = await Promise.all([
      db.listReadingsForMonitoring(input.organizationId),
      db.listUnprocessedReadingsForMonitoring(input.organizationId, DATA_QUALITY_VERSION),
      db.listApprovedEmissionFactors(input.organizationId),
    ]);
    const pendingReadingIds = new Set(pendingReadings.map((item) => item.reading.id));
    const histories = new Map<number, number[]>();
    const qualityStatuses: ("passed" | "warning" | "failed")[] = [];
    const energyCarbonValues: number[] = [];
    let qualityFindingsCreated = 0;
    let anomaliesCreated = 0;
    let alertsCreated = 0;

    for (const item of readings) {
      const value = Number(item.reading.value);
      const findings = evaluateReadingQuality({
        value,
        unit: item.reading.unit,
        canonicalUnit: item.meter.canonicalUnit,
        resourceType: item.meter.resourceType,
        observedAt: item.reading.observedAt,
      });
      const isPending = pendingReadingIds.has(item.reading.id);
      if (isPending) {
        const qualityResult = await db.upsertQualityFindings({
          organizationId: input.organizationId,
          meterId: item.meter.id,
          readingId: item.reading.id,
          findings,
          evaluationVersion: DATA_QUALITY_VERSION,
        });
        qualityFindingsCreated += qualityResult.created;
      }
      qualityStatuses.push(...findings.map((finding) => finding.status));

      const priorValues = histories.get(item.meter.id) ?? [];
      const hasFailedQuality = findings.some((finding) => finding.status === "failed");
      const hasFutureTimestampWarning = findings.some((finding) => finding.ruleId === "future-timestamp" && finding.status === "warning");
      const isEligibleForAnalytics = !hasFailedQuality && !hasFutureTimestampWarning;
      if (isEligibleForAnalytics) {
        const anomaly = detectReadingAnomaly({ observedValue: value, history: priorValues });
        if (isPending && anomaly.detected && anomaly.severity) {
          const anomalyResult = await db.createAnomalyIfAbsent({
            organizationId: input.organizationId,
            siteId: item.reading.siteId,
            meterId: item.meter.id,
            readingId: item.reading.id,
            detectorVersion: ANOMALY_DETECTOR_VERSION,
            severity: anomaly.severity,
            baselineMean: anomaly.baselineMean,
            baselineStdDev: anomaly.baselineStdDev,
            observedValue: value,
            zScore: anomaly.zScore,
            evidence: { historySize: anomaly.historySize, readingObservedAt: item.reading.observedAt.toISOString() },
          });
          if (anomalyResult.created) {
            anomaliesCreated += 1;
            if (anomaly.severity !== "low") {
              const alertResult = await db.createMonitoringAlertIfAbsent({
                organizationId: input.organizationId,
                anomalyId: anomalyResult.anomalyId,
                severity: anomaly.severity,
                title: `${anomaly.severity.toUpperCase()} ${item.meter.displayName} deviation`,
                message: alertMessage({ meterName: item.meter.displayName, observedValue: value, baselineMean: anomaly.baselineMean, zScore: anomaly.zScore }),
              });
              alertsCreated += alertResult.created ? 1 : 0;
              if (alertResult.created) {
                await deliverOwnerNotificationForAlert({ organizationId: input.organizationId, alertId: alertResult.alertId });
              }
            }
          }
        }
      }

      if (isEligibleForAnalytics) {
        const factor = resolveApprovedFactor({ factors: approvedFactors, resourceType: item.meter.resourceType, unit: item.reading.unit, observedAt: item.reading.observedAt });
        const carbon = calculateCarbonForReading({
          resourceType: item.meter.resourceType,
          value,
          factor: factor ? { emittedKgCo2ePerUnit: Number(factor.emittedKgCo2ePerUnit), factorVersion: factor.factorVersion, calculationVersion: "factor-library-carbon-v1" } : undefined,
        });
        if (carbon) {
          if (isPending) {
            await db.upsertCarbonCalculation({
              organizationId: input.organizationId,
              meterId: item.meter.id,
              readingId: item.reading.id,
              ...carbon,
            });
          }
          energyCarbonValues.push(carbon.emittedKgCo2e);
        }
        histories.set(item.meter.id, [...priorValues, value]);
      }
    }

    const openAnomalySeverities = await db.listOpenAnomalySeverities(input.organizationId);
    const latestEnergyCarbonKg = energyCarbonValues.length ? energyCarbonValues[energyCarbonValues.length - 1] : null;
    const ecoScore = calculateEcoScore({
      qualityStatuses,
      openAnomalySeverities: openAnomalySeverities as AnomalySeverity[],
      latestEnergyCarbonKg,
      previousEnergyCarbonKg: energyCarbonValues.slice(0, -1),
    });
    await db.createEcoScoreSnapshot({
      organizationId: input.organizationId,
      score: ecoScore.score,
      components: ecoScore.components,
      calculationVersion: ecoScore.calculationVersion,
      windowStart: readings[0]?.reading.observedAt ?? null,
      windowEnd: readings[readings.length - 1]?.reading.observedAt ?? null,
    });
    await db.evaluateAlertEscalations(input.organizationId);

    const summary: MonitoringRunSummary = {
      organizationId: input.organizationId,
      runKey: input.runKey,
      status: "completed",
      readingsScanned: pendingReadings.length,
      qualityFindingsCreated,
      anomaliesCreated,
      alertsCreated,
      ecoScoresUpdated: 1,
      latestEcoScore: ecoScore.score,
    };
    await db.completeMonitoringRun({ ...summary, summary });
    await db.resolveMonitoringRecoveryForRun({ organizationId: input.organizationId, runKey: input.runKey });
    return summary;
  } catch (error) {
    const errorSummary = error instanceof Error ? error.message : "Unknown monitoring error";
    await db.failMonitoringRun({ organizationId: input.organizationId, runKey: input.runKey, errorSummary });
    return {
      organizationId: input.organizationId,
      runKey: input.runKey,
      status: "failed",
      readingsScanned: 0,
      qualityFindingsCreated: 0,
      anomaliesCreated: 0,
      alertsCreated: 0,
      ecoScoresUpdated: 0,
      latestEcoScore: null,
      errorSummary,
    };
  }
}

export async function runMonitoringForAllOrganizations(input: { runKey: string; trigger: Exclude<MonitoringTrigger, "manual"> }) {
  const organizations = await db.listOrganizationsForMonitoring();
  const results: MonitoringRunSummary[] = [];
  for (const organization of organizations) {
    results.push(await runMonitoringForOrganization({
      organizationId: organization.id,
      runKey: `${input.runKey}:org-${organization.id}`,
      trigger: input.trigger,
    }));
  }
  return results;
}
