# EcoSphere AI — Complete Feature Catalogue and Functional Product Roadmap

**Product:** EcoSphere AI — AI-Powered Sustainability Mission Control  
**Primary focus:** SDG 13 — Climate Action  
**Supporting focus:** SDGs 7, 9, 11, and 12  
**Catalogue status:** Current as of 22 August 2026  
**Purpose:** Define the complete feature set required to evolve the verified AIEM Campus pilot into a reliable, multi-site sustainability operations product.

> **Honest current position:** EcoSphere AI is a functional authenticated pilot platform with a real database, tenant isolation, deterministic monitoring, operational workspaces, and verified simulated anomaly handling. It is **not yet** a certified carbon-accounting platform, production connector ecosystem, or enterprise-operated SaaS service.

## 1. What Is Working and Verified Today

The current product is no longer a static landing page. It has a protected operational application and a separate public narrative. The verified data path is **Organization → Site → Meter → Reading → Quality/Carbon/Anomaly/EcoScore → Alert → Acknowledgement**, with calculations executed on the server rather than in the browser.

| Area | Verified capability | Current boundary |
|---|---|---|
| Identity and tenancy | OAuth authentication, organizations, memberships, tenant-scoped queries and mutations | Self-service invitations, offboarding, and fine-grained permissions are not yet available. |
| Source registry | Sites, meters, resource types, canonical units, active meter records | No calibration records, meter health rules, hierarchy, or equipment catalogue yet. |
| Intake | Idempotent one-reading ingestion with batch and provenance records | Bulk CSV, connector, utility, and IoT ingestion are not yet available. |
| Simulation provenance | Manual and explicitly labeled `simulated` pilot readings | Simulation scheduling and reset tooling are not yet implemented. |
| Monitoring | Server-owned data quality, energy carbon calculation, rolling z-score anomalies, alerts, EcoScore snapshots, idempotent run history | The initial rules are pilot rules, not a calibrated statistical/industrial model. |
| Execution | Protected manual run, `pnpm monitor:once`, and a cron-authenticated callback endpoint | No deployed periodic schedule has been created yet. |
| Alerts | Medium-or-higher anomaly alert creation, visible lifecycle, acknowledgment | Routing, escalation, resolution evidence, and notifications are not yet available. |
| Decision support | Deterministic What-If scenario calculation and saved scenarios | A complete intervention library, comparisons, sensitivity analysis, and realized-outcome measurement are incomplete. |
| Action management | Tenant-scoped action creation and state movement | Assignment, approval, comments, attachments, reminders, and due-date workflow are incomplete. |
| Reporting | Operational counts and protected history views | Controlled exports, reporting-period closure, disclosures, and report signing are not yet available. |

The latest verified simulated test used three labeled HVAC baselines and a 250 kWh simulated spike. The worker persisted a critical anomaly, a score change to 65, a pilot carbon total, and an alert; acknowledgment remained visible after browser refresh. This is evidence of the pilot flow, not evidence of a real AIEM Campus incident.

## 2. Product Principles for Every New Feature

Every addition should comply with the following implementation rules. These rules are as important as the feature list because they prevent a visually impressive but unreliable sustainability product.

| Principle | Required implementation behavior |
|---|---|
| Source truth | Preserve raw source readings, immutable provenance, timestamps, source identifiers, and import/connector health. |
| Deterministic numbers | Calculate metrics, carbon, forecasts, scores, savings, and thresholds in versioned server code. |
| Responsible AI | Allow AI only to explain persisted evidence, prepare summaries, or draft recommendations; never allow it to invent measurements or calculated impact. |
| Simulation safety | Label every simulated value, forecast, modeled outcome, and pilot factor in storage and UI. |
| Tenant isolation | Check membership and authorization server-side for every tenant record and operation. |
| Traceability | Persist factor versions, formulas, model versions, thresholds, data windows, run keys, and audit events. |
| Browser independence | Run monitoring, connector syncs, reports, retry logic, and notifications outside browser lifecycles. |
| Graceful failure | Provide clear status, retry, quarantine, alerting, and recovery paths rather than silently dropping records. |

