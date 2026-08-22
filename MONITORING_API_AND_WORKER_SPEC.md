# EcoSphere AI — Data Quality, Anomaly, EcoScore, and Monitoring Worker Specification

**Status:** Implementation contract for the authenticated AIEM Campus pilot.  
**Numerical authority:** Deterministic server code only. LLMs may explain persisted evidence later; they must not create or alter measurements, scores, thresholds, factors, or projections.

## 1. Execution model

EcoSphere uses a **shared monitoring engine** that is independent of the browser. It can be called from a protected manual procedure for verification or from a platform-scheduled HTTP callback for automated operation. The engine owns idempotency, quality results, anomaly events, carbon calculations, EcoScore snapshots, monitoring-run history, and alert creation.

| Option | Best for | Trade-off | Current implementation decision |
|---|---|---|---|
| Periodic managed callback | Five-minute or slower deterministic monitoring, with state in the database | Each run is request-scoped and must finish within the scheduler timeout | **Implement now.** One idempotent callback invokes the worker after deployment. |
| Always-on worker process | Sub-minute polling, persistent queues, or high-volume connector traffic | Requires persistent hosting and its operational cost | Keep as the scale-up path; do not create an in-process timer. |

The code must never use `setInterval`, `node-cron`, browser timers, or client polling to own monitoring. A future scheduled callback uses `POST /api/scheduled/monitoring`, authenticates a scheduler identity, and delegates to the same worker function that manual runs use. The project must be deployed before creating the schedule. [1]

## 2. Pipeline lifecycle

```text
Persisted reading
  → quality evaluation
  → carbon calculation (where configured)
  → rolling baseline/anomaly detection
  → anomaly-derived alert
  → EcoScore calculation
  → persisted monitoring-run summary
```

Every output has an organization identifier, source reading or meter reference, calculation/detection version, timestamp, and audit event. The worker uses two deterministic passes: a read-only chronological history pass for baselines and a write pass limited to readings without the versioned `required-value` quality finding. The monitoring run is idempotent through a unique `runKey`; duplicate triggers return the stored run summary instead of creating duplicate findings or alerts. A previously failed key can be safely retried.

## 3. Data-quality rules

The initial pilot uses transparent rules. They are deliberately conservative and are not represented as a calibrated production model.

| Rule ID | Rule | Outcome |
|---|---|---|
| `required-value` | Reading value is null, non-finite, or negative. | **Failed** finding; reading cannot contribute to score or analytics. |
| `canonical-unit` | Reading unit differs from the meter canonical unit. | **Failed** finding; normally blocked at ingestion. |
| `future-timestamp` | Observed timestamp is more than five minutes in the future. | **Warning** finding; excluded from anomaly baseline. |
| `high-absolute-value` | Reading exceeds the configured pilot safety ceiling for its resource type. | **Warning** finding; retained with a quality warning. |
| `duplicate-window` | Same meter and idempotency key already exist. | Blocked by the database uniqueness constraint at ingestion. |

The first release stores the quality result against the reading and calculation version. A later release will move hard limits and resource-specific thresholds into managed tenant configuration.

## 4. Anomaly detection

The pilot detector uses the prior accepted values for the same meter. It requires at least three prior readings. The baseline consists of the rolling arithmetic mean and sample standard deviation of up to the most recent 30 values before the candidate reading.

```text
zScore = (observedValue - baselineMean) / baselineStdDev
```

When standard deviation is zero, the engine uses a documented 10% of the baseline mean as a non-zero fallback dispersion. No anomaly is created for a meter with an insufficient baseline. The absolute z-score maps to a severity as follows.

| Absolute z-score | Severity | Alert behavior |
|---|---|---|
| `< 2.5` | No anomaly | None |
| `≥ 2.5 and < 3.5` | Low | Event only |
| `≥ 3.5 and < 4.5` | Medium | Persisted alert |
| `≥ 4.5 and < 6.0` | High | Persisted alert |
| `≥ 6.0` | Critical | Persisted alert |

Anomaly uniqueness is scoped to meter, reading, and detector version. The engine never creates a second alert for the same anomaly event.

## 5. Carbon calculation and EcoScore

The initial carbon calculation applies only to `energy` readings. It uses a clearly marked **pilot electricity factor** of `0.82 kgCO₂e/kWh`, calculation version `pilot-carbon-v1`. This is a configuration placeholder for the AIEM demo, not a certified regional factor library.

