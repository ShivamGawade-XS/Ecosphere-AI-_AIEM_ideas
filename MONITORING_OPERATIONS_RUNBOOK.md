# Monitoring Operations Runbook

## Operating model

EcoSphere monitoring is **browser-independent**. The deterministic worker is executed through one of three bounded entry points: a protected manual action, the one-shot `pnpm monitor:once` CLI, or the cron-authenticated `POST /api/scheduled/monitoring` callback. No browser interval, in-process timer, or LLM loop is used.

> **Current status:** The protected scheduled callback and health target configuration exist in the application. No live platform schedule is configured from this repository or implied by this document.

## Scheduler activation after deployment

1. Publish a tested checkpoint and confirm the production service starts successfully.
2. Open **Administration → Authenticated scheduler trial** as a manager or owner. Save a tenant-scoped trial plan with the required cadence and stale-after threshold. Saving the plan does **not** create a schedule.
3. Open the deployed `/healthz` and `/readyz` endpoints from the Administration workspace. Confirm that liveness is healthy and the database is configured.
4. A tenant **owner** can then activate the trial. The application creates or resumes only the task UID bound to that tenant’s persisted monitoring target; the callback rejects normal user traffic and resolves the tenant from the platform task UID, never from callback request data.
5. Configure an initial 15-minute cadence only if the monitored data volume supports it. Each callback uses a task-UID and UTC-minute-bucket run key.
6. Verify a scheduled run appears in `monitoring_runs` with `trigger = scheduled`, then verify the Administration and Intelligence health state becomes `healthy`.
7. If the run is not healthy, pause the trial from Administration, inspect recovery evidence, remediate, and repeat one controlled trial before enabling reliance on recurrence.

The scheduler must not be activated solely by toggling the in-app health target or saving a trial plan. These actions record expected behavior and prepare a safe activation request; only the deployed owner-controlled activation creates external infrastructure.

## Idempotency and recovery

Every monitoring run is uniquely keyed by `(organizationId, runKey)`. Repeating a completed key returns a skipped result rather than duplicating quality findings, carbon calculations, anomalies, alerts, or EcoScore snapshots. Failed keys can be safely retried because the run record is reopened and individual analytical writes remain idempotent.

If a run fails, EcoSphere persists a `monitoring_recovery_events` record. A manager or owner may use **Run controlled retry**, which writes a new retry run key and leaves an evidence trail. The recovery event is resolved only if that matching retry run completes. Investigate the failure reason before repeated retries; do not use retries as an uncontrolled loop.

## Health states

| State | Meaning | Operator response |
|---|---|---|
| `not_enabled` | No health target or no expected schedule is enabled. | Configure an expected cadence after the deployed scheduler exists. |
| `healthy` | Latest scheduled run is within the configured stale threshold. | Review normal alerts and delivery evidence. |
| `stale` | No scheduled run exists or the last one exceeds the stale threshold. | Verify the platform schedule, scheduler identity, deployment logs, and run key generation. |
| `failed` | Latest scheduled run failed. | Review the durable error summary, open the recovery event, and perform one controlled retry after remediation. |

## Alert routing and delivery

Alert routing is **opt-in** and currently supports only the platform’s project-owner notification channel. A manager or owner configures a minimum severity. When a newly created anomaly alert meets that threshold, EcoSphere attempts a delivery and stores an immutable delivery-attempt outcome:

- `delivered`: the upstream owner notification service accepted the request;
- `failed`: the service did not accept the request or returned an error;
- `suppressed`: routing is disabled or the alert is below threshold;
- `queued`: reserved for future asynchronous channels.

The dashboard must never characterize a `failed` or `suppressed` attempt as an external notification. Email, SMS, Slack, campus escalation, and guaranteed incident response are not implemented by this channel.

## Bounded in-app escalation

EcoSphere also supports a separate, **disabled-by-default in-app escalation policy**. This is not an external messaging channel. A manager can configure a minimum alert severity and a minimum open-alert duration. During a subsequent bounded monitoring pass or an authorized manual evaluation, the deterministic evaluator records one of four durable lifecycle states for each eligible alert:

| State | Meaning |
|---|---|
| `pending` | The alert qualifies but has not yet reached its configured open-duration threshold. |
| `triggered` | The threshold was reached and EcoSphere created a linked sustainability action for accountable follow-up. |
| `suppressed` | The alert is below the configured escalation severity threshold. |
| `resolved` | A pending escalation was resolved by alert acknowledgement before triggering. |

Triggered escalation creates an in-app action with source `monitoring_escalation`; it does **not** notify a campus team, send email/SMS/Slack, create a help-desk ticket, or guarantee remediation. Operators must use the linked action workflow to assign, execute, and evidence the response.

## Controlled validation procedure

1. Use an explicitly labeled simulated-pilot energy baseline and spike; never represent test data as official campus telemetry.
2. Run the monitoring worker manually once and confirm the persisted anomaly and alert evidence.
3. Keep routing disabled for the first verification. Confirm the delivery attempt is `suppressed`.
4. If owner delivery is appropriate for the environment, enable the route at `high` or `critical`, generate one controlled eligible alert, and confirm the delivery record’s true status.
5. Disable the route again after the test unless there is an approved operational owner.

## Commands

```bash
# One bounded, browser-independent monitoring pass
pnpm monitor:once

# Release quality gate
pnpm check && pnpm test && pnpm build
```

Use the deployed scheduler callback for recurring work. The CLI is an operator recovery and controlled-validation tool, not a long-running production daemon.