## 3. Complete Functional Feature Catalogue

### 3.1 Organization, identity, and access management

This capability set turns a single pilot tenant into a safely administered multi-user product.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Organization onboarding | Create organization, designate owner, collect sector, reporting year, timezone, currency, and sustainability boundary | A new organization starts with a valid setup checklist and no data leaks from another tenant. | P0 |
| Membership invitations | Invite users by email, accept/decline invitation, expire unused invitations, resend securely | An owner can invite a user and the invitee can access only the selected organization. | P0 |
| Role management | Enforce owner, manager, operator, viewer, auditor, and optional site-specific roles | Permission matrix tests prove viewers cannot alter operational data. | P0 |
| Offboarding | Remove user access, transfer ownership, preserve audit history, invalidate future work assignments | Removed users lose access immediately while historical actions remain attributable. | P0 |
| Site-level access | Limit a user to a site, building, department, or portfolio scope | A site operator cannot see or modify another site’s data. | P1 |
| SSO and MFA policy | Support enterprise sign-on and policy-controlled MFA where the identity provider supports it | Admin can require compliant login for selected tenants. | P2 |
| Service accounts | Create scoped machine identities for connectors and automation | A connector identity can ingest only its permitted sources. | P1 |
| Access review | Show active members, privileges, last use, review cycle, and exported access evidence | Owner completes a periodic access review with an audit event. | P2 |

### 3.2 Campus, facility, asset, and meter registry

The registry must explain what is being measured before the system can explain performance.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Facility hierarchy | Model organization → campus → building → floor/zone → department | Portfolio and site totals reconcile to child locations. | P1 |
| Meter catalogue | Capture meter type, serial number, location, resource, unit, status, installation date, and owner | Operators can search a meter and understand its source contract. | P0 |
| Equipment inventory | Register HVAC systems, pumps, lighting zones, solar assets, chillers, water fixtures, waste assets, and fleets | Recommendations can link a signal to a responsible asset. | P1 |
| Meter calibration | Record calibration date, expected accuracy, certificate, due date, and calibration evidence | Overdue calibration becomes a maintenance/data-quality signal. | P2 |
| Meter relationship graph | Model parent/child meters, virtual meters, submeters, and allocation rules | Building totals and submeter totals can be reconciled. | P2 |
| Asset maintenance linkage | Associate assets with planned maintenance, service records, and failure history | A repeated anomaly can open or link to a maintenance action. | P1 |
| Geographic context | Store coordinates, building area, occupancy capacity, climate zone, and operating hours | Normalized intensity metrics can use auditable denominators. | P2 |

### 3.3 Data intake, integration, and lifecycle

Manual one-reading intake is useful for testing; a functioning operational platform needs reliable high-volume intake and correction workflows.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| CSV import | Upload a template, map columns, preview parsed data, validate rows, quarantine failures, confirm import | A multi-row file creates one auditable batch, imports valid rows, and returns row-level errors. | P0 |
| Import templates | Provide reusable templates for electricity, water, waste, fuel, renewable generation, invoices, and occupancy | Operators can download a correct template and upload without manual schema changes. | P1 |
| Import replay | Retry a failed/partial import using idempotency keys without duplicate readings | Re-running the same file does not duplicate accepted values. | P0 |
| Data quarantine | Hold malformed rows outside analytics until corrected or approved | A quarantined record never influences a score or alert. | P0 |
| File evidence store | Store input files, utility bills, meter photographs, invoices, calibration certificates, and action evidence in protected object storage | Every attachment has an owner, permission, hash, retention rule, and download audit event. | P1 |
| REST ingestion API | Publish documented secure ingestion endpoints with scoped keys, validation, rate limits, and idempotency | A partner system can send readings with a testable contract. | P1 |
| Webhook intake | Accept provider webhooks with signature validation, replay protection, and delivery logs | A signed replay attempt is rejected and a valid delivery is visible in the audit trail. | P2 |
| MQTT/IoT adapter | Ingest sensor telemetry through a gateway with certificate/key rotation and connection health | A gateway disconnect creates a source-health event without losing later replayed data. | P2 |
| Building-management adapter | Integrate BMS/SCADA/Modbus gateway exports through an adapter contract | The adapter maps a source point to a canonical registered meter. | P2 |
| Utility data connector | Import electricity, water, gas, or renewable provider bills/API feeds | Billing totals reconcile against source documents and interval readings. | P2 |
| Odoo integration | Sync approved operational cost, asset, procurement, or waste information through a separately governed connector | Connector health, field mapping, authorization, and reconciliation are visible; no unsupported live-link claim is made before verification. | P2 |
| Data correction workflow | Preserve immutable raw data, issue reviewed corrections, state reason, and trigger downstream recomputation | A corrected reading produces a versioned audit trail and revised analytics. | P0 |
| Data retention/deletion | Configure retention by source type, legal basis, tenant, and evidence class | A retention job and deletion request are logged and reviewable. | P2 |

