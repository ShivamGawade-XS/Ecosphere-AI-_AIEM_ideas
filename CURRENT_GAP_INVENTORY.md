# EcoSphere AI — Current Gap Inventory and Remaining Build Plan

**Assessment date:** 22 August 2026  
**Current project state:** Database-backed, authenticated sustainability-operations **foundation** with a public narrative and protected operational workspaces.  
**Honest release position:** **Functional pilot platform foundation; not yet a fully production-ready sustainability management service.**

## What is real and working now

The project has moved beyond a one-page mock-up. The root route opens an authenticated Operations Overview. It has separate Registry, Live Data, Intelligence, Scenarios, Actions, Reports, and Readiness workspaces. The platform stores users, organizations, memberships, sites, meters, readings, ingestion batches, audit events, actions, and saved scenarios in the managed relational database.

The end-to-end pilot workflow was tested in a real authenticated browser session. An **AIEM Campus Pilot** organization, **AIEM Main Campus** site, and **HVAC Electricity** meter were created; a **112.5 kWh** reading was ingested; the Overview and Reports workspaces reflected the persisted record; an action was created and moved to *in progress*; and a deterministic, server-side scenario was calculated and saved. The quality gate currently passes **25 tests across 7 test files**, TypeScript validation, production build, and whitespace validation.

| Capability | Current implementation | Status |
|---|---|---|
| Identity and tenant boundary | Manus OAuth, organization membership records, protected tRPC procedures, tenant-scoped queries | **Foundation complete** |
| Source registry | Organizations, sites, canonical meters, resource types, units | **Functional** |
| Single-reading intake | Protected, idempotent, canonical-unit-checked reading ingestion with ingestion batch and provenance fields | **Functional foundation** |
| Scenario planning | Server-side deterministic calculation, saved assumptions/results, calculation version | **Functional pilot capability** |
| Action register | Create and move tenant-scoped actions through proposed/in-progress/completed states | **Functional foundation** |
| Operational summary | Overview and report counts, recent readings, recent ingestion batches | **Functional foundation** |
| Implementation tracking | Readiness dashboard exposes completed, in-progress, and planned platform capabilities | **Functional** |
| Public narrative | Separate `/narrative` route with explicit pilot and simulated-data boundary | **Functional** |

> **Important distinction:** The application is now a modular full-stack product foundation, but it is **not a microservices deployment**. The Express/tRPC application, domain logic, and web UI still run as one deployable application. The remaining worker, connectors, analytics, and notification services have not been independently deployed.

## The highest-priority gaps

The following items prevent a claim that EcoSphere AI is a complete live sustainability platform. They should be treated as release blockers rather than optional refinement.

| Priority | Gap | Current limitation | What must be built | Definition of done |
|---|---|---|---|---|
| **P0** | Independent monitoring worker | No browser-independent process consumes readings, recomputes metrics, or generates operational events. | Durable worker/scheduler, queue or job table, retry policy, idempotency, worker heartbeat, dead-letter handling. | The browser can be closed and a controlled input still progresses through validation, metric calculation, anomaly detection, alert creation, and score update exactly once. |
| **P0** | Real analytics pipeline | Intelligence is intentionally a readiness boundary, not live anomaly, forecast, EcoScore, or recommendation logic. | Deterministic data-quality checks, anomaly rules/models, forecast service, EcoScore engine, recommendation rules, persisted results. | A controlled HVAC spike creates one evidence-linked anomaly, alert, score movement, forecast update, and recommendation. |
| **P0** | Carbon-accounting factor governance | The scenario engine uses a documented pilot factor set, but no governed emissions-factor library or calculation ledger exists. | Factor tables with source citation, geography, scope, validity period, factor version, approvals, and calculation records. | Every carbon value can be reproduced from a source reading, factor version, formula version, and timestamp. |
| **P0** | Production data connectors | Only one-reading intake is verified. There is no operational CSV import, BMS/IoT connector, utility feed, webhook, or connector credential lifecycle. | CSV mapping/preview/quarantine workflow; connector adapter contract; secure credential storage; import retry; source health. | A multi-row source import accepts valid data, quarantines invalid rows, preserves provenance, and can be retried without duplication. |
| **P0** | Production operations | No service-level health contract, worker health, telemetry stack, backup/restore drill, incident runbook, or deployment promotion flow is implemented. | Liveness/readiness checks, structured logs, traces/metrics, alerting, backups, recovery targets, staging, rollback, and CI/CD. | A controlled service/database failure is detected, alertable, recoverable, and documented within agreed RTO/RPO. |
| **P0** | Security hardening | OAuth and tenant query scoping exist, but API hardening and governance are incomplete. | Rate limits, request quotas, CSP/security headers, secret rotation, access reviews, privacy/data-retention controls, audit-log governance, ASVS verification. | Every protected operation is authorized server-side and the security checklist is tested against the selected OWASP ASVS level. [1] |
| **P0** | Role and membership management | Membership records exist, but there is no invitation, role-management, site-level permission, offboarding, or access-review interface. | Invite/accept/remove members, owner/manager/operator/viewer policies, least-privilege checks, user lifecycle. | An owner can grant and revoke access; a viewer cannot mutate sources, readings, actions, or scenarios. |
| **P0** | Evidence-grade reporting | The existing CSV is a client-generated operational snapshot, not a controlled report or certified disclosure. | Server-generated scoped exports, report versioning, factor references, date/filter controls, signed audit package, retention/export controls. | A selected reporting period produces a reproducible export whose figures link back to source records and factor versions. |

