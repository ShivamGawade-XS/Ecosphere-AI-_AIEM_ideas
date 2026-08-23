# EcoSphere AI Deployment Guide

This guide describes how to release EcoSphere AI safely. It does **not** claim that an external scheduler, live telemetry source, certified emissions factor, notification channel, automated backup, or invitation provider is active. Each needs separate operator evidence.

## Release Conditions

| Control | Required evidence |
|---|---|
| Source quality | `pnpm quality` passes from the intended release commit. |
| Remote CI | The included GitHub Actions workflow completes successfully on the remote branch. |
| Database | Reviewed migration SQL, pre-change backup reference, application evidence, and schema verification. |
| OAuth | Deployed callback, session handling, role checks, and tenant-isolation verification. |
| Storage | Managed storage access and action-evidence authorization verification. |
| Health | Deployed `/healthz` and `/readyz` return `200`; readiness disclosures are reviewed. |
| Monitoring | One controlled, persisted simulated/pilot run completes after deployment. |
| Recovery | An isolated database/storage restore drill is completed and retained. |

## Managed Publication

1. Save a verified project checkpoint.
2. Use the project Management UI **Publish** control.
3. Record deployed origin, checkpoint, timestamp, and release owner.
4. Complete all post-deployment smoke tests before enabling a scheduler.

Do not treat a development or preview URL as production-release evidence.

## Secret Management

Configure database, OAuth, session-signing, managed-service, and initial-owner values through the deployment platform’s secret-management interface. Never commit secret values. Verify that server credentials are absent from browser bundles, source control, browser output, report JSON, screenshots, and audit payloads.

## Local Release Gate

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm quality
```

The quality gate includes type-checking, Vitest, production build, and a whitespace diff check. Stop release work on any failure.

## Database Migration Procedure

> Historical migrations have been manually applied or repaired in the managed environment. Do not use a blanket migration replay or `pnpm db:push` as a production shortcut.

1. Change `drizzle/schema.ts`.
2. Run `pnpm drizzle-kit generate`.
3. Review generated SQL for tenancy, compatibility, index impact, data loss, and TiDB constraint-name limits.
4. Take and record a pre-change database snapshot/export.
5. Apply approved SQL through the managed database workflow.
6. Query the resulting schema and run an authorized read-after-write API check.
7. Run `pnpm quality` and retain migration ID, reviewer, timestamp, and verification output.

## Post-Deployment Smoke Test

```bash
export APP_URL="https://<deployed-origin>"
curl --fail --silent --show-error "$APP_URL/healthz"
curl --fail --silent --show-error "$APP_URL/readyz"
```

Confirm both return `200`. Retain returned `x-request-id` values with release evidence. Then verify OAuth sign-in, role boundaries, tenant isolation, action evidence storage, a clearly labelled simulated/pilot monitoring cycle, and Administration status visibility.

## Scheduler Trial and Recurrence

The browser does not own monitoring. The real external schedule should be configured only after the deployed origin is healthy.

1. Publish the verified checkpoint and complete the smoke test.
2. An owner prepares the scheduler trial in **Administration** and reviews the deployment gate.
3. Configure platform cron authentication to call:

   ```text
   POST https://<deployed-origin>/api/scheduled/monitoring
   ```

4. Run exactly one controlled trial.
5. Verify the tenant monitoring run, health record, score, anomalies, alerts, recommendations, and recovery evidence persisted.
6. Record schedule UID, task UID, cadence, owner, and disable procedure.
7. Enable recurrence only after review of the controlled result.

## Backup, Rollback, and Recovery

A project checkpoint restores application code only. It does not restore database contents, object-storage objects, OAuth configuration, scheduler configuration, or delivery history.

| Incident | Immediate action | Evidence |
|---|---|---|
| Code regression | Disable the schedule if needed and restore the last verified project checkpoint. | Checkpoint ID and post-rollback health/readiness checks. |
| Schema/data incident | Stop destructive writes; restore to an isolated target before production recovery. | Snapshot ID, target verification, row comparison. |
| Scheduler failure | Disable recurrence; inspect task UID, run key, and recovery evidence before one controlled retry. | Schedule/run/recovery evidence and named owner. |
| Storage issue | Verify managed object-reference authorization; never place file bytes into the database. | Authorized retrieval and policy evidence. |

An isolated restore drill must be completed before a production backup or recovery claim is made.

## External Dependencies and Claims

| Dependency | Current software support | Evidence needed for a production claim |
|---|---|---|
| Telemetry/Odoo | Ingestion and provenance foundations. | Configured source, data-quality evidence, accountable owner. |
| Emissions factors | Governed library and labelled fallback. | Approved factor source, method, validity, geography, approver. |
| Notifications | Routing/delivery evidence model. | Configured provider credentials and observed delivery result. |
| Invitations | Role-ready organization controls. | Selected identity/invitation provider, configured delivery, retained test. |
| CI | GitHub Actions workflow in repository. | Visible successful remote run. |
| Scheduler | Owner-gated planner and authenticated endpoint. | Successful deployed trial and persisted evidence. |

Until the chosen dependencies are independently evidenced, present the service as a **verified, production-oriented pilot**, not as an activated production service.

## Release Record

Record release owner, Git commit and branch, project checkpoint, deployed origin and timestamp, CI evidence, migration and backup references, OAuth/role verification, health/readiness outputs, scheduler metadata, controlled monitoring evidence, restore-drill evidence, and approved claim boundaries.

## Related Documents

- [README.md](README.md)
- [RELEASE_OPERATIONS_RUNBOOK.md](RELEASE_OPERATIONS_RUNBOOK.md)
- [MONITORING_OPERATIONS_RUNBOOK.md](MONITORING_OPERATIONS_RUNBOOK.md)
- [PRODUCTION_RELEASE_VALIDATION.md](PRODUCTION_RELEASE_VALIDATION.md)
