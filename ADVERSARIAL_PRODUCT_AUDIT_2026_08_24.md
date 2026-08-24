# EcoSphere AI — Adversarial Product Audit

**Audit date:** 24 August 2026
**Scope:** Current repository behavior, automated coverage, protected-workspace code paths, public narrative review, local production artifact, GitHub quality workflow, and deployed liveness/readiness evidence.
**Deferred by instruction:** Vercel database/OAuth configuration, real invitation delivery provider, live IoT hardware, scheduled production worker activation, restore rehearsal, and externally measured production performance/accessibility.

> **Historical baseline: 70/100. Current locally verified repository assessment: 78/100.** The codebase now has a server-owned, clearly simulated guided campus demo; deterministic SDG and target evidence; structured auth redirects; bounded worker history; an explicit MySQL/TiDB pool; and enriched export evidence. The local full quality gate passed with 41 test files / 168 tests, TypeScript, production build, production-dependency audit, whitespace check, and isolated built-artifact `/healthz` verification. It is **not** a 100/100 production platform or enterprise-certified system: production database/OAuth setup, externally validated tenant flows, activated scheduling, restore rehearsal, distributed rate limiting, independent security testing, and a live IoT pilot remain deliberately unverified external gates.

## Scorecard

| Dimension | Score | Verified strengths | Material gaps blocking a higher score |
|---|---:|---|---|
| Product completeness | 16/20 | Tenant registry, meter intake, CSV quarantine/correction, deterministic monitoring, scenarios, accountable actions, reports, targets, and an explicitly simulated guided campus flow are real persisted workflows. | Initial tenant setup remains manual; presentation spans workspaces; the report is an export-ready evidence package rather than a formatted stakeholder document; real connectors remain unverified. |
| Intelligence and sustainability evidence | 15/20 | Deterministic quality checks, rolling anomaly detection, carbon calculations, EcoScore, forecasts, recommendation evidence, scenario comparison, and modeled SDG contribution outputs are server-backed. | Forecasting is a short moving-average method; recommendation logic remains rule-driven and shallow; modeled SDG indices are disclosed pilot calculations rather than certified achievement; no live data connector is validated. |
| User experience and demo readiness | 13/15 | The narrative, signed-out bridge, dashboard controls, and workspace feedback are polished and responsive; the guided demo reduces multi-step presenter setup. | Authentication remains an external operator gate; initial tenant setup is manual; a unified presenter mode and end-to-end authenticated browser proof remain outstanding. |
| Security and tenancy | 17/20 | Tenant-scoped data access, session version revocation, state-bound OAuth, structured auth redirect handling, CSP/HSTS, origin checks, request limits, validated ingestion, storage boundaries, and IoT credential/replay controls are implemented and regression-tested. | Rate limits are still in-process rather than distributed; public production identity/data are unconfigured; no independent penetration test has occurred. |
| Reliability and operations | 10/15 | Worker runs are idempotency-keyed, use a bounded history, have health/recovery records, use deterministic pipeline stages, and now reuse a bounded MySQL/TiDB pool; local production startup, CI, and Vercel liveness were previously verified. | No load/performance benchmark, production restore rehearsal, production database-flow proof, or distributed queue/scheduler activation exists. |
| Quality, accessibility, and maintainability | 7/10 | Regression coverage now includes OAuth-state encoding/cookie attributes, UTC target boundaries, auth-profile persistence, pool policy, reports, demo flow, SDG impact, target assessment, routes, focus styles, reduced motion, and viewport zoom. | Test coverage is not measured; end-to-end tests depend on real OAuth; some mutation feedback is not consistently announced; no independent accessibility audit or browser-matrix test exists. |

## What Is Real and Reusable

The core is **not a static mockup**. The organization/site/meter/reading model persists tenant-scoped records. The worker evaluates data quality, carbon, anomalies, alerts, EcoScore, and deterministic recommendations in [server/workers/monitoringWorker.ts](server/workers/monitoringWorker.ts). CSV imports retain source, validation, quarantine, correction, and factor lineage. Scenario calculations and comparisons are server-authoritative, while actions, evidence references, and report snapshots preserve accountability.

