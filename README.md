# EcoSphere AI — AI-Powered Sustainability Mission Control

EcoSphere AI is a **tenant-scoped sustainability-operations platform** built for the AIEM IDEAS 2026 demonstration. It implements an operational loop of **Monitor → Detect → Predict → Simulate → Recommend → Act → Measure → Repeat**.

The application is designed to make sustainability decisions inspectable. Deterministic services calculate data quality, carbon, anomaly, EcoScore, forecasts, intervention comparisons, and action evidence. AI-generated language is restricted to explanations and recommendations; it must not manufacture measurements, forecasts, factors, or savings.

## Implemented Product Scope

| Area | Implemented capability | Important boundary |
|---|---|---|
| Tenant workspace | OAuth-protected organizations, sites, meters, role boundaries, and tenant-scoped audit evidence. | Members must already exist through the configured identity provider; this repository does not deliver invitation emails. |
| Trusted data | CSV preview, validation, quarantine, idempotent import commit, correction lineage, and governed factor records. | All pilot and simulated sources remain labelled. The fallback factor is not certified reporting. |
| Monitoring | Browser-independent, idempotent worker path for quality analysis, carbon, anomalies, EcoScore, forecasts, and recommendations. | A recurring scheduler is deliberately inactive until deployment and controlled-trial evidence exist. |
| Decision support | Server-authoritative scenarios, intervention comparisons, evidence-linked recommendations, actions, collaboration, attachments, and report snapshots. | Modelled savings and forecasts are not guarantees or realized performance claims. |
| Administration | Owner-safe role controls, audit evidence, liveness/readiness visibility, and an owner-gated scheduler-trial planner. | Planning a trial does not imply a schedule is active. |
| Operations | Health/readiness endpoints, correlation-safe request telemetry, recovery states, quality workflow, runbooks, and security headers. | External telemetry, notifications, backups, remote CI proof, and restore-drill evidence remain operator responsibilities. |

## Product Journeys

1. Sign in with the configured OAuth provider and open **Operations Overview**.
2. Register a site and meter in **Registry**, then ingest labelled readings in **Live Data** or **Data Quality**.
3. Review deterministic quality findings, carbon calculations, EcoScore, trends, anomalies, and alerts in **Intelligence**.
4. Model an intervention in **Scenarios**, persist a comparison, and create an accountable action.
5. Add evidence before completing actions; review evidence snapshots and factor disclosures in **Reports**.
6. Review role controls, health/readiness state, audit evidence, and safe scheduler-trial steps in **Administration**.

## Architecture

```text
React 19 + TypeScript + Vite
        │
        ├── Wouter routes / React Query / tRPC client
        │
Express 4 + tRPC 11 + OAuth
        │
        ├── tenant and role authorization
        ├── deterministic sustainability services
        ├── storage-backed action evidence
        └── public health/readiness endpoints
        │
Drizzle ORM + managed MySQL/TiDB
        │
        ├── organizations, sites, meters, readings
        ├── import, factor, and correction lineage
        ├── quality, anomaly, carbon, score, forecast records
        ├── recommendations, actions, comparisons, reports
        └── monitoring runs, recovery, routing, scheduler evidence
        │
Browser-independent monitoring worker
        │
        └── one-shot CLI or authenticated cron callback
```

The worker contains no browser-owned loop, `setInterval`, `node-cron`, or uncontrolled LLM loop. Scheduled requests use idempotent run keys, and `/api/scheduled/monitoring` accepts only platform-authenticated cron requests.

## Technology Stack

| Layer | Technology |
|---|---|
| Front end | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, Radix UI, React Query |
| Server/API | Express 4, tRPC 11, SuperJSON, Zod |
| Data | Drizzle ORM with MySQL/TiDB |
| Identity | OAuth integration with owner/manager/operator authorization |
| Storage | Managed object storage references for action attachments; file bytes are not stored in database columns |
| Tests | Vitest and Testing Library |
| CI | GitHub Actions quality workflow at `.github/workflows/quality.yml` |

## Repository Layout

```text
client/                 React application, pages, UI components, tests
server/                 tRPC contracts, persistence, worker, server core
drizzle/                Schema and reviewed SQL migrations
shared/                 Shared types and constants
.github/workflows/      CI quality workflow
DEPLOYMENT_GUIDE.md     Deployment, migration, scheduler, and rollback procedure
RELEASE_OPERATIONS_RUNBOOK.md
MONITORING_OPERATIONS_RUNBOOK.md
```

## Local Development

