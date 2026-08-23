# EcoSphere AI — Production Readiness Assessment

**Assessment date:** 22 August 2026  
**Assessed artifact:** `/home/ubuntu/ecosphere-ai-website`  
**Assessment outcome:** **Not production-ready. Suitable as a polished, truthful AIEM demonstration and product narrative, not as a live sustainability operations platform.**

## Executive assessment

The present EcoSphere AI website is a high-quality **static prototype**. It tells the intended product story well, demonstrates a deterministic browser-side scenario model, provides intervention presets with short processing feedback, and correctly labels the data and outcomes as simulated. It is not, however, connected to a production data plane, a durable backend, or an authenticated user environment. The current Node server only serves static files; the public page has no API calls, database access, identity flow, live telemetry channel, or background job runtime.

> **The most important conclusion is architectural:** the current website should be treated as the presentation layer for EcoSphere AI, not the EcoSphere AI platform itself. Calling it a production sustainability management system today would be misleading.

No audit can prove a literal absence of every possible flaw. This document inventories the material gaps that would block a credible production launch, organized by product risk and implementation dependency. It also distinguishes **demo-safe polish already present** from **capabilities that must be built and verified**.

| Area | Current status | Launch implication |
|---|---|---|
| Public experience | Polished, responsive, accessible baseline | Good for a demonstration and early product validation |
| Scenario simulation | Deterministic, but browser-local and fixed-baseline | Not authoritative or auditable for customer decisions |
| Data ingestion | Absent from the current website | No live sustainability monitoring is possible |
| Backend and database | Absent from the current website | No persistence, users, jobs, alerts, or audit history |
| Security and governance | Prototype-level only | Cannot safely hold customer, meter, or user data |
| Reliability and operations | No observability, CI/CD, incident response, or recovery design | Cannot be operated as a dependable service |
| Test assurance | Build/type checks only; no automated test suite | Regressions and calculation errors can reach users |

## What is already working well

The current experience has several strengths that should be retained. The Field Operations Ledger visual system creates a distinct sustainability-operations identity rather than a generic dashboard. The page provides accessible labels for scenario inputs, meaningful image alternative text, keyboard-operable mission-loop tabs, mobile responsiveness, and reduced-motion consideration. Intervention presets now show a short processing state, disable concurrent preset selection, and announce their modeled update through a live status region.

The messaging is also responsibly bounded. It explicitly distinguishes simulated data from live evidence, avoids claims of verified Odoo connectivity, certified reporting, guaranteed savings, or production tenancy, and states that language-model use should explain rather than invent environmental numbers. These are essential trust behaviors and should remain mandatory in every future release.

## Evidence from the present codebase

| Evidence | Finding | Consequence |
|---|---|---|
| `client/src/pages/Home.tsx` | One page contains fixed baseline constants, intervention preset values, local React state, and browser-side calculations. | Scenario results disappear on reload and are not source-of-record calculations. |
| `client/src/pages/Home.tsx` | Preset processing uses a short client-side timeout solely to present feedback. | It is UI feedback, not a queued server calculation, traceable execution, or failure-aware job. |
| `server/index.ts` | The Express process only serves the built frontend and returns `index.html` for client routing. | There are no API endpoints, authorization checks, health endpoints, or domain services. |
| `package.json` | Scripts include development, build, start, preview, type checking, and formatting; no test, lint, E2E, or audit script is declared. | There is no repeatable release-quality gate. |
| Test-file inventory | No `*.test.*` or `*.spec.*` files were found. | No automated regression assurance exists for calculation logic or key user flows. |
| `pnpm audit --prod --json` | The audit reports 16 high, 47 moderate, and 8 low advisories; no critical advisory was reported. | Dependency remediation and advisory triage are release blockers. |
| `client/index.html` | One meta description and analytics placeholder are present; no complete social metadata, canonical URL, sitemap, robots strategy, consent path, or structured data is present. | Discoverability and privacy controls are incomplete. |

## Critical launch blockers

The following gaps must be resolved before EcoSphere AI is offered as a live, multi-user sustainability product. They are not cosmetic improvements; they are capabilities without which the system cannot safely make operational claims.

