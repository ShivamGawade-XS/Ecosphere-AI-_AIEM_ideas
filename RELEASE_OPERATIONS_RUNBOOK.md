# EcoSphere AI Release Operations Runbook

**Status:** Release-operational foundation. This runbook documents the checks required before a production release; it does **not** assert that a live scheduler, external telemetry source, certified emissions factor, automated backup, or external notification delivery is active.

## Purpose and Release Boundary

EcoSphere AI has a tenant-scoped React, Express, tRPC, Drizzle, and MySQL/TiDB platform. Its monitoring worker is deliberately browser-independent and is exposed through an authenticated scheduled callback. A release is eligible only when the application artifact, applied database schema, storage access, OAuth configuration, recovery ownership, and worker trigger are all independently evidenced.

> A Manus checkpoint restores the application project state. It does **not** restore database contents, object-storage objects, OAuth configuration, an external scheduler, or external notification delivery. Database recovery therefore requires a separate backup-and-restore control.

| Control | Current implementation | Required release evidence | Release claim boundary |
|---|---|---|---|
| Application quality | `pnpm quality` runs type-checks, Vitest, build, and whitespace checks. | Clean command output from the release commit. | A GitHub workflow is included but must not be described as active until its first remote run is visible. |
| Database migrations | Drizzle schema and hand-reviewed additive SQL migrations are maintained. | Migration SQL reviewed, applied through the managed database workflow, and queried after application. | Do not run `pnpm db:push` against this environment’s partially/manual-applied historical migrations. |
| OAuth and authorization | Manus OAuth and tenant/role checks protect workspace procedures. | Login callback, owner, manager, operator, and tenant-isolation checks. | Email invitations are not delivered by this release. Members must already exist through the configured identity provider. |
| Health | `GET /healthz` and `GET /readyz` return liveness/readiness JSON. | `200` responses captured from deployed origin. | Readiness explicitly reports `scheduler: not_activated_in_this_environment` until a deployed scheduler is enabled. |
| Request telemetry | Every HTTP response emits a JSON completion record with correlation ID, method, path, status, and rounded duration. | A deployed response `x-request-id` header and matching structured log record. | Request bodies, headers, query strings, and raw errors are intentionally excluded from this telemetry. |
| Monitoring worker | One-shot worker and cron-only `/api/scheduled/monitoring` callback are implemented. | Successful deployed callback with a unique run key and persisted run record. | Browser refreshes do not control the worker; no scheduler is active merely because the UI is open. |
| Storage evidence | Action attachments use managed object storage references, not database blobs. | Upload/retrieve authorization test and storage lifecycle confirmation. | Storage retention and recovery are platform/owner controls, not guaranteed by this runbook. |

## 1. Release Preflight

Run the following commands from the release commit. Resolve any failure before proceeding.

```bash
pnpm install --frozen-lockfile
pnpm quality
curl --fail --silent --show-error https://<deployed-origin>/healthz
curl --fail --silent --show-error https://<deployed-origin>/readyz
```

The local development checks are useful but do not replace a deployed-origin health check. The repository includes `.github/workflows/quality.yml` for pull requests and pushes to `main`; ensure the repository receives this workflow and that its remote result is reviewed before relying on it as a release gate.

## 2. Database Change Procedure

The platform contains additive migrations that were applied manually because some foreign-key names needed to meet managed TiDB limits. Follow this order for every future schema change.

1. Edit `drizzle/schema.ts` and generate a migration with `pnpm drizzle-kit generate`.
2. Read the generated SQL. Confirm every statement is tenant-safe, additive where possible, and has index/FK names compatible with the managed database.
3. Record the target schema version and take a database backup or snapshot through the managed database owner before applying any DDL.
4. Apply reviewed SQL with the managed database execution workflow. Do **not** replay historic migrations blindly and do not use `pnpm drizzle-kit migrate` as a substitute for the recorded migration state.
5. Query the resulting table/index/constraint state, then run `pnpm check`, `pnpm test`, and a protected API read-after-write regression.
6. Record the migration identifier, reviewer, backup reference, execution timestamp, and verification output in the release record.

## 3. Backup and Restore Drill

Before the first production release, assign a named database/storage recovery owner. The owner must produce evidence for the following drill in a non-production target.

