# EcoSphere AI — Production Delivery Roadmap

**Status:** Active delivery programme.  
**Starting point:** Verified authenticated AIEM Campus pilot with deterministic monitoring and simulated anomaly evidence.  
**Production claim:** Do not call the platform production-ready until the release gates in Release 5 are evidenced.

## Operating model decision

EcoSphere uses deterministic server-side work for ingestion, quality evaluation, carbon calculations, monitoring, alerts, scoring, and reporting. AI-generated text remains an optional explanation layer that is constrained to persisted evidence.

| Operating option | Suitable workload | Trade-off | Decision gate |
|---|---|---|---|
| Managed periodic callbacks | Five-minute or slower monitoring, scheduled imports, report generation, bounded retries | Each run must complete within the callback limit and remain stateless | Default for the current campus pilot after the site is published. |
| Persistent application process | Sub-minute polling, persistent queue consumers, high-volume continuously connected source traffic | Requires a persistent hosting tier and its ongoing cost | Select only after measuring source volume or requiring continuous external polling. |
| External runtime | Custom system dependencies, vendor gateway software, Docker, fixed network rules, or workloads beyond managed runtime limits | Introduces separate infrastructure and operations ownership | Select only when a concrete managed-platform limit is evidenced. |

> No live periodic job is created during preview. The current protected scheduled callback must be deployed and then explicitly activated by the project owner.

## Release sequence

| Release | Objective | Deliverables | Acceptance gate |
|---|---|---|---|
| **R0** | Verified pilot baseline | Tenant isolation, canonical registry, deterministic monitoring, pilot anomaly alerts, EcoScore, scenarios, actions | Completed only for pilot scope; simulated data is explicitly labeled. |
| **R1** | Trusted data plane | CSV upload/preview/mapping, batch quarantine, correction workflow, file provenance, emissions factor library, source health | A multi-row import is idempotent, invalid rows are quarantined, and every carbon result traces to an approved factor version. |
| **R2** | Durable operations | Scheduler activation, worker health, run history, bounded retry, alert routing, acknowledgement/resolution, health checks | Browser closure and API restart do not stop scheduled processing; a controlled failure is visible and recoverable. |
| **R3** | Decision and collaboration | Forecasts with uncertainty, evidence-linked recommendations, intervention comparison, action assignment/approvals, realized outcome measurement | Each recommendation links to source evidence and may be accepted, rejected, acted on, and measured. |
| **R4** | Reporting and administration | Invitations/roles, audit viewer, controlled exports, report jobs, SDG methodology, evidence packages | User and report access are authorization-tested and generated reports are reproducible. |
| **R5** | Production hardening | Security controls, observability, backup/restore, CI quality gates, accessibility, performance, operational runbooks | Staging release, restore drill, security suite, accessibility audit, and resilience checks pass. |
| **R6** | Ecosystem expansion | BMS/IoT/utility/Odoo connectors, advanced models, portfolio optimization, external benchmarks | Each connector/model has a documented contract, health status, governance, and failure/replay behavior. |

## Cross-release non-negotiables

1. Each schema change follows schema edit → generated migration → SQL review → managed migration application → verification.
2. Each new numerical result persists calculation inputs, formula/model/factor version, data window, output, and timestamp.
3. Every API mutation is authenticated, tenant-scoped, authorized by role, validated, auditable, and covered by regression tests.
4. Every user-facing workflow has loading, empty, error, success, and unauthorized states.
5. Every connector, import, job, report, or notification is idempotent and presents recovery information.
6. Every simulated, modeled, estimated, or forecast value is labeled in persistence, UI, and exports.

## Immediate delivery slice: R1

The first build slice implements the foundations that make real operational data safe enough to monitor:

| Workstream | First implementation | Definition of done |
|---|---|---|
| Import foundation | CSV source-file records, idempotent batch records, row validation, preview, quarantine status | Valid and invalid rows are visible before commit, with no duplicate accepted readings on replay. |
| Data corrections | Immutable raw record, corrected successor, reviewer, reason, downstream recomputation marker | A correction never overwrites raw evidence and visibly changes affected analytics. |
| Factor governance | Approved emissions factor records with source, geography, validity, scope, unit, version, and status | Carbon calculation selects only approved valid factors and records the exact factor version. |
| Evidence UI | Import history, factor library, data-quality work queue, lineage cards | Operator can trace a dashboard metric back to source file/reading/factor. |
| Security baseline | Role checks, payload bounds, rate-limit design, audit records, secret inventory | Authorization and malformed-input tests cover every new route. |

## External prerequisites that cannot be fabricated

| Dependency | Why it is needed | Owner decision required |
|---|---|---|
| Published production URL | Scheduled callbacks run against the deployed site, not the preview server | Owner publishes an approved checkpoint. |
| Factor sources and approval policy | Certified/regional factors require authoritative source selection and governance | Sustainability owner selects governing source and geographical/reporting scope. |
| Connector credentials | Utility, BMS, Odoo, email, chat, and storage integrations require authorized credentials | System owner supplies or securely connects each provider account. |
| Data governance policy | Retention, privacy, access review, and backup targets must reflect the organization’s policy | Data owner approves policy, RPO/RTO, and escalation requirements. |
| Notification destination | Routing needs approved recipients/channels and escalation ownership | Operations owner specifies responsible roles and response expectations. |

## Current delivery status

The programme begins with R1. No certification, live campus-source integration, continuous production schedule, or guaranteed savings claim is implied by this roadmap.