| ID | Missing capability or flaw | Why it blocks production | Required implementation | Acceptance criterion |
|---|---|---|---|---|
| P0-01 | **No production backend or durable domain model in the current project.** | The site cannot persist organizations, sites, meters, readings, scenarios, alerts, or decisions. | Add an application backend, transactional database, schema migrations, repositories, and server-side domain services. | Data created by an authorized user remains correct after browser restart, deployment restart, and concurrent access. |
| P0-02 | **No authentication, authorization, or tenant isolation.** | Anyone who reaches the page sees the same prototype; no person, campus, or organization can be reliably identified. | Implement SSO/passwordless login, session management, MFA policy for privileged roles, role-based access control, organization/site scoping, and authorization tests. | Every protected request is authenticated, authorized, tenant-scoped, and denied by default. |
| P0-03 | **No live data ingestion path.** | There is no way to receive meter, BMS, IoT, CSV, utility, waste, or water data. | Build authenticated ingestion APIs, CSV import, connector adapters, schema validation, time-zone normalization, unit conversion, idempotency, and quarantine handling. | A valid reading is persisted exactly once; invalid rows are rejected with a traceable reason and no partial silent corruption. |
| P0-04 | **No background monitoring worker in the present deployment.** | The browser cannot be responsible for anomaly detection, forecasting, scoring, or alert generation. | Run a separate, persistent scheduler/worker with durable job state, retries, idempotency keys, locks, bounded concurrency, and dead-letter handling. | Browser closure, API restart, and worker restart do not lose or duplicate a monitoring cycle. |
| P0-05 | **Scenario calculations are client-side and use fixed sample constants.** | Users could alter or misinterpret results, and the results have no audit record or factor version. | Move calculation authority to the backend; version inputs, factors, equations, assumptions, model version, and output provenance. | Every displayed result is reproducible from immutable request inputs, named factor versions, and server calculation code. |
| P0-06 | **No real anomaly, forecast, alert, or recommendation pipeline is connected to the website.** | The demonstrated HVAC signal is narrative content, not a live operational event. | Implement data-quality checks, anomaly thresholds/models, forecast pipeline, alert lifecycle, evidence-backed recommendations, and human acknowledgement. | A controlled input spike produces one persisted anomaly, one correlated alert, a score update, and an evidence-linked recommendation. |
| P0-07 | **No security foundation for customer data.** | The static project has no identity, audit logs, secure API policy, security headers, rate limits, incident controls, or secrets strategy. | Adopt a security baseline such as OWASP ASVS; add secure session design, input validation, output encoding, CSRF protection where applicable, rate limits, CSP, HSTS at the edge, secrets management, audit logging, and security testing. | Security review maps controls to a chosen ASVS level and verifies every exposed endpoint. [1] |
| P0-08 | **No backup, recovery, retention, or deletion capability.** | Operational and sustainability records would be unrecoverable or retained without policy. | Define encryption, backup frequency, recovery-point and recovery-time objectives, restore drills, retention schedules, export/delete workflows, and data-owner responsibilities. | A restore drill recreates a clean environment from backup within the declared recovery target. |
| P0-09 | **No production deployment topology.** | The static server alone cannot provide worker execution, a database, health checks, rollout safety, or environment separation. | Establish managed production infrastructure, separate dev/staging/prod configuration, TLS/domain ownership, migrations, health/readiness checks, job hosting, and rollback. | A staged deployment promotes a signed build, runs migrations safely, exposes readiness, and rolls back without data loss. |
| P0-10 | **No automated test suite or release gate.** | Type checking and a successful bundle do not prove correctness, security, or user-flow reliability. | Add unit, integration, API contract, worker, E2E, accessibility, visual regression, performance, and security tests into CI. | A release is blocked when required tests, audit threshold, migration check, or accessibility gate fails. |

## Product capabilities that are still required

The product must move beyond a compelling landing experience into a daily operational workspace. The table below shows the major capability groups missing from the current artifact and the expected production behavior.

| Product domain | Current reality | Required production functionality |
|---|---|---|
| Organization setup | No account, campus, site, building, meter, or user administration. | Onboarding wizard; organization hierarchy; meter registry; meter health; role assignment; site-level settings; data ownership declarations. |
| Resource data | Fixed, simulated narrative values. | Energy, water, waste, fuel, renewable, procurement, and transport measurement schemas; source metadata; units; time zones; intervals; quality flags; manual correction with approval. |
| Carbon accounting | Browser model converts a fixed baseline into a fixed output. | Factor library with country/region/fuel/electricity context, effective dates, source citation, scope category, factor version, uncertainty, and calculation ledger. |
| EcoScore | Visual concept only in this artifact. | Transparent weighted score definition, time period, missing-data policy, versioning, drill-down, historical comparison, and configuration governance. |
| Intelligence | Static explanation wording and preset logic. | Deterministic anomaly/forecast services; recommendation rules; minimum evidence thresholds; human-review queue; confidence and limitations; model monitoring. |
| Action management | No task execution state. | Assign recommendation owner, due date, investment approval, evidence upload, action status, expected vs realized outcome, and closure criteria. |
| What-if planning | Six client inputs and four preset buttons, without saved scenarios. | Server-authoritative simulations, named scenario versions, comparison, sensitivity analysis, assumptions, sharing, approval workflow, PDF/CSV export, and realized-vs-projected measurement. |
| Alerts | One static example. | Alert severity, deduplication, routing, acknowledgement, escalation, snooze, notification preferences, incident timeline, and resolution evidence. |
| Reporting | No true dashboard, scheduled report, or data export. | Role-specific dashboards, filters, date ranges, drill-down, scheduled reports, audit-ready exports, and clearly marked data confidence. |
| Data import/export | No working user flow. | Validated CSV template, mapping UI, preview, error report, import history, idempotent retry, signed export, and data-portability policy. |
| Collaboration | No users or comments. | Notes, mentions, attachments, review/approval trails, retention rules, and notification settings. |
| Customer support | No support surface. | Contextual help, status page, incident communications, support intake, runbooks, and account-offboarding process. |