Use Node.js 22 or later and the pinned pnpm version declared in `package.json`. Authenticated database workflows need a compatible MySQL/TiDB database and OAuth settings managed outside version control.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The server selects an available port beginning at `3000`. Opening the front end does **not** start continuous monitoring.

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the Express/Vite development server. |
| `pnpm check` | Run TypeScript validation. |
| `pnpm test` | Run the Vitest suite. |
| `pnpm build` | Build browser assets and server output. |
| `pnpm start` | Run the built production server. |
| `pnpm quality` | Run type-check, tests, build, and whitespace validation. |
| `pnpm monitor:once` | Run one deterministic, browser-independent monitoring cycle. |
| `pnpm drizzle-kit generate` | Generate SQL after a reviewed schema change. |

Do not use `pnpm db:push` to replay historical migrations in an already-provisioned managed environment. Follow the reviewed process in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Environment and Secrets

Use the deployment platform’s secret-management interface. Do not commit a populated environment file. The runtime requires configuration for the database connection, session/JWT signing, OAuth application and server URLs, managed platform services, and initial owner metadata. In a managed Manus deployment these are supplied through the project configuration.

Do not expose server credentials through browser-visible configuration, source control, client logs, API responses, report snapshots, screenshots, or audit payloads.

## Database Changes

1. Update `drizzle/schema.ts` and generate a migration using `pnpm drizzle-kit generate`.
2. Read every generated statement and keep migrations additive where practical.
3. Use TiDB-compatible foreign-key and index names.
4. Record a database backup/snapshot before applying DDL.
5. Apply only reviewed SQL through the managed database workflow.
6. Verify the resulting schema and run `pnpm quality` plus a protected API read-after-write check.

Historical migrations contain manual-application notes. Never blindly replay them against the managed environment.

## Monitoring and Scheduler Operation

```bash
# One controlled local or preview cycle
pnpm monitor:once

# Deployed scheduler target after all release gates pass
POST /api/scheduled/monitoring
```

The scheduler endpoint derives a tenant-specific task UID and requires platform cron authentication. Activate recurrence only after deployment, deployed health/readiness verification, and a successful controlled trial with persisted monitoring and recovery evidence. See [MONITORING_OPERATIONS_RUNBOOK.md](MONITORING_OPERATIONS_RUNBOOK.md).

## Health, Readiness, and Security

| Control | Purpose |
|---|---|
| `GET /healthz` | Public liveness check. |
| `GET /readyz` | Public readiness check with database and scheduler disclosure. |
| `x-request-id` | Correlation identifier for responses and request-completion telemetry. |
| Security headers | `nosniff`, frame denial, strict referrer policy, permission restrictions, same-origin resource policy; production adds CSP and HSTS. |
| Safe errors | Scheduled failures return a generic error contract rather than raw exception text. |

Request telemetry intentionally excludes request bodies, headers, query strings, and raw errors.

## Quality and Demonstration

```bash
pnpm install --frozen-lockfile
pnpm quality
```

For an AIEM demonstration, use clearly labelled pilot/simulated inputs: open the AIEM Campus overview; trigger a controlled simulated HVAC spike; inspect the persisted anomaly, score, alert, and evidence-linked recommendation; model an intervention in Scenarios; accept it as an action; attach evidence; show report provenance; and explain the deployment-gated scheduler state in Administration.

## Claim-Safe Language

EcoSphere AI may be described as an **AI-powered, evidence-grounded sustainability operations platform prototype with production-oriented controls**. It must not be described as a live AIEM telemetry deployment, certified carbon-reporting platform, continuously scheduled production service, externally delivered alert system, integrated Odoo deployment, forecast-accuracy guarantee, or savings guarantee until the relevant external evidence exists.

## Documentation

| Document | Purpose |
|---|---|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Publication, migration, scheduler activation, rollback, and release evidence. |
| [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) | Vercel serverless adapter, configuration, secret names, controlled Cron trial, and hosting constraints. |
| [RELEASE_OPERATIONS_RUNBOOK.md](RELEASE_OPERATIONS_RUNBOOK.md) | Release, backup, recovery, and operational controls. |
| [MONITORING_OPERATIONS_RUNBOOK.md](MONITORING_OPERATIONS_RUNBOOK.md) | Worker health, recovery, routing, and scheduler operations. |
| [MONITORING_API_AND_WORKER_SPEC.md](MONITORING_API_AND_WORKER_SPEC.md) | Deterministic monitoring contract. |
| [PRODUCTION_RELEASE_VALIDATION.md](PRODUCTION_RELEASE_VALIDATION.md) | Verified release-candidate journeys and remaining operator gates. |
| [ACCESSIBILITY_REVIEW.md](ACCESSIBILITY_REVIEW.md) | Implemented accessibility controls and validation boundaries. |
| [PERFORMANCE_NOTES.md](PERFORMANCE_NOTES.md) | Build-time delivery findings and future measurements. |

## License

This repository declares the MIT license in `package.json`. Confirm final licensing and third-party attribution requirements before a public commercial release.
