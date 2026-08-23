# Packaging Checklist

- [x] Create a complete source-and-configuration archive of the EcoSphere AI website.
- [x] Deliver the ZIP download to the user.

## Improvement Loop

- [x] Audit visual hierarchy, responsive behavior, interaction feedback, accessibility, and loading performance.
- [x] Implement and document the highest-impact quality fixes.
- [x] Rebuild, test controls, and verify the revised desktop and mobile experience.

## Simulator Processing Feedback

- [x] Add an accessible loading animation for intervention preset processing.
- [x] Add status messages for processing, applied, and error-safe states.
- [x] Build and browser-test the preset interaction.

## Production Readiness Assessment

- [x] Inventory product, architecture, security, reliability, deployment, and governance gaps.
- [x] Define the necessary functionality and acceptance criteria for a production-grade platform.
- [x] Deliver a prioritized production-completion roadmap.

## Production Platform Migration

- [x] Write the target microservices migration plan, service boundaries, and deployment sequence.
- [x] Upgrade the app to include secure database and user-management foundations.
- [x] Implement core organization, site, meter, and authenticated reading-ingestion services.
- [x] Build an interactive production-readiness dashboard using the implementation inventory.
- [x] Add and run critical service and dashboard tests.
- [x] Package the migration workflow as a validated reusable skill.

## Remaining Verification Gates

- [x] Add automated frontend tests for implementation-status dashboard loading, filtering, detail selection, and error states.
- [x] Add automated frontend tests for ingestion-workbench setup and mutation feedback states.
- [x] Complete one successful authenticated browser flow for organization, site, meter, and reading ingestion; otherwise retain it as an explicit external verification gate.
- [x] Add frontend tests for site-registration, meter-registration, and reading-ingestion feedback states.
- [x] Add frontend tests for ingestion-workbench state transitions that enable the next operational step.

## Product Ecosystem Expansion

- [x] Define the authenticated product information architecture and cross-workspace navigation.
- [x] Build dedicated Overview, Registry, Live Data, Intelligence, Actions, and Reports workspaces.
- [x] Connect real organization, site, meter, reading, and ingestion evidence across the operational views.
- [x] Add transparent foundations for intelligence, intervention/action management, and reporting workflows.
- [x] Add route-level tests and verify the expanded ecosystem on desktop and mobile.
- [x] Implement a server-authoritative, saved What-If scenario service and authenticated scenario workspace.

## Ecosystem Completion Gates

- [x] Complete a successful authenticated browser flow from Registry through Live Data to Overview and Reports, recording persisted evidence across workspaces.
- [x] Add explicit loading, error, and mutation-feedback states for Intelligence, Actions, Reports, and Scenario workspaces.
- [x] Add app-shell navigation tests that exercise sidebar routes rather than isolated component renders.
- [x] Verify every authenticated ecosystem route at mobile size and record the result.
- [x] Add page-level loading states for Actions and Scenario workspace queries.
- [x] Add frontend tests for loading and mutation success/error feedback across Intelligence, Actions, Reports, and Scenarios.

## Product Entry and Discoverability

- [x] Promote the authenticated Operations Overview to the default product route.
- [x] Retain the narrative landing experience on a clearly labeled public route.
- [x] Add clear product-entry actions and app-shell navigation that expose every functional workspace.
- [x] Add and run entry-flow tests for the default product and public narrative routes.

## Route Entry Coverage Follow-up

- [x] Add automated route-entry tests proving `/` renders Operations Overview and `/narrative` renders the public narrative.
- [x] Re-run the full suite and record the passing entry-route evidence.
- [x] Confirm the persisted route-entry verification record and rerun the final quality gate after documentation changes.

## Current Gap Inventory

- [x] Audit remaining product, data, intelligence, security, operations, and deployment gaps after the authenticated ecosystem expansion.
- [x] Define the remaining production backlog with acceptance criteria and implementation sequencing.
- [x] Deliver the updated detailed gap inventory to the user.

## Gap Inventory Confirmation

- [x] Confirm the refreshed gap-inventory document is persisted with the current product-state assessment and backlog.
- [x] Re-run a project quality check after documenting the current gaps.
- [x] Deliver the confirmed current-gap inventory to the user.

## Gap Inventory Delivery Confirmation

- [x] Deliver the current implemented-versus-missing capability inventory and prioritized build sequence to the user.