## Data and sustainability-science controls

Sustainability software is not production-ready merely because its arithmetic is deterministic. It must be able to explain **where a number came from, which factor and methodology were used, who changed an input, and why a result changed**. That means retaining immutable source identifiers and derivation records rather than only storing final totals.

| Required control | Gap today | Production standard |
|---|---|---|
| Data provenance | Simulated label is present, but no source ledger exists. | Record source system, meter ID, raw payload hash, ingestion time, data owner, transformation chain, and confidence/quality flag. |
| Factor governance | No factor tables or version history in this web project. | Version factor sets; retain citation, effective dates, geography, units, scope mapping, reviewer, and rollback ability. |
| Unit handling | Inputs are fixed display values. | Canonical units, conversion service, dimensional validation, time-zone-aware aggregation, and explicit granularity. |
| Auditability | No event trail. | Append-only audit events for imports, edits, calculation reruns, score changes, approvals, and exports. |
| Data quality | No late, duplicate, missing, out-of-range, or meter-reset rules. | Data-quality engine with review queues, correction provenance, and downstream recomputation. |
| Model governance | No model registry or monitoring. | Version anomaly/forecast methods; define training/evaluation data, drift checks, fallback behavior, explainability, and human override. |
| Claims governance | Demo copy is appropriately cautious. | Enforce product-copy review so estimates, savings, SDG impacts, and AI language never become unsupported claims. |

## Security, privacy, and identity gaps

The current page does not expose a typical authenticated API attack surface because it has no application API. That is not security maturity; it is an absence of the product capabilities that would create the attack surface. Once real data and users are introduced, the security program must be designed before, not after, integration. OWASP ASVS is appropriate as a structured baseline because it provides requirements for testing application controls and assessing confidence in web application security. [1]

| Control family | Missing or unverified element | Minimum production requirement |
|---|---|---|
| Identity | No sign-in, account lifecycle, passwordless/MFA policy, recovery, or SSO. | Centralized identity provider, MFA for privileged access, deprovisioning, session rotation, and access reviews. |
| Authorization | No roles, permissions, or tenant boundary. | Server-side authorization on every resource; organization/site scoping; deny-by-default; permission regression tests. |
| Secrets | No documented secret inventory or rotation policy. | Managed secrets vault, no client-exposed credentials, rotation, environment separation, and leak detection. |
| API protection | No API exists; therefore no input limits, schema validation, rate limits, or abuse protection are implemented. | Authenticated, schema-validated APIs with quotas, request limits, idempotency, structured errors, and abuse monitoring. |
| Browser protection | Static server does not declare a strong app security-header policy. | CSP, HSTS at the edge, frame-ancestors policy, referrer policy, X-Content-Type-Options, secure cookies, and CORS allowlists. |
| File safety | No user upload flow. | Content-type verification, size limits, malware scanning, isolated object storage, signed URLs, and retention/deletion controls. |
| Privacy | No privacy notice, consent design, data map, or subject-right workflow. | Documented purposes and retention; analytics consent where required; export/delete requests; processor inventory; minimum-data collection. |
| Audit and incident response | No audit log or security runbook. | Tamper-evident audit records, alerting, incident triage, notification path, post-incident review, and tabletop exercises. |

## Reliability, operations, and deployment gaps

Production reliability requires more than a successful frontend build. The platform needs health signals, clear ownership, predictable job execution, capacity behavior, alerting, recovery exercises, and measurable service objectives. OpenTelemetry is a vendor-neutral framework for capturing traces, metrics, and logs, and is a reasonable foundation for platform observability. [3]

