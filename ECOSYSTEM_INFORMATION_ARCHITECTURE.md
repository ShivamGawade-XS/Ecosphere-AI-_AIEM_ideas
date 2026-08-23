# EcoSphere AI — Authenticated Product Ecosystem

## Product model

The public route `/` remains a clearly bounded Field Operations Ledger narrative. The authenticated product begins at `/app` and is organized around an operator’s daily loop rather than the landing page’s storytelling sequence.

| Route | Workspace | Primary job | Live source of truth |
|---|---|---|---|
| `/app` | Overview | See tenant status, data recency, active work, and the next operational step. | Organization, site, meter, ingestion, action, and reading summary APIs |
| `/app/registry` | Registry | Establish the tenant, sites, and canonical meters. | Organization, site, and meter APIs |
| `/app/data` | Live Data | Ingest validated readings and review ingestion evidence. | Reading and ingestion-batch APIs |
| `/app/intelligence` | Intelligence | Inspect data readiness and the staged analytics pipeline without overstating unbuilt alerts or forecasts. | Reading summary and implementation-status APIs |
| `/app/actions` | Actions | Create, assign, advance, and close accountable sustainability interventions. | Action APIs and audit events |
| `/app/reports` | Reports | Review auditable operational totals and export scoped data. | Reporting summary and reading APIs |
| `/app/readiness` | Readiness | Track the production implementation inventory. | Implementation-status API |

## Cross-workspace operating loop

`Registry → Live Data → Intelligence → Actions → Reports → Overview`

Every workspace is organization-scoped. Registry creates the allowed measurement boundary; Live Data writes immutable, idempotent readings; Intelligence only displays evidence that is actually available; Actions turns an intervention into accountable work; Reports summarize records without claiming certification; Overview presents the next useful operational move.

## State model

| Entity | Authoritative lifecycle |
|---|---|
| Organization | Created → membership granted → active tenant |
| Site | Registered → active → inactive |
| Meter | Registered with canonical unit → active → inactive |
| Reading | Submitted → validated/deduplicated → persisted with provenance → eligible for analytics |
| Action | Proposed → in progress → completed or archived |
| Analytics capability | Planned → in progress → implemented, as recorded in readiness inventory |

## Trust boundaries

The simulator remains a public prototype until a server-authoritative scenario service is implemented. The Intelligence workspace must show factual reading/ingestion state and planned analytics capabilities; it must not fabricate anomalies, forecasts, or recommendations. All mutation routes use authenticated organization membership, and all core changes create audit events.