### 3.4 Data quality, governance, and provenance

Quality controls need to evolve from pilot rules into a managed data-governance system.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Managed quality rules | Configure resource-specific ranges, future/late tolerance, interval completeness, and meter reset rules by tenant | An authorized manager can version a rule and view its effect on subsequent runs. | P1 |
| Missing-data detection | Detect expected intervals with absent source values | A missing interval creates a visible data-quality finding and optional alert. | P1 |
| Late-arrival handling | Flag late records and recompute affected periods safely | A late reading updates the correct historical window without duplicate alerts. | P1 |
| Duplicate-source detection | Detect same physical reading arriving from multiple feeds | Duplicate candidates are reviewed rather than counted twice. | P2 |
| Unit conversion service | Version conversion factors and support energy, volume, mass, and currency transformations | Cross-unit aggregation displays both source and canonical values. | P1 |
| Data lineage drawer | Show source, file/connector, ingest time, raw value, correction history, factor/model version, and downstream artifacts | A user can trace a dashboard number back to its input records. | P0 |
| Data-quality work queue | Assign, comment on, correct, approve, or dismiss findings | Each decision has an actor, reason, timestamp, and affected data scope. | P1 |
| Source health dashboard | Show last reading, expected frequency, late rate, error rate, freshness, and connector status | Operators can identify an offline or degraded source before analysis becomes misleading. | P1 |

### 3.5 Environmental calculation and carbon-accounting engine

The existing energy pilot factor is intentionally limited. A complete engine must manage provenance, scope, geography, time validity, and versioned calculations.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Emissions factor library | Store factor source, geography, year, scope, unit, validity period, approvals, and version | Every calculated carbon value links to an explicit factor record. | P0 |
| Scope 1 accounting | Model stationary fuel, mobile fuel, refrigerants, and process emissions where applicable | Source consumption, factor, formula, and result are reproducible. | P1 |
| Scope 2 accounting | Support location-based and market-based electricity calculations, renewable instruments, and grid factors | The selected method is explicit in every report. | P0 |
| Scope 3 modules | Support purchased goods, commuting, travel, waste, logistics, and supplier data progressively | Each category is marked measured, estimated, or unavailable. | P2 |
| Water accounting | Track total water, borewell/municipal/recycled sources, reuse, discharge, leak signals, and intensity | A water dashboard reconciles intake, reuse, and output where data is available. | P1 |
| Waste accounting | Track waste generation, segregation, recycling, composting, disposal, contamination, and vendor evidence | Waste diversion rate is traceable to weight tickets or declared source data. | P1 |
| Renewable energy accounting | Track on-site solar generation, self-consumption, export, certificates, and avoided grid energy | Renewable share is calculated with transparent allocation rules. | P1 |
| Cost and tariff engine | Store tariff slabs, demand charges, time-of-use rates, taxes, and contracts | Energy saving estimates specify tariff version and calculation assumptions. | P2 |
| Intensity metrics | Calculate per-area, per-occupant, per-operation, per-revenue, and weather-normalized metrics | Each denominator is stored, timestamped, and visible in the methodology. | P2 |
| Methodology library | Publish formula definitions, factor citations, assumptions, limitations, and change history | Operators can open “How was this calculated?” for every headline metric. | P0 |