The architecture is therefore reusable for a serious pilot: it already separates browser UX from server-owned monitoring, labels modeled/simulated evidence, and avoids allowing an LLM to invent numerical outputs. The security posture is substantially stronger than a typical competition prototype, particularly around tenant ownership, session revocation, storage access, telemetry provenance, and response headers.

## Critical Product Flaws

| ID | Severity | Evidence | Why it matters | Required remediation |
|---|---|---|---|---|
| P-01 | Resolved locally | [server/demo/simulation.ts](server/demo/simulation.ts) and [server/domain/demoSimulation.ts](server/domain/demoSimulation.ts) implement tenant-scoped baseline setup, bounded cycles, a fixed 260 kWh HVAC spike, pipeline refresh, and reset of demo-owned evidence only. | The core presenter loop is now real server-owned functionality, not a browser timer. | Obtain authenticated browser and production-operator evidence before claiming deployed demo operation. |
| P-02 | Resolved locally | [server/domain/sdgImpact.ts](server/domain/sdgImpact.ts) calculates disclosed pilot modeled contribution indices for SDGs 7, 9, 11, 12, and 13; scenario/action/report surfaces retain the resulting evidence. | SDG claims now derive from deterministic scenario outputs rather than narrative labels alone. | Keep the explicit non-certification disclosure; validate any future institutional methodology separately. |
| P-03 | Resolved locally | The signed-out bridge explains the protected workspace, provides sign-in and public-narrative escape routes, and preserves a branded fallback. | A judge is no longer presented with an unexplained protected-area failure. | Complete real OAuth browser-flow verification after operator configuration. |
| P-04 | Resolved locally | [server/workers/monitoringWorker.ts](server/workers/monitoringWorker.ts) uses an in-place bounded 30-reading history matching detector semantics. | Prevents history copying growth within the pilot window. | Add a measured load benchmark before scaling the worker beyond pilot assumptions. |
| P-05 | Resolved locally | [client/src/lib/authRedirect.ts](client/src/lib/authRedirect.ts) recognizes structured `UNAUTHORIZED` errors and applies a single-flight redirect guard; regression tests cover non-auth errors. | Error wording no longer controls login navigation. | Validate the deployed OAuth callback after identity configuration. |
| P-06 | Partially resolved locally | Comparison v2 persists each normalized weighted component and its point contribution; the Scenario UI surfaces these components. Recommendation evidence now records a severity-tier method, attached evidence, and limitations; reusable pilot templates preserve user baselines and disclose that they are not procurement estimates. | A reviewer can inspect why a rank or confidence label exists instead of treating it as opaque AI. | Forecasting remains a short moving-average method and templates use deliberate pilot defaults; do not imply predictive accuracy, vendor pricing, or autonomous intervention selection. |
| P-07 | Resolved locally | Persisted tenant/site targets cover energy, water, waste, carbon, and EcoScore; the executive overview evaluates attained/at-risk status and evidence freshness over explicit UTC windows. | Mission control now compares accepted evidence against saved intent. | Validate target creation/assessment in an authenticated deployed tenant. |
| P-08 | Partially resolved locally | Evidence snapshot v2 includes bounded targets, scenarios, comparisons, recommendations, monitoring state, factors, and explicit simulated-demo provenance. | Report data is now more complete and traceable for export or a presentation layer. | Build a formatted stakeholder document/PDF only if that becomes a competition deliverable; do not represent JSON evidence as a certified report. |

## Security and Reliability Findings

The following are important limitations rather than unverified accusations. Where a prior independent review suggested a mismatch in OAuth state-cookie attributes, current source inspection shows both creation and clearing use `SameSite=Lax`; that specific mismatch is **not present** in the current code. The login redirect coupling remains a real code-quality and resilience issue.