## Critical product capabilities still missing

### Monitoring, intelligence, and decision support

The core loop has not been completed. Registry and data intake are operational, but **Monitor → Detect → Predict → Recommend → Act → Measure** is not yet automated. The “Intelligence” page is deliberately transparent that anomaly detection, forecasting, alerts, and recommendation automation are planned. This is correct messaging, but it is also the largest functional product gap.

| Capability | Current state | Missing behavior |
|---|---|---|
| Meter health | Meter registry only | Last-seen status, missing-data alerts, unit/meter reset detection, connector health, calibration metadata |
| Data quality | Canonical unit and idempotency checks | Outlier ranges, missing intervals, late-arriving data, duplicate source detection, correction/review queue |
| Anomaly detection | Not implemented | Baseline windows, thresholds, seasonality, severity, deduplication, evidence, acknowledgement |
| Forecasting | Not implemented | Short-horizon forecasts, confidence/uncertainty, drift monitoring, fallback method |
| EcoScore | Not implemented | Transparent weighting, missing-data handling, time period, score history, drill-down, change explanation |
| Recommendations | No automated engine | Rule/evidence threshold, estimated impact, confidence, human review, link to action and realized outcome |
| Alerts | Not implemented | Severity, routing, acknowledgement, escalation, snooze, resolution, notification preferences |
| Measurement after action | Not implemented | Baseline lock, intervention start date, measurement window, realized-vs-modeled comparison, evidence upload |

### Data lifecycle and integrations

The current single-reading endpoint proves the core persistence contract, but an operational campus cannot be managed by manually entering one reading at a time. The data plane must handle real volume, varied timing, source errors, and data ownership.

| Gap | What is absent today | Required capability |
|---|---|---|
| Bulk CSV import | No mapping, preview, row-error output, multi-row ingestion test, or file audit artifact. | Template, mapping UI, validation preview, row-level error download, idempotent batch retry, import history. |
| IoT/BMS integration | No connector protocol or polling/webhook service. | Adapter boundary for MQTT/HTTP/BMS/utility feeds, connector credentials, health status, retry/backoff, rate limits. |
| Storage | No file storage for import sources, evidence, invoices, or action attachments. | S3-backed file metadata, signed access, content checks, malware scanning, retention/deletion policy. |
| Data correction | No approved correction workflow. | Immutable raw record plus corrected version, reviewer, reason, recomputation downstream. |
| Reference data | No facility metadata, tariff plans, equipment catalog, waste destinations, or renewable certificates. | Versioned reference tables with administrator workflow. |
| Time and units | Basic site timezone and canonical unit are present. | Conversion library, daylight-saving/timezone edge cases, interval aggregation, meter rollover/reset treatment. |

## Workflow and collaboration gaps

Actions are currently a simple accountable register. They are not yet a full intervention-management workflow.

