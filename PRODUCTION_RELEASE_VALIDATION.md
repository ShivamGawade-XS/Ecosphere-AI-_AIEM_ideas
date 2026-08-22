# EcoSphere AI Production Release Validation Record

**Validation date:** 2026-08-22

**Release candidate:** R1–R4 foundation with R5/R6 deployment-dependent validation gates.

## Decision

The source project is a **verified production-oriented release candidate**, not an activated production service. The local/managed-preview application journeys, deterministic data pipeline, protected APIs, health/readiness disclosures, operational documentation, and automated regression suite have been validated. The deployment, external scheduler, identity lifecycle/invitations, certified emissions factors, live telemetry connectors, external notification delivery, backup restore drill, and remote CI execution remain operator-owned prerequisites.

## Verified Release-Candidate Journeys

| Journey | Evidence | Result |
|---|---|---|
| Tenant identity and role boundary | Owner/manager member list, owner-only role change, sole-owner write prevention, append-only audit evidence. Direct persistence and API tests are included. | Verified in automated tests and authenticated preview UI. |
| Trusted data import | CSV validation, deterministic duplicate rejection, preview replay, idempotent commit response, quarantine, factor governance, and correction lineage. | Verified through unit, router, worker, and Data Quality workspace tests. |
| Deterministic monitoring loop | Persisted readings feed quality checks, governed/pilot-factor carbon calculations, anomaly detection, alert lifecycle, EcoScore, forecast/recommendation evidence, and action workflows. | Verified previously with an explicitly labelled simulated HVAC spike and persistence after refresh; no live telemetry claim. |
| Decision support and reports | Server-authoritative scenarios, comparisons, evidence-linked recommendations, action evidence/completion rules, and saved report snapshots. | Verified by regression suite and documented workspace review. |
| Operational safety | Liveness/readiness endpoints, explicit inactive-scheduler state, structured correlation-safe request telemetry, recovery/runbooks, and release abort guidance. | Verified locally: `/healthz` and `/readyz` both returned `200`, database configured, scheduler explicitly not activated. |
| UI resilience | Tenant-scoped loading/error/empty states, keyboard skip path, focus visibility, reduced motion, accessible labels, live feedback, responsive workspace review. | Verified with targeted tests and full-page desktop/mobile review. |
| Release quality | `pnpm quality`: TypeScript, Vitest, production build, and whitespace diff. | Passed with 20 test files and 104 tests. |

## Required Operator Actions Before Production Activation

| Gate | Required action | Current status |
|---|---|---|
| Publish deployment | Create/review a checkpoint and use the platform **Publish** action. Capture deployed origin and run deployed `/healthz` and `/readyz`. | Not performed by this validation. |
| Remote CI | Push the included GitHub Actions workflow and confirm a remote quality run against the intended branch. | Workflow supplied; remote execution not evidenced. |
| OAuth identity | Validate redirect/callback, session expiry, owner/manager/operator access, and identity lifecycle on deployed origin. | Managed preview supported authenticated validation; deployment-specific identity operation remains pending. |
| Scheduler | After deployment health checks pass, configure the authenticated cron/Heartbeat callback, run one controlled cycle, inspect persisted run/recovery evidence, then enable recurrence. | Deliberately inactive. |
| Live sources | Configure and validate signed/supported meter or Odoo connectors, source-quality boundaries, and ownership. | Not configured; simulated/pilot inputs remain explicitly labelled. |
| Factor assurance | Load approved current regional factors with source, methodology, geography, validity, and accountable approver. | Pilot fallback and governed-factor mechanisms exist; certification is not asserted. |
| Notifications | Configure external delivery credentials, prove a delivery attempt/result, and assign escalation ownership. | Delivery architecture is present; no external-delivery guarantee. |
| Recovery | Retain database snapshot/export evidence and complete an isolated database/storage restore drill. | Runbook exists; drill has not been evidenced. |
| Performance | Capture deployed cold/warm-cache behavior and Core Web Vitals on representative mobile networks. | Entry chunk splitting verified at build time; deployed performance is unmeasured. |
| Accessibility | Run deployed keyboard-only and screen-reader validation; complete independent audit if a conformance claim is needed. | Implementation review passed; no formal certification. |

## Controlled Production Activation Sequence

1. Save a release checkpoint and publish through the platform UI.
2. Verify deployed health and readiness endpoints and confirm the correlation-safe request telemetry path.
3. Verify deployed OAuth and the tenant owner/manager/operator authorization boundaries.
4. Apply only reviewed, backed-up schema changes using the release runbook procedure.
5. Complete backup/restore rehearsal in an isolated environment.
6. Run the simulated-pilot monitoring demonstration once on the deployed origin; inspect score, alert, recovery, recommendation, action, and audit evidence.
7. Configure external source, notification, and factor dependencies as applicable, with retained evidence.
8. Enable the authenticated scheduler only after the preceding results are accepted by the operations owner.

> Never enable the scheduler simply because a browser simulation works. The worker is intentionally independent of the browser, and activation requires a deployed, authenticated external schedule plus retained monitoring and recovery evidence.

## Claim-Safe Release Statement

EcoSphere AI can be presented as an **AI-powered, evidence-grounded sustainability operations platform prototype with production-oriented controls**. It should not be represented as a live AIEM Campus telemetry system, certified carbon-reporting system, continuously scheduled production service, deployed external Odoo integration, externally escalated alert service, performance-certified web application, or guaranteed-savings engine until each corresponding operator gate above has been completed and evidenced.