### 3.6 Continuous monitoring, detection, and forecasting

The verified pilot supports rolling z-score detection for persisted readings. The full capability set improves reliability without hiding uncertainty.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Scheduled monitoring activation | Create and monitor a deployed scheduler job using the existing authenticated callback | Browser closure does not stop runs; missed runs are visible and recoverable. | P0 |
| Worker health and heartbeat | Persist worker liveness, duration, lag, success rate, backlog, and failure status | A failed worker run makes the monitoring health view unhealthy. | P0 |
| Queue and retry policy | Use durable job records or a queue, backoff, bounded retry, locks, and dead-letter handling | An injected transient failure is retried exactly as configured without duplicate outputs. | P1 |
| Forecasting baseline | Implement a deterministic short-horizon forecast with confidence interval and backtest metrics | A forecast displays horizon, uncertainty, training window, and measured error. | P1 |
| Seasonality support | Account for time of day, day of week, holiday, weather, occupancy, and operating hours where data exists | A predictable weekly pattern does not produce repeated false alerts. | P2 |
| Advanced anomaly methods | Add EWMA, change-point, isolation forest, or forecast-residual detection only after benchmark validation | Model selection shows a benchmark, precision/recall review, and fallback logic. | P2 |
| Anomaly correlation | Group related deviations across parent/child meters, equipment, weather, and occupancy | A single root cause does not create an alert storm. | P2 |
| Alert deduplication | Group repeat events, apply cool-downs, update evidence, and escalate based on persistence | Repeated readings produce one maintained incident rather than many duplicates. | P1 |
| Alert resolution | Require resolution reason, evidence, owner, and optional post-resolution monitoring period | An alert can be closed only with an accountable trail. | P1 |
| SLA/SLO monitoring | Define freshness, run completion, data-quality, and response targets | A dashboard shows whether the system meets agreed service targets. | P2 |

### 3.7 EcoScore, benchmarks, and sustainability dashboard

The current EcoScore is a transparent pilot signal. The completed dashboard should offer drill-down and comparison while keeping its methodology visible.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Score configuration | Allow approved weighting profiles by tenant, site type, and reporting objective | Changing a profile creates a new score version rather than overwriting history. | P1 |
| Score history | Render score trends, score component changes, and event annotations | A user can explain why the score changed on any selected date. | P0 |
| Drill-down | Link score penalties to quality findings, anomalies, carbon trend, and source records | Every penalty can be opened to its evidence. | P0 |
| Benchmarking | Compare site performance to its own baseline, peer sites, and optional approved external benchmarks | The comparison method and dataset are visible. | P2 |
| Goal tracking | Set energy, water, waste, carbon, renewable, and action-completion targets | Progress updates deterministically as qualifying data arrives. | P1 |
| Portfolio dashboard | Aggregate campuses/sites while preserving local drill-down and source freshness | Leaders can move from portfolio to a problematic meter in a few interactions. | P1 |
| Time-series visualization | Show interval, daily, weekly, monthly, and annual trends with quality overlays | Charts visibly distinguish measured, corrected, simulated, estimated, and forecast values. | P0 |
| Saved views | Save scoped filters, periods, metric combinations, and user-specific layouts | A user can reopen a previously saved operational view. | P2 |

### 3.8 Recommendations, AI explanations, and decision support