## Monitoring and Analytics Foundation

- [x] Define the deterministic data-quality, anomaly, carbon, EcoScore, and worker data contract.
- [x] Add database records and migrations for quality findings, anomaly events, carbon calculations, EcoScore snapshots, and monitoring runs.
- [x] Implement tenant-safe persistence helpers, deterministic analytics services, and browser-independent monitoring worker code.
- [x] Add protected analytics, worker-control, and status APIs plus a production-ready API/worker specification.
- [x] Add ecosystem monitoring controls and truthful intelligence/score/alert views.
- [x] Add and run monitoring pipeline, API, worker, and route verification tests.
- [x] Extend and validate the reusable production-migration skill for this monitoring pattern.
- [x] Align monitoring eligibility with the documented future-timestamp baseline exclusion and explicit unprocessed-reading selection.
- [x] Reconcile the documented analytics API contract with the implemented router, including EcoScore history and carbon totals.
- [x] Add an explicitly labeled simulated-pilot reading source for controlled anomaly verification without misrepresenting campus data.

## Complete Feature Catalogue

- [x] Review the current verified platform state and gap inventory for a complete feature catalogue.
- [x] Deliver a detailed, prioritized feature catalogue covering product modules, technical foundations, operations, security, and rollout.

## Production Delivery Programme

- [x] Create a production release roadmap with explicit scope, dependency, claim-safety, and acceptance gates.
- [x] Build CSV import, quarantine, correction, lineage, and governed emissions-factor foundations.
- [x] Activate deployed-style monitoring health, durable retry/recovery, alert routing, and scheduler operational runbooks.
- [x] Build forecast, evidence-linked recommendation, action collaboration, comparison, and reporting modules.
- [x] Add invitation/role management, security controls, audit views, and administration workflows.
- [x] Add health, observability, backup/recovery, CI-quality, accessibility, performance, and release-operation foundations.
- [x] Validate full production-release journeys and document remaining external deployment or integration dependencies honestly.

### R4 — Security, Observability, Accessibility, and Release Operations

- [x] Add invitation-ready role-management controls and a tenant-scoped audit-event viewer with protected administration APIs.
- [x] Add health and readiness endpoints with structured monitoring telemetry and explicit dependency status.
- [x] Add CI-ready quality scripts, migration safety documentation, backup/recovery runbook, and production environment checklist.
- [x] Complete an accessibility review for keyboard flow, labels, live regions, focus visibility, and error states across workspaces.
- [x] Reduce the main JavaScript bundle through route-level loading boundaries and document remaining performance limits.
- [x] Add deterministic API and workspace tests for audit boundaries, health readiness, administration authorization, and new operational views.

### R3 — Decision Support and Reporting

- [x] Add deterministic short-horizon forecasting with versioned methods, backtesting metrics, and explicit insufficiency states.
- [x] Extend evidence-linked recommendation generation to consume persisted quality findings, forecasts, governed factors, and modeled intervention evidence without inventing numerical impacts.
- [x] Add storage-backed action attachments, enforce completion-evidence capture before status completion, and retain escalation-to-action lineage.
- [x] Add an authorized API read-after-write regression proving recommendation acceptance yields tenant-scoped action reads with preserved scenario/comparison attribution; linked action outcomes are already surfaced in Scenarios.
- [x] Add report snapshots with criteria, generated evidence, factor/version disclosures, and export-ready data contracts.
- [x] Add functional Forecast, Recommendations, Action Collaboration, and Evidence Reports UI states and role-protected APIs.
- [x] Add focused workspace scope-denial states, comparison/report mutation-isolation API checks, and report-materialization coverage across R3 evidence surfaces.

### R1 — Trusted Data Plane