| Operational area | Current state | Required production state |
|---|---|---|
| Health | No API health, readiness, liveness, dependency, or worker heartbeat endpoint in the current project. | Separate liveness/readiness/health semantics, dependency checks, worker heartbeat, and alert thresholds. |
| Observability | Browser analytics placeholder only; no server telemetry. | Correlated request IDs, structured logs, traces, metrics, dashboards, alerts, and privacy-aware log retention. |
| Job execution | Preset processing is a client timeout; no durable jobs. | Queue/scheduler, retry/backoff, idempotency, job history, timeout policy, concurrency limit, dead-letter queue, and operator retry. |
| Scale | One static process; no database or worker. | Capacity plan, load tests, cache strategy, DB connection limits, async backpressure, and scale-to-zero/persistent-worker decision. |
| Release safety | No CI/CD or promotion path. | Immutable artifacts, environment config validation, migration gate, staged release, canary/rollback, changelog, and deployment audit record. |
| Recovery | No backups or runbooks. | Backup/restore drills, disaster recovery plan, dependency outage mode, support contacts, and documented recovery objectives. |
| Cost control | No resource metering or quota model. | Per-tenant usage accounting, budgets, alert thresholds, connector/AI limits, and data-retention cost controls. |

For EcoSphere’s continuous monitoring requirement, a worker must run independently of a browser. A persistent process or durable scheduled job is required; an autoscaled request-only frontend is not enough. Managed reserved hosting can fit a small continuously running service, while a more customized environment is justified only when operating-system control, Docker, resource capacity, or other hard requirements exceed that hosting model. [4]

## User experience, accessibility, and information architecture gaps

The present user experience is strong for a single product narrative, but a production application needs states that are absent when no real data, user, network, or permission conditions exist.

| UX area | Current strength | Missing production behavior |
|---|---|---|
| Accessibility | Labels, alternative text, keyboard tab movement, and reduced-motion support are implemented. | Formal WCAG 2.2 AA audit, contrast testing, screen-reader testing, zoom/reflow testing, error identification, accessible authentication, and accessibility regression automation. WCAG 2.2 provides testable criteria across perceivable, operable, understandable, and robust principles. [2] |
| Loading/error states | Preset feedback is implemented. | API loading, slow connection, import failure, authorization failure, empty data, partial data, stale data, retry, offline, and maintenance states. |
| Navigation | Clear one-page storytelling. | Authenticated app navigation, site switching, breadcrumbs, command/search, saved views, back/undo, and user preference persistence. |
| Data understanding | Simulated provenance is clearly displayed. | Tooltips, methodology drawer, drill-down, source citations, uncertainty labels, user education, and “why this changed” explanations. |
| Actionability | Presets update a model. | Convert recommendation to task, assign owner, compare options, request approval, upload proof, and see realized outcomes. |
| Mobile | Responsive marketing experience. | Offline-aware field workflows, large targets, accessible chart alternatives, camera/file upload, and low-bandwidth performance. |
| Internationalization | English-only, India-specific currency presentation. | Locale, language, time zone, date, unit, currency, and regulatory configuration. |

## Performance, SEO, and quality gaps

The last build passed but emitted a JavaScript bundle above Vite’s 500 kB advisory threshold. The present asset was approximately 512 kB pre-compression. This is not by itself a launch blocker for a simple landing page, but it signals that production application growth should be controlled through route-level code splitting, dependency removal, image optimization, caching policy, and real-device performance budgets.

| Area | Missing or unverified work | Required release criterion |
|---|---|---|
| Frontend performance | No Core Web Vitals measurement, real-device testing, bundle budget enforcement, or performance CI. | Define and continuously measure LCP, INP, CLS, TTFB, asset budgets, and route budgets. |
| Browser support | No documented support matrix or cross-browser automated suite. | Test current supported Chromium, Firefox, Safari, and mobile platforms against a defined compatibility policy. |
| SEO | No canonical URL, robots file, sitemap, Open Graph/Twitter metadata, schema markup, or preview test. | Add discoverability files, metadata, structured organization/product data, and link-preview checks. |
| Analytics | Placeholder script without consent/configuration verification. | Privacy-reviewed analytics configuration, event taxonomy, consent controls where applicable, and opt-out behavior. |
| Monitoring | No real-user monitoring or error tracker. | Client error tracking with release version, privacy filtering, source maps, performance telemetry, and alert routing. |
| Dependency hygiene | Audit advisories exist; unused libraries remain installed. | Remediate/transitively upgrade or document accepted risk for every advisory; remove unused dependencies; pin and update deliberately. |

## Required test strategy

The project contains Vitest as a dependency but does not declare a test command and contains no test files. A production release needs layered verification; the following matrix should be mandatory.