AI must remain constrained by evidence. The numerical engine produces inputs; an explanation service may only describe those inputs.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Rule-based recommendations | Generate recommendations from explicit conditions, anomalies, costs, and factor-backed impact calculations | A recommendation names its triggering event and evidence IDs. | P1 |
| Recommendation structure | Include problem, evidence, action, expected impact, cost, savings, carbon effect, SDGs, confidence, and priority | Empty or unavailable fields display “not estimated,” never invented values. | P1 |
| AI explanation layer | Convert persisted evidence into concise natural-language explanation with citations/links | A response cannot change numeric values and exposes its evidence basis. | P2 |
| Recommendation review | Allow operator acceptance, rejection, edit, defer, and feedback with rationale | Decision feedback becomes auditable training/evaluation data. | P1 |
| Intervention ranking | Rank options by carbon impact, cost, savings, ROI/payback, feasibility, risk, and SDG fit | Weights and assumptions are visible and configurable. | P1 |
| Recommendation safety | Add prompt boundaries, sensitive-data filtering, model audit logs, fallback copy, and human approval modes | The system refuses unsupported claims and surfaces data gaps. | P1 |
| Knowledge base | Store approved procedures, equipment guidance, campus policies, and maintenance playbooks | Explanation answers quote only approved internal material plus linked evidence. | P2 |
| Outcome learning | Compare recommended/selected action with realized results without automatically retraining production models | Outcome analysis reports confidence and sample limitations. | P2 |

### 3.9 What-If simulator and intervention portfolio

The current deterministic scenario capability should become a complete investment decision workspace.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Input completeness | Support energy, renewable, water, waste, recycling, investment, tariff, equipment life, and operational inputs | Invalid/unsupported assumptions are rejected with clear guidance. | P0 |
| Intervention library | Provide governed templates for LED, solar, HVAC controls, efficient motors, water fixtures, rainwater systems, composting, segregation, and behavior programs | Template assumptions show version, source, and editable values. | P1 |
| Before/after view | Show consumption, carbon, savings, cost, ROI, payback, and SDG impact side by side | A scenario has an exportable methodology and saved inputs/results. | P0 |
| Comparison matrix | Compare multiple saved scenarios with normalized criteria and filters | Operators can select a recommendation and convert it into an action proposal. | P1 |
| Sensitivity analysis | Vary tariff, factor, adoption rate, capex, utilization, and performance assumptions | Risk ranges are calculated deterministically and explained. | P2 |
| Budget portfolio optimizer | Select a group of interventions within a budget/constraint set | Output is labeled as a modeled portfolio, with assumptions and constraints. | P2 |
| Approval workflow | Move a selected scenario through proposal, review, approval, funding, delivery, and closure | Approval history and delegated decision authority are persisted. | P1 |
| Realized-versus-modeled measurement | Lock baseline and compare outcomes after action deployment | The system distinguishes realized results from modeled projections. | P1 |

### 3.10 Actions, projects, and collaboration

The existing action register should grow into an accountable intervention-delivery workflow.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Assignment and due dates | Assign a responsible member, due date, priority, estimate, and site/asset context | Assignees see only authorized work and overdue actions are visible. | P1 |
| Comments and mentions | Add threaded notes, mentions, activity history, and notification linkage | A discussion is retained with timestamps and permission checks. | P2 |
| Attachments | Attach quotations, photographs, invoices, maintenance reports, and proof of completion | Files are access-controlled and appear in the audit trail. | P1 |
| Approval gates | Support budget, facilities, finance, and sustainability approvals | Each approval/rejection has an accountable actor and reason. | P1 |
| Workboard and calendar | Provide list, kanban, calendar, and workload views | Filters make blocked/overdue/high-impact actions visible. | P2 |
| Action templates | Create repeatable maintenance and efficiency action templates | Templates create structured actions with required evidence fields. | P2 |
| Outcome closure | Record actual cost, outcome measurement, residual risk, and closure decision | Closed action contributes to realized-performance reporting. | P1 |

### 3.11 Alerts, notifications, and operational communications