| Workflow | Present today | Still required |
|---|---|---|
| Action ownership | Optional owner column in schema, not exposed as an assignment experience | Assignee picker, role constraints, due date, reminders, workload view |
| Approvals | Not implemented | Proposal, budget/approval state, delegated approver, decision trail |
| Evidence and comments | Not implemented | Notes, mentions, attachments, proof of completion, retention rules |
| Intervention comparison | One saved scenario at a time | Scenario comparison matrix, sensitivity analysis, ranking criteria, approval and action conversion |
| Action outcomes | Expected carbon impact only | Realized measurement, variance to model, closure criteria, reopen/escalate |
| Multi-site operation | Basic site selection | Site switching, portfolio drill-down, cross-site aggregation, per-site permissions |
| User support | Not implemented | In-product guidance, source templates, status page, issue intake, operator runbooks |

## Security, privacy, and compliance gaps

The project has useful security foundations—server-side protected procedures, authenticated users, organization memberships, and tenant-scoped persistence—but this does **not** yet constitute a complete security or compliance program.

| Area | Existing foundation | Remaining work |
|---|---|---|
| Authentication | Managed OAuth login and secure framework session behavior | MFA/SSO policy, account recovery, invite/offboarding, session review, service-account design |
| Authorization | Organization membership checks | Role-specific mutation policies, site-level permission model, permission matrix tests, periodic access reviews |
| API safety | Typed tRPC validation for implemented procedures | Rate limits, payload limits, API key/service-to-service auth, abuse monitoring, CSRF/CORS review |
| Secrets | Platform-provided environment configuration | Secret inventory, rotation policy, connector secret vaulting, leak detection, environment access policy |
| Browser security | Framework baseline | CSP, HSTS and frame policy at edge, SRI where relevant, privacy-aware client logging |
| Privacy | No customer data collected beyond pilot user/session records | Data map, purpose/retention policies, subject request workflow, processor list, analytics consent review |
| Auditability | Audit event table is present | Immutable/tamper-evident policy, audit-view UI, exportable audit trail, retention and incident use |
| Secure delivery | No evidenced secure CI pipeline | SAST, dependency scanning, secret scanning, DAST, signed artifacts, approval gates |

OWASP ASVS is a practical security verification baseline for these web, identity, data-protection, and operational controls. [1]

## Reliability, observability, and deployment gaps

The current app can build and run, but it has no operational contract for a live customer service. The dev log contains historical transient resolution entries even though the present build, route tests, and running preview are clean; a real deployment needs a clean log lifecycle and current-error alerting rather than manual inspection.

| Gap | Why it matters | Required implementation |
|---|---|---|
| Health model | A deployment needs to distinguish process liveness from database readiness and worker health. | `/health/live`, `/health/ready`, dependency checks, worker heartbeat, uptime dashboard. |
| Background execution | Autoscaled request handling cannot guarantee continuous monitoring. | Separate persistent worker/queue or reserved service, schedule ownership, locks, retry/dead-letter policy. |
| Observability | No request correlation, distributed tracing, metrics dashboard, or alert routing. | Structured logging, trace IDs, error tracking, metrics/traces using a standard such as OpenTelemetry, service dashboards, paging policy. [2] |
| Resilience | No fault-injection or failure-recovery testing. | Timeout/retry policy, dependency outage modes, idempotent consumers, graceful degradation, load testing. |
| Backup/recovery | No verified recovery objectives. | Encrypted backups, restore drill, RPO/RTO targets, data export and deletion workflow. |
| Delivery | No CI/CD or safe promotion model. | PR checks, migration gate, staging, release artifact, feature flags, rollback, deploy audit record. |
| Environment management | No documented production/staging config matrix. | Per-environment secrets, allowlists, database access controls, config validation, owner runbook. |
| Bundle budget | Route-level lazy loading exists, but the shared entry bundle remains about 699 kB pre-compression and exceeds the bundler advisory. | Dependency audit, manual chunking where justified, Core Web Vitals budget, real-device measurement, performance CI. |

## UX, accessibility, and reporting gaps

The Field Operations Ledger visual system is strong and each current workspace has loading/error/empty states. However, production UX must cover complex real-world states that are currently absent because the relevant systems do not exist.