| Test layer | Test target | Required examples |
|---|---|---|
| Unit | Carbon/score/scenario math, conversions, validation, authorization policies. | Boundary values, null/missing values, factor versions, invalid units, zero savings, negative/overflow input prevention. |
| Integration | API, database, queue, worker, object storage, identity provider. | Idempotent import, transaction rollback, retry without duplicate alert, tenant isolation, revoked session, backup restore. |
| Contract | Client-to-API and connector payloads. | Schema compatibility, error shapes, pagination, date/time behavior, connector version upgrade. |
| End-to-end | Actual user flows. | Create site, import readings, trigger anomaly, receive alert, acknowledge it, run saved scenario, assign action, export report. |
| Accessibility | Core pages, charts, flows, errors, authentication. | Automated axe checks plus manual keyboard, screen reader, zoom, and reduced-motion tests against WCAG 2.2 AA. [2] |
| Security | Web/API/identity/upload surfaces. | ASVS-driven checks, dependency scanning, SAST, secret scanning, DAST, authorization matrix, rate-limit and session tests. [1] |
| Reliability | Worker, retry, outage, migration, restore. | Kill worker mid-job, replay message, DB timeout, connector outage, cold start, capacity test, restore exercise. |
| Performance | Frontend and backend load. | Baseline performance budget, import-volume test, concurrent dashboards, worker throughput, slow network/mobile conditions. |
| User acceptance | Campus operator journey. | A trained operator completes the 10-minute AIEM narrative and an untrained user can distinguish simulated from live evidence. |

## Production-completion roadmap

This roadmap is ordered to avoid an attractive but unreliable interface becoming the dependency for unverified backend behavior. The present website can remain the public narrative layer while a protected application is developed under separate authenticated routes.

| Release stage | Scope | Deliverables | Exit criteria |
|---|---|---|---|
| **Stage 0 — Product contract** | Define who the user is and what a sustainable “decision” means. | Roles, tenancy model, data ownership, source hierarchy, supported metrics, calculation methodology, claims policy, security target, SLOs. | Signed product and data contract; no ambiguous demo-only assumptions leak into production scope. |
| **Stage 1 — Platform core** | Establish secure persistence and identity. | Auth, RBAC, organization/site/meter schema, PostgreSQL, migrations, audit events, secrets, environment separation, CI. | Authorized users can create and isolate organizations/sites; migrations and rollback are rehearsed. |
| **Stage 2 — Trusted data plane** | Ingest and validate real sustainability data. | APIs, CSV workflow, connector framework, unit/time normalization, validation/quarantine, provenance ledger, factor library. | A real/controlled meter dataset is imported exactly once, quality-scored, and traceable end to end. |
| **Stage 3 — Monitoring intelligence** | Run server-side analytics and alerts. | Worker, scheduler, anomaly/forecast services, EcoScore, alert lifecycle, evidence-bound recommendations, observability. | A browser-independent spike causes one traceable alert/recommendation cycle under restart and retry tests. |
| **Stage 4 — Decision and execution** | Turn findings into accountable work. | Saved scenarios, approval workflow, intervention owner, task/actions, realized measurement, reporting/export. | Operators can compare, approve, execute, and measure an intervention without spreadsheets. |
| **Stage 5 — Hardening and release** | Validate operating quality. | Full automated test layers, ASVS review, accessibility audit, performance budget, backup restore, incident playbook, support model. | All release gates pass; an external pilot can be onboarded with documented support and recovery. |

## Definition of “fully functional and furnished”

EcoSphere AI may fairly be called a production-grade sustainability operations platform only when all of the following are true. It must have authenticated multi-tenant users; durable, auditable sustainability data; source- and factor-versioned calculations; browser-independent monitoring; actionable alert and recommendation workflows; server-authoritative simulations; reliable import/export; observable and recoverable operations; protected secrets and APIs; automated test gates; and documented support, data retention, incident, and deployment processes.

Until those conditions are demonstrated with evidence, the accurate positioning remains: **a polished AIEM Campus pilot prototype and product experience, using explicitly simulated data and transparent modeled outcomes.**

## Recommended immediate next move

Do not add further decorative features before choosing the platform boundary. The highest-value next implementation is to convert the current static website into the public landing page and build a protected application surface backed by the real EcoSphere domain services. Start with **identity, database, site/meter schema, and authenticated CSV ingestion**, because every dashboard, worker, forecast, alert, and recommendation depends on those records being trustworthy.

## References

[1]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard (ASVS)"
[2]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[3]: https://opentelemetry.io/docs/ "OpenTelemetry Documentation"
[4]: https://www.manus.im "Managed application hosting and persistent-service options"