| ID | Severity | Current condition | Practical improvement |
|---|---|---|---|
| S-01 | Medium | Rate limits are process-local and cannot provide a shared Vercel/edge defense. | Retain current guard, then add edge/distributed limiting only with the selected production provider. |
| S-02 | Medium | Automatic login redirect depends on a message string instead of typed error data. | Use structured tRPC error codes and deduplicate redirect attempts. |
| S-03 | Medium | Storage/media failures can leave a public narrative asset blank without a product fallback. | Add a decorative-safe image fallback and error state for non-decorative assets. |
| S-04 | Medium | Worker analytics are serial and no load benchmark exists. | Cap history in code, add a deterministic high-reading-count regression, and document scalability limits. |
| S-05 | Medium | Production restore, invitation delivery, OAuth, DB readiness, live IoT, and scheduler checks require external configuration. | Keep these as explicit release gates; do not fabricate execution evidence. |
| S-06 | Low | No measured coverage threshold, accessibility audit, browser matrix, or independent security test is available. | Add CI coverage reporting and plan independent verification after external gates are opened. |

## Feature Catalogue: Highest-Value Functional Additions

| Priority | Feature | User value | Deterministic/traceable basis | Acceptance evidence |
|---|---|---|---|---|
| 1 | Guided Live Demo Simulation | A judge can operate the full loop in minutes. | Fixed campus fixture, deterministic cycle values, controlled spike, server worker evidence. | Start, cycle, spike, alert, recommendation, reset tests. |
| 1 | SDG Impact Engine and Executive View | Converts sustainability metrics into competition-relevant outcomes. | Explicit SDG mapping rules based on energy/water/waste/carbon/action/scenario data. | Unit tests for each mapping and tenant-scoped UI states. |
| 1 | Goal and Target Tracking | Shows progress against defined intent, not isolated readings. | Saved target windows, units, and deterministic achieved/at-risk status. | CRUD/authorization tests and overview widgets. |
| 2 | Demo Entry and Presenter Mode | Removes login/narrative confusion and makes the product legible in 30 seconds. | Intent-preserving routing and clear call-to-action state. | Route and keyboard tests; desktop/mobile review. |
| 2 | Data Freshness and Meter Coverage | Makes missing/late readings visible before decisions are made. | Latest timestamps and expected cadence per meter. | Deterministic stale/fresh status tests. |
| 2 | Executive Evidence Export | Produces a concise, traceable stakeholder package. | Existing overview, scenario, alert, action, factor, SDG, and disclosure records. | Snapshot structure and tenant-isolation tests. |
| 3 | Comparative Intervention Library | Reduces manual scenario entry for common campus interventions. | Versioned template assumptions with clear pilot disclaimers. | Template version and scenario-save tests. |
| 3 | Explainability Timeline | Shows source → quality → anomaly → alert → recommendation → action. | Existing IDs and audit records. | Read-only lineage query and UI regression. |
| 3 | Operational Baseline Manager | Lets a manager mark/compare validated baseline windows. | Explicit time range and meter selection; no inferred campus claims. | Baseline selection and comparison tests. |
| 4 | Connector Adapters | Moves from manual/CSV input to approved IoT/Odoo feeds. | Validated mappings and provenance contracts. | Requires separate integration approval and live credentials. |

## Honest 100/100 Standard

EcoSphere AI cannot be honestly called **100/100** until both the product and the operating environment meet their release criteria. The next repository-level target is a **highly demonstrable, feature-complete pilot** with the Live Demo Simulation, SDG evidence, targets, presenter entry, structured auth handling, bounded analytics, and report package implemented and verified. A production-grade claim remains conditional on the deferred external gates, measured performance/accessibility, production authorization tests, recovery rehearsal, independent security review, and real controlled data/hardware pilot.

## Recommended Immediate Build Order

1. Implement the deterministic Live Demo Simulation, controlled spike, and demo reset path.
2. Add the SDG impact engine and executive impact workspace, then connect scenarios/actions to it.
3. Add targets, freshness status, and a coherent executive overview.
4. Repair structured unauthorized handling, optimize worker history, and harden demo entry/media fallback.
5. Add an executive evidence export and traceability timeline.
6. Re-run full verification, then rescore the repository without treating deferred production gates as complete.
