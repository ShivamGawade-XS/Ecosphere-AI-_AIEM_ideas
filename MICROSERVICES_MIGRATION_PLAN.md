# EcoSphere AI — Static Prototype to Production Platform Migration Plan

**Status:** Approved implementation baseline  
**Date:** 22 August 2026  
**Principle:** Retain the public Field Operations Ledger experience while moving all sustainability truth, identity, and operational workflows behind authenticated server-side services.

## 1. Target architecture

EcoSphere AI should evolve as a **service-oriented platform with deployable boundaries**, not as a collection of browser states. The first release should use a modular application core to reduce early operational complexity, while keeping the following service contracts independent so each can be extracted into its own deployment once load, team ownership, or reliability needs justify it.

| Service boundary | Responsibility | Data ownership | Initial transport |
|---|---|---|---|
| Identity and Access | Session verification, user profiles, roles, organization membership, service authorization. | User and membership records. | Authenticated HTTP/RPC. |
| Sustainability Registry | Organizations, sites, meters, units, emission-factor versions, source configuration. | Master sustainability metadata. | Authenticated HTTP/RPC. |
| Ingestion | Validates manual/API/CSV meter readings, enforces idempotency, persists source provenance, emits a normalized event. | Raw source payload hashes and ingestion outcomes. | REST API now; webhook/connectors later. |
| Analytics and Monitoring | Aggregates readings, computes carbon/EcoScore, detects anomalies, forecasts demand, creates recommendations. | Derived metrics, model versions, anomaly and forecast records. | Durable worker/queue consumer. |
| Action and Scenario | Runs authoritative what-if scenarios, stores assumptions, compares interventions, tracks approved actions and realized results. | Scenario versions, interventions, action lifecycle. | Authenticated HTTP/RPC. |
| Notification | Routes alerts and action assignments according to user/site preferences. | Delivery attempts and notification preferences. | Event-driven queue consumer. |
| Reporting and Audit | Produces dashboards, exports, audit trails, and traceability views. | Immutable audit events and generated exports. | Read-only API and asynchronous export job. |

### Data flow

`Meter / CSV / connector → Ingestion API → Validation + idempotency → Transactional database → Domain event → Monitoring worker → Derived metrics / anomaly / alert / recommendation → Authenticated dashboard and notification delivery.`

The browser never owns the monitoring loop or the source-of-truth calculation. It requests data and mutation commands through authenticated APIs, while the worker consumes persisted work independently of browser sessions.

## 2. Implementation route and trade-offs

| Route | Benefits | Cost and complexity | Recommendation |
|---|---|---|---|
| Modular platform core with explicit service contracts | Fastest path to a secure pilot; shared database transaction support; simple operator model; later extraction remains possible. | Requires discipline to prevent cross-domain coupling. | **Implement first.** |
| Immediate independently deployed microservices | Strong isolation and independent scale boundaries from day one. | Adds service discovery, distributed tracing, queue infrastructure, deployment coordination, and failure modes before demand is proven. | Plan for later extraction of Ingestion, Analytics, and Notification. |

The current scope should therefore implement the **identity, registry, and ingestion boundaries as application modules** backed by a secure database. The migration plan defines the future extracted microservice topology without prematurely turning the first reliable production core into a distributed-systems project.

## 3. Database model

The initial relational schema must use durable identifiers, organization scoping, timestamps, foreign keys, audit fields, and unique idempotency constraints.

| Table | Purpose | Key constraints |
|---|---|---|
| `organizations` | Tenant root. | Unique slug; owning user. |
| `organization_memberships` | User-to-organization roles. | Unique `(organization_id, user_id)` membership. |
| `sites` | Campus, building, or operational location. | Scoped to organization. |
| `meters` | Registered resource meter/data source. | Scoped to site; resource type and unit validation. |
| `sustainability_readings` | Raw validated meter measurements. | Unique `(meter_id, observed_at, source, idempotency_key)`; non-negative value. |
| `ingestion_batches` | CSV/API import audit and outcomes. | Request id/idempotency key; status and row count. |
| `emission_factors` | Versioned carbon factors. | Effective date range, unit, geography, source citation. |
| `audit_events` | Immutable operator and system action history. | Actor, organization, resource, event type, payload hash. |

## 4. Authentication and authorization

User identity is provided by the platform authentication service. The application must map the authenticated user to an organization membership before returning or mutating tenant data. No client-supplied organization ID is trusted without a matching membership check.

| Role | Baseline permissions |
|---|---|
| Owner | Manage organization, members, sites, integrations, exports, and retention settings. |
| Sustainability Manager | Manage sites, meters, imports, scenarios, interventions, and alert workflows. |
| Operator | Create readings/imports, acknowledge alerts, update assigned actions. |
| Viewer | Read dashboards, reports, alerts, and approved scenarios. |

## 5. Core API contract

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/organizations` | `POST` | Create the current user’s organization. |
| `/api/organizations/current` | `GET` | Get current organization, membership, and bootstrap status. |
| `/api/sites` | `POST` / `GET` | Create and list tenant sites. |
| `/api/meters` | `POST` / `GET` | Register and list validated meters. |
| `/api/readings` | `POST` | Ingest a single authenticated, idempotent resource reading. |
| `/api/readings/batch` | `POST` | Ingest a validated batch of readings with row-level outcomes. |
| `/api/ingestion-batches` | `GET` | Display recent ingestion status and rejected-row evidence. |
| `/api/implementation-status` | `GET` | Return production-readiness requirements and completion state. |

## 6. Deployment topology

The first protected platform release needs three deployable concerns: a frontend, an application/API process, and durable database storage. The analytics worker is a fourth concern once monitoring starts. The application can start as a managed full-stack deployment with a managed database and authenticated user system. The analytics/ingestion queue worker should run independently as a persistent process when low-latency, continuous monitoring is required.

| Environment | Required services | Gate |
|---|---|---|
| Development | Local app, isolated development database, fixture data. | Type check, unit tests, seed/reset. |
| Staging | Auth, database, APIs, worker, controlled meter fixture. | Integration, migration, E2E, access-control, and restore tests. |
| Production | HTTPS frontend, API, managed database, secrets, telemetry, persistent worker/queue, backups. | Security review, performance budget, incident runbook, monitored rollout. |

## 7. Migration sequence

1. Preserve the existing public experience under `/` as the truthful product narrative.
2. Add authenticated application routes under `/app`.
3. Create organization bootstrap, membership checks, sites, and meter registration.
4. Implement single/batch reading ingestion with validation, tenant authorization, idempotency, and audit events.
5. Build the implementation-status dashboard from a versioned readiness inventory.
6. Add authoritative carbon/EcoScore/scenario modules and move browser-only math behind the API.
7. Add worker/queue analytics with durable retry, alert lifecycle, and notification service.
8. Extract Ingestion, Analytics, and Notification into independently deployable services only after operational evidence justifies the boundary.

## 8. Reusable skill scope

The reusable skill created from this work will guide agents through: audit of a static sustainability prototype; production-readiness inventory; modular-to-microservice boundary design; database/auth upgrade; deterministic ingestion contract; interactive status dashboard; verification; and truthful delivery. It will include a concise migration-plan template and an implementation-status inventory template.