| Area | Current strength | What remains |
|---|---|---|
| Accessibility | Labels, focusable controls, keyboard mission tabs, reduced-motion styling, responsive layout | Formal WCAG 2.2 AA audit, automated axe checks, screen-reader scenarios, contrast/zoom/reflow and authentication-flow testing. [3] |
| Error recovery | Error states for current tRPC workspace queries | Import failures, connector outage, stale data, partial data, retry schedules, authorization explanation, maintenance mode |
| Data understanding | Simulated versus live boundary is explicit | Data lineage drawer, methodology pages, factor citations, uncertainty/confidence, “why this changed” explanations |
| Dashboard depth | Summary counts and latest reading | Time-series charts, period filters, drill-down, site comparison, segmentation, saved views |
| Reporting | One browser-generated snapshot | Server report jobs, filters, scheduled distribution, report provenance, controlled download permissions |
| SEO/public trust | Narrative route works | Canonical/social metadata, sitemap/robots, privacy page, terms, data-use notice, accessibility statement |
| Internationalization | India-friendly currency and one site timezone | Locale, language, date/unit/currency controls, regional factor and regulatory configuration |

## Test and quality gaps

The project now has meaningful test coverage for current routes, core API contracts, scenario math, loading/error states, sidebar navigation, and default/public entry routes. That is a significant improvement over the original prototype, but it is not a release-complete quality program.

| Test layer | Present now | Missing before production launch |
|---|---|---|
| Unit | Scenario calculations and selected API logic | Factor versioning, score/anomaly/forecast math, conversion and quality-rule boundaries |
| Component | Current workspace states and navigation | Charts, accessibility behavior, long-data/large-list performance, all role permutations |
| API integration | Selected protected procedure tests | Real database transaction tests, tenant isolation across users, data correction, connector contracts |
| Browser E2E | One manual authenticated path validated | Automated Playwright/Cypress suite for onboarding, imports, alerts, scenarios, approvals, exports, logout/role changes |
| Security | No security test automation | SAST, dependency and secret scanning, DAST, authorization matrix, rate limit/session tests |
| Reliability | No worker/queue exists to test | Restart, replay, duplicate message, outage, restore, throughput, stress, and chaos tests |
| Accessibility | Informal implementation checks | Automated and manual WCAG 2.2 AA verification across public and authenticated routes |

## Recommended implementation sequence

The following order prevents cosmetic work from hiding critical reliability dependencies.

| Release | Scope | Main deliverables | Completion evidence |
|---|---|---|---|
| **R1 — Trusted data plane** | Make operational data viable. | Bulk CSV workflow, import quarantine, source files, factor library, data-quality rules, role management. | A controlled multi-row import retains valid values, rejects invalid rows visibly, and produces an auditable data/factor lineage. |
| **R2 — Continuous monitoring** | Complete Monitor, Detect, and Alert. | Separate worker, job persistence, health/heartbeat, anomaly rules, EcoScore, alert lifecycle, notifications. | Worker remains active after browser/API restart; controlled HVAC spike produces one alert and one score update. |
| **R3 — Intelligence and measurement** | Complete Predict, Recommend, and Measure. | Forecasts, evidence-bound recommendations, action conversion, baseline/realized comparison, model governance. | A recommendation cites actual readings/factors, is actioned, and shows modeled versus realized outcome. |
| **R4 — Enterprise workflow** | Enable teams to operate the system safely. | Membership management, assignments, approvals, attachments, portfolio views, report jobs, permissions. | Owner/manager/operator/viewer journeys pass automated authorization and browser tests. |
| **R5 — Release hardening** | Make the platform operable. | Security baseline, observability, backup/restore, CI/CD, staging, performance budget, accessibility audit, operational runbooks. | Staging release, restore drill, security suite, performance and WCAG gates all pass. |

## What should not be claimed yet

EcoSphere AI should **not** yet be described as a live continuous-monitoring system, AI anomaly detector, forecasting platform, certified carbon-accounting product, regulatory reporting tool, Odoo-connected deployment, multi-service production platform, or guaranteed savings engine. The current honest claim is:

> **EcoSphere AI is a functioning authenticated sustainability operations foundation for an AIEM Campus pilot. It can register trusted sources, persist validated readings, manage actions, calculate and save transparent What-If scenarios, and show operational evidence. Its continuous monitoring, governed carbon accounting, connector ecosystem, automated intelligence, and production operations remain the next implementation releases.**

## References

[1]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[2]: https://opentelemetry.io/docs/ "OpenTelemetry Documentation"
[3]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines 2.2"