The product must route meaningful signals to people without creating noise.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| In-app notification centre | Show read/unread alerts, assignments, import failures, approvals, and monitoring health | Notification state is scoped and dismissible. | P1 |
| Email routing | Route alerts based on role, site, severity, schedule, and escalation policy | A critical alert sends a test notification to the configured responsible role. | P1 |
| Messaging integrations | Support approved channels such as Teams, Slack, SMS, or WhatsApp through governed connectors | Delivery status, retry, and consent/authorization are logged. | P2 |
| Escalations | Escalate unacknowledged critical alerts by elapsed time and policy | Test policy follows a controlled escalation path without duplicate messages. | P1 |
| Snooze and maintenance windows | Suppress expected maintenance/test signals with reason and expiration | Suppression is visible in evidence and cannot silently hide data. | P1 |
| Digest reports | Send daily/weekly summaries of scores, alerts, actions, and data freshness | The digest links only to authorized tenant data. | P2 |

### 3.12 Reporting, disclosures, and audit exports

Reports must be reproducible rather than assembled from client-side view state.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Report jobs | Generate server-side reports for selected periods, scope, units, methodology, and audience | A queued report has status, input parameters, file artifact, and access control. | P0 |
| Controlled exports | Export CSV/XLSX/PDF from authoritative server queries | Export includes generated-at time, scope, factor/model versions, and audit reference. | P0 |
| ESG scorecard | Present SDG 7/9/11/12/13 contribution indicators with methodology | Every claimed contribution points to measured, modeled, or unavailable evidence. | P1 |
| Carbon inventory report | Produce a factor-linked, period-specific inventory with scope/category boundaries | A reviewer can reproduce each total from source data. | P1 |
| Utility and facility report | Summarize energy, water, waste, renewable, cost, actions, and anomalies for operations teams | Period filters and site scope are preserved in the output. | P1 |
| Audit package | Bundle source files, calculations, factor versions, change history, and sign-off evidence | A package contains a manifest with checksums and access record. | P2 |
| Scheduled distribution | Deliver approved reports to permitted recipients on a cadence | Distribution has an approval, recipient audit, and failure status. | P2 |

### 3.13 Security, privacy, compliance, and administration

These are functional product requirements, not optional hardening tasks.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Authorization matrix | Test every role against every sensitive route and mutation | Automated tests prove deny-by-default behavior. | P0 |
| Rate and payload controls | Limit abuse, oversized imports, ingestion spikes, and expensive queries | Controlled load tests show safe rejection and recoverability. | P0 |
| Security headers | Configure content security policy, framing policy, transport policy, and secure cookie behavior | Browser/security scans confirm expected policies. | P1 |
| Secret governance | Inventory secrets, scope by environment, rotate keys, detect exposure, and audit connector access | Rotation does not break an authorized connector. | P0 |
| Privacy controls | Publish data purpose, consent where needed, retention, deletion/export paths, and processor inventory | Operators can respond to a tenant data request with evidence. | P1 |
| Audit viewer | Provide searchable audit history for data, access, settings, actions, exports, and decisions | Users can filter events by actor, entity, period, and event type. | P1 |
| Compliance configuration | Support region/tenant policies without claiming certification prematurely | Reporting and retention settings are explicitly marked policy-driven. | P2 |
| Admin console | Manage factors, rules, integrations, users, system status, and feature flags safely | Administrative changes have confirmation, approval, audit, and rollback paths. | P1 |

### 3.14 Reliability, observability, deployment, and support

An operational service requires independent observability and recovery—not just a successful local build.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Health endpoints | Offer liveness, readiness, database, and worker health responses | A dependency outage changes readiness without falsely reporting a healthy service. | P0 |
| Structured logging | Emit structured, redacted logs with request/run/tenant correlation IDs | A support operator can follow one ingestion or worker run across components. | P0 |
| Metrics dashboard | Track latency, error rate, worker lag, runs, queue depth, data freshness, alert rate, and imports | Thresholds and history expose degraded service. | P1 |
| Error tracking | Capture handled/unhandled server and client errors with release version and context | Test error reaches the error-tracking pipeline without exposing secrets. | P1 |
| Backup and restore | Encrypt backups, define RPO/RTO, conduct restore drills, and document ownership | A restore drill recreates a selected tenant dataset within target objectives. | P0 |
| Staging and promotion | Establish dev/staging/production config, migration gates, feature flags, and rollback process | A release passes staging checks before production promotion. | P0 |
| CI/CD quality gates | Run typecheck, unit/API/E2E tests, security scanning, dependency checks, and migration review | A failing quality gate blocks a release artifact. | P0 |
| Performance program | Budget bundles, test large datasets, optimize charts, monitor Core Web Vitals, and verify mobile responsiveness | Performance thresholds are measured in CI and on representative devices. | P1 |
| Support runbooks | Document data import recovery, connector failure, alert triage, factor change, backup recovery, and incident response | A new operator can execute controlled recovery using the runbook. | P1 |
| Status page | Communicate availability, incidents, planned maintenance, and historic uptime | Status changes are separate from the main application outage path. | P2 |