The EcoScore is a deterministic 0–100 operational signal. It starts at 100 and subtracts penalties from the current monitoring run.

| Component | Penalty |
|---|---|
| Failed quality finding | 20 per finding, capped at 40 |
| Warning quality finding | 5 per finding, capped at 20 |
| Open low/medium/high/critical anomaly | 3 / 8 / 15 / 25 each, capped at 50 |
| Current energy carbon above 20% of the 30-reading carbon baseline | 10 |

```text
EcoScore = clamp(0, 100, 100 - qualityPenalty - anomalyPenalty - carbonTrendPenalty)
```

Every snapshot persists the components, calculation version, data-window metadata, and timestamp. The score is an operational indicator, not a regulatory or financial rating.

## 6. Core persistence contract

| Record | Ownership | Required fields |
|---|---|---|
| `data_quality_findings` | Organization + reading | rule ID, pass/warning/fail status, message, details JSON, evaluation version, evaluated timestamp |
| `carbon_calculations` | Organization + reading | factor, factor version, emitted kgCO₂e, calculation version, computed timestamp |
| `anomaly_events` | Organization + meter + reading | baseline values, z-score, severity, detector version, status, evidence |
| `monitoring_alerts` | Organization + anomaly | title, message, severity, open/acknowledged/resolved status, timestamps |
| `eco_score_snapshots` | Organization (+ optional site) | score, component JSON, calculation version, window metadata, computed timestamp |
| `monitoring_runs` | Organization/all organizations | run key, trigger, status, counts, error summary, start/finish timestamps |

## 7. tRPC API specification

All procedures are tenant-scoped and require an authenticated membership. Organization membership is checked before every query or mutation.

| Procedure | Permission | Input | Output | Purpose |
|---|---|---|---|---|
| `monitoring.runOnce` | Owner, manager, operator | `organizationId`, optional `runKey` | Run summary | Manually execute the deterministic monitoring pipeline for testing or recovery. |
| `monitoring.status` | Any member | `organizationId` | Latest run, latest score, open alerts, counts | Show browser-independent monitoring health. |
| `analytics.overview` | Any member | `organizationId` | Latest run/score, recent alerts and anomalies, quality counts, and carbon totals | Power operations overview and intelligence surfaces. |
| `analytics.qualityFindings` | Any member | `organizationId` | Most recent 50 quality findings | Review data-quality evidence in the pilot UI. |
| `analytics.anomalies` | Any member | `organizationId` | Most recent 25 anomaly events | Review detected anomalies. |
| `alerts.list` | Any member | `organizationId` | Most recent 25 alert records with anomaly/meter evidence | Review alert lifecycle. |
| `alerts.acknowledge` | Owner, manager, operator | `organizationId`, `alertId` | Updated alert | Record accountable acknowledgement. |
| `analytics.ecoScoreHistory` | Any member | `organizationId`, optional `limit` (1–100) | Persisted score snapshots | Render the transparent score timeline. |

## 8. Scheduled worker callback

`POST /api/scheduled/monitoring`

The handler authenticates the callback through the platform SDK. It rejects normal user traffic and accepts only a scheduler identity with a task UID. It creates a deterministic task-UID plus UTC-minute-bucket run key, invokes the worker, returns JSON, and catches errors as JSON with context for investigation. The one-minute bucket makes platform retries idempotent without trusting request-body fields. It is mounted before the development/static fallback. [1]

```json
{
  "ok": true,
  "taskUid": "task_example",
  "results": [
    {
      "status": "completed",
      "readingsScanned": 12,
      "anomaliesCreated": 1,
      "alertsCreated": 1,
      "ecoScoresUpdated": 1
    }
  ]
}
```

## 9. Operational scripts

`pnpm monitor:once` executes the same worker logic once from the server runtime. It is for local validation and controlled recovery; it is not a long-lived scheduler.

After deployment, the owner creates a periodic job with a minimum one-minute cadence. A five-minute cadence is recommended for the AIEM pilot until source volume and dashboard freshness requirements are measured. [1]

## 10. Guardrails

The monitoring worker must not call an LLM. Numerical data and state transitions are deterministic and traceable. An optional future explanation service can render a persisted anomaly/alert into natural language only after the event exists, and must cite the event’s stored evidence.

## References

[1]: https://www.manus.im "Managed scheduled callbacks and persistent-service platform documentation"