- [x] Add versioned factor, import-file, import-row, and reading-correction persistence records with tenant-scoped indexes.
- [x] Add deterministic CSV parse/preview/validation services with canonical-unit and meter-key mapping.
- [x] Add idempotent CSV commit and quarantine handling, preserving source-file provenance and audit evidence.
- [x] Add approved-factor selection to carbon calculations while retaining the clearly labeled pilot fallback only where appropriate.
- [x] Add protected factor-library, import, quarantine, correction, and lineage APIs with role checks.
- [x] Add functional Data Quality workspace controls and import/factor/evidence views with loading, error, and empty states.
- [x] Add unit, API, and browser tests for import validation, replay idempotency, factor selection, correction lineage, and tenant isolation.
- [x] Add tenant-scoped lineage APIs for import-file, quarantined-row, reading, provenance, and correction chains with authorization tests.
- [x] Add correction and lineage evidence views with loading, empty, and explicit error states for imports, quarantine, factors, and reading corrections.
- [x] Add mutation-error feedback for CSV preview/commit and factor workflows, then verify the recovery states in tests.
- [x] Show row-level quarantine evidence and validation errors with loading, empty, and error states.
- [x] Show concrete correction records, including original/corrected reading references, reason, status, and timestamps.
- [x] Add frontend recovery tests for CSV preview and commit mutation failures.

### R2 — Durable Monitoring Operations

- [x] Add monitored-job health targets, stale-run detection, failure retry metadata, and operational recovery records.
- [x] Add tenant-scoped alert routing preferences, delivery attempts, acknowledgement/escalation lifecycle, and audit evidence.
- [x] Add explicit notification delivery integration behind user-configured credentials or platform configuration, with no silent claim of external delivery before verification.
- [x] Add monitoring-health, routing, delivery, and recovery APIs with manager/owner role controls.
- [x] Add operational monitoring controls and delivery/recovery evidence views with loading, error, and empty states.
- [x] Document scheduler deployment, run-key semantics, recovery, alert-routing, and no-browser dependency runbooks.
- [x] Add deterministic tests for stale-run health, retry idempotency, routing authorization, delivery attempts, and recovery states.
- [x] Extract and unit-test scheduled-worker health-state evaluation for disabled, healthy, stale, and failed runs.
- [x] Add a persisted alert-escalation lifecycle with escalation policy, state/timestamps, and a bounded non-LLM escalation decision path beyond basic owner delivery.
- [x] Add UI evidence and tests for escalation pending, triggered, suppressed, and resolved outcomes without overstating external-delivery guarantees.
- [x] Add deterministic recovery lifecycle tests for open → retrying → resolved/failed transitions and repeat-retry idempotency.
- [x] Add Intelligence UI tests for pending, triggered-with-action, suppressed, and resolved escalation evidence states.
- [x] Add direct recovery persistence tests for open → retrying → resolved and retrying → failed/reopened transitions.
- [x] Add a focused regression proving a successful matching rerun resolves only its own recovery event.

## Administration Experience Enhancements

- [x] Enhance tenant member-role administration with clear role indicators, owner-safety explanations, and contextual tooltips.
- [x] Build a manager/owner authenticated scheduler-trial workflow that prepares a deployment-gated platform schedule without enabling recurrence in the development environment.
- [x] Add a dedicated administration dashboard for application liveness, readiness dependencies, scheduler-trial status, and safe next actions.
- [x] Add deterministic API, workspace, route-entry, and accessibility tests for the enhanced administration surfaces.
- [x] Verify responsive desktop/mobile administration UX, update operational documentation, and run the complete quality gate.

## Continuation Hardening Cycle

- [x] Add baseline security headers and production-only CSP/HSTS without introducing a fragile dependency.
- [x] Add deterministic security-header middleware tests and include them in the full quality gate.
- [ ] Publish the checkpoint and perform the authenticated scheduler trial against the deployed origin.
- [ ] Configure a verified identity-provider invitation flow after selecting and connecting a delivery provider.
- [ ] Complete remote CI execution, deployed restore rehearsal, and deployed accessibility/performance measurement.

## GitHub Synchronization

- [x] Inspect the provided EcoSphere-specific GitHub repository and confirm its default branch and existing contents.
- [x] Push the current verified EcoSphere AI source and project configuration to the confirmed GitHub destination without modifying unrelated repositories.
- [x] Verify the remote commit, branch, and working-tree contents after push, then record the exact repository URL and commit.

## Repository Documentation, Audit, and Merge

- [x] Create a comprehensive root README covering architecture, local setup, data model, operations, security boundaries, and the AIEM demonstration flow.
- [x] Create a deployment guide covering managed publication, migrations, secrets, health verification, scheduler activation, rollback, and claim-safe external prerequisites.
- [x] Run dependency and source-level security audits and record actionable findings with verified remediation status.
- [x] Merge the verified EcoSphere synchronization branch into the GitHub repository main branch through a conflict-resolved merge commit that preserves both histories, then verify the resulting remote commit.