### 3.15 UX, accessibility, and public trust

The Field Operations Ledger design should remain distinctive while becoming more operable at real data volume.

| Feature | Functional behavior | Completion evidence | Priority |
|---|---|---|---|
| Responsive operations UI | Maintain usable workflows on desktop, tablet, and mobile for core read/acknowledge/action flows | Real-device/browser checks show no blocking overflow or inaccessible controls. | P0 |
| Accessibility programme | Validate keyboard use, focus order, semantic structure, contrast, zoom, reduced motion, errors, and screen-reader flows | Formal WCAG 2.2 AA audit issues are tracked and resolved. | P0 |
| Global search | Search sites, meters, alerts, actions, reports, and documents within tenant scope | Results respect authorization and offer direct contextual links. | P2 |
| Command palette | Offer accessible keyboard navigation for common operational actions | Common tasks work without a pointer device. | P2 |
| Methodology and terminology | Explain EcoScore, carbon methods, forecasts, factors, data quality, and simulated values in-product | Every important metric has a concise explanation and link to detailed method. | P0 |
| Localization | Support timezones, locale-specific dates/numbers, currencies, units, and selected languages | Outputs render consistently for configured tenant locale. | P2 |
| Public trust pages | Add privacy, terms, data-use, accessibility, security-contact, and methodology notices | Public narrative makes accurate claims and exposes operating boundaries. | P1 |

## 4. Feature Priority and Release Sequence

The following sequence is the recommended path to a **fully functional** product. “Fully functional” means the defined workflow is real, persisted, recoverable, authorized, observable, tested, and explainable—not merely visible in the interface.

| Release | Objective | Highest-value work | Completion gate |
|---|---|---|---|
| **R0 — Verified pilot foundation** | Demonstrate trusted end-to-end monitoring | Current tenant model, intake, pilot quality/carbon/anomaly/EcoScore, manual worker run, alert acknowledgement, scenarios | **Completed for pilot scope.** |
| **R1 — Trusted data plane** | Receive real operational data safely | CSV import, quarantines, correction workflow, source health, factor library, role/invite management, server exports | Multi-row imports and corrections produce auditable data lineage. |
| **R2 — Deployed continuous operations** | Keep monitoring working without browser involvement | Deploy scheduler, worker health, run dashboards, retries, notifications, alert resolution, backups, health endpoints | Browser/API restart does not stop monitored processing; fault test recovers safely. |
| **R3 — Decision intelligence** | Turn evidence into credible operational choices | Forecasts, recommendation rules, AI explanation with evidence, action workflows, intervention comparison, realized measurement | Every recommendation links to source evidence and later measured outcome. |
| **R4 — Multi-site collaboration** | Enable campus/portfolio teams | Site permissions, assignments, approvals, attachments, portfolio view, report jobs, scheduled distributions | Owner/manager/operator/viewer journeys pass authorization and browser tests. |
| **R5 — Production hardening** | Operate with confidence | CI/CD, security baseline, observability, restore drills, accessibility audit, performance budget, support runbooks | Staging and production release gates, restore drill, security and accessibility checks pass. |
| **R6 — Ecosystem expansion** | Add advanced integrations and analytics | BMS/IoT/utility/Odoo connectors, advanced models, portfolio optimization, external benchmark support | Connector contracts, model evaluation, and governance reviews are evidenced. |