| Drill step | Success condition | Evidence to retain |
|---|---|---|
| Take a pre-change database snapshot | Snapshot is timestamped and associated with the target environment. | Provider snapshot/export identifier. |
| Restore to isolated target | Restored schema and tenant records can be queried without touching production. | Target connection evidence and row-count comparison. |
| Verify object references | Action evidence metadata still resolves through permitted storage access. | Authorized retrieval test; never include object contents in logs. |
| Run application verification | Restored target passes `GET /readyz`, tenant authorization, and a non-destructive reporting read. | Command/API outputs attached to release record. |
| Record recovery objective | The owner has documented acceptable data-loss and recovery-time objectives. | Approved operational policy. |

Do not claim an automated backup or recovery objective until this drill has been completed and retained by the responsible platform owner.

## 4. Deployment and Environment Checklist

Provision the managed production environment using secret management rather than committed `.env` files. Confirm the database connection, session/JWT material, OAuth application settings, object storage configuration, and application title/logo variables are present. Never expose secret values in screenshots, build logs, browser output, or audit payloads.

After deployment, verify the following in order: OAuth sign-in; owner and manager member visibility; operator denial from governance APIs; tenant isolation; managed attachment upload; public health endpoints; and a deterministic monitoring run against clearly labelled simulated/pilot data. Treat failures as release blockers unless the release scope explicitly excludes that component.

## 5. Scheduler Activation — Only After Deployment

The scheduled endpoint accepts only an authenticated cron request and derives an idempotent minute-bucket run key. Do not activate any recurring schedule before the application checkpoint is saved, the deployment has completed, and the deployed health checks pass.

1. Publish the reviewed checkpoint through the platform UI.
2. Confirm deployed `GET /healthz` and `GET /readyz` return `200` and review the readiness dependency disclosure.
3. Configure the external scheduler/Heartbeat to call `POST https://<deployed-origin>/api/scheduled/monitoring` using its platform-provided cron authentication.
4. Trigger one controlled manual scheduler run. Verify the monitoring run, alerts, scores, forecasts, and recommendations have persisted within the intended tenant.
5. Enable the recurring schedule only after the initial result and error/recovery behaviour have been reviewed.
6. Document the schedule UID, cadence, owner, alert-routing policy, last successful run, and disable procedure.

If the scheduler is not activated, retain the system’s explicit `not_activated_in_this_environment` status. Never imply continuous production monitoring from a local `pnpm monitor:once` execution or browser simulation.

## 6. Release Abort and Recovery

If a pre-deployment quality gate fails, do not publish. If an application regression is discovered after publishing, use the platform checkpoint history to restore the last verified application version. If a database migration has already changed data or schema, follow the independent backup/restore procedure; an application rollback alone does not reverse database state.

After any recovery, verify `/healthz`, `/readyz`, tenant authorization, database read-only reporting, and the monitoring target health. Disable scheduled monitoring before recovery whenever repeated runs could amplify a data or integration failure.

## 7. Ongoing Operational Checks

Review the `Readiness` workspace and tenant audit evidence after release. Investigate monitoring health states of `stale`, `failed`, or `recovery` according to `MONITORING_OPERATIONS_RUNBOOK.md`. Review all calculated carbon values with their selected governed factor or explicitly labelled pilot fallback; do not represent fallback calculations as certified carbon reporting.

| Cadence | Check | Owner |
|---|---|---|
| Each release | Quality gate, migration record, health endpoints, authorization regression. | Release owner |
| Daily while scheduler is active | Latest scheduled run, recovery events, unresolved alerts, and delivery evidence. | Operations owner |
| Before any destructive schema change | Backup reference and isolated restore rehearsal. | Database recovery owner |
| Quarterly or when access changes | Owner count, member roles, audit evidence, OAuth/session configuration. | Tenant owner |

## Current External Dependencies Still Required

The following items remain deployment/operator gates: a real scheduler configuration, live/certified telemetry sources, emission-factor certification and governance approval, external notification credentials and delivery verification, OAuth identity lifecycle/invitation provider, automated backups, a completed restore drill, and an observed remote CI run. Until those dependencies are independently evidenced, EcoSphere AI should be described as a verified, production-oriented pilot platform rather than a fully activated production service.