## 5. Definition of “Fully Functional” by User Journey

The platform should not be called complete until each journey below works with real permissions, stored records, deterministic calculations, failure handling, and tests.

| User journey | Required end-to-end behavior |
|---|---|
| New customer onboarding | Owner creates organization, configures reporting scope, invites team, creates sites/meters, and completes setup checklist. |
| Real data onboarding | Operator imports validated CSV or connects an approved data source, fixes quarantined rows, and views source health. |
| Continuous monitoring | Background scheduler consumes new data, records run state, evaluates quality, calculates metrics, detects anomalies, updates score, and emits alerts without a browser. |
| Incident response | Responsible operator receives a routed alert, opens evidence, acknowledges it, assigns/executes work, attaches proof, resolves it, and measures the outcome. |
| Investment decision | Manager compares interventions with transparent assumptions, selects one, obtains approval, tracks delivery, and compares modeled versus realized results. |
| Reporting and audit | Authorized user generates a scoped report/export whose figures trace to readings, factors, calculation versions, corrections, and approvals. |
| Security operations | Owner reviews access, rotates a connector credential, sees audit activity, and removes a departing user without data exposure. |
| Recovery | Operator identifies a connector/worker failure, retries or replays safely, follows a runbook, and validates restored service health. |

## 6. Items That Must Remain Explicitly Qualified

The following statements must remain qualified until their associated implementation and evidence exist.

| Do not claim | Required proof before claiming it |
|---|---|
| Certified carbon reporting | Governed factor library, methodology, independent review, complete scope boundaries, and report controls. |
| Live AIEM Campus monitoring | Verified live data source, source-health evidence, deployed schedule, and approved data owner confirmation. |
| Production Odoo integration | Authenticated connector, field mapping, reconciliation, security review, and live error/retry evidence. |
| Forecast accuracy | Backtests, error metrics, uncertainty representation, model monitoring, and documented target population. |
| Guaranteed savings or ROI | Contracted cost assumptions, intervention implementation evidence, and realized measurement window. |
| Autonomous AI management | Explicit governance, human approval, robust guardrails, traceable evidence, and incident controls. |
| Production-ready service | Security, operations, backup/restore, observability, delivery, performance, and accessibility release gates. |

## 7. Recommended Immediate Build Order

To make the next iteration materially more complete rather than cosmetically broader, build the following in order:

1. **CSV import with preview, quarantine, correction, and persistent source-file provenance.** This creates a practical data plane for a campus demonstration and future real sources.
2. **Deploy and activate the scheduled monitoring callback with worker health, run history, retry policy, and notifications.** The code path exists; this makes it continuously operational after deployment.
3. **Governed emissions-factor library and methodology views.** This converts the current clearly labeled pilot factor into traceable carbon accounting.
4. **Role/invitation management plus granular authorization tests.** This makes multi-user operation safe.
5. **Forecasting and rule-based recommendations with explicit evidence contracts.** Add AI-written explanation only after the numerical services are tested and persistent.
6. **Action assignment, approval, and realized-outcome measurement.** This completes Detect → Recommend → Act → Measure.
7. **Server-generated reports, operational observability, backups, CI/CD, and security hardening.** This creates the foundation for a credible production release.

## 8. Final Product Vision

EcoSphere AI should become a trustworthy sustainability operating system rather than a dashboard. Its completed loop is:

```text
Connect and validate trusted sources
→ measure environmental performance
→ detect and explain material changes
→ forecast likely near-term outcomes
→ compare and approve interventions
→ coordinate accountable action
→ measure realized impact
→ report traceable results
→ continuously improve rules, targets, and operations
```

The differentiator is not an unconstrained AI chat interface. It is a **traceable operational decision loop** where every claimed metric, anomaly, recommendation, scenario result, alert, action, and report can be connected to the data, calculation version, responsible person, and evidence that produced it.
