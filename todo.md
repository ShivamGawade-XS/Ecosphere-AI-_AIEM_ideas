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
- [x] Complete a successful remote CI quality workflow run against the merged GitHub main branch.
- [ ] Complete a deployed restore rehearsal and deployed accessibility/performance measurement after publication.

## GitHub Synchronization

- [x] Inspect the provided EcoSphere-specific GitHub repository and confirm its default branch and existing contents.
- [x] Push the current verified EcoSphere AI source and project configuration to the confirmed GitHub destination without modifying unrelated repositories.
- [x] Verify the remote commit, branch, and working-tree contents after push, then record the exact repository URL and commit.

## Repository Documentation, Audit, and Merge

- [x] Create a comprehensive root README covering architecture, local setup, data model, operations, security boundaries, and the AIEM demonstration flow.
- [x] Create a deployment guide covering managed publication, migrations, secrets, health verification, scheduler activation, rollback, and claim-safe external prerequisites.
- [x] Run dependency and source-level security audits and record actionable findings with verified remediation status.
- [x] Merge the verified EcoSphere synchronization branch into the GitHub repository main branch through a conflict-resolved merge commit that preserves both histories, then verify the resulting remote commit.

## Vercel Deployment Preparation

- [x] Assess the Vercel runtime model against the current Express, OAuth, database, storage, and scheduler contracts.
- [x] Add Vercel configuration and a Vercel-specific deployment section with required environment-variable names and safe operational limits.
- [x] Validate a Vercel-compatible production build and document any platform constraints or required external services.
- [ ] After user deployment, verify deployed health/readiness, OAuth, tenant protection, and one controlled scheduler trial before considering recurrence.
- [x] Create the user-authorized Git-linked Vercel project and deploy the verified GitHub main branch without enabling recurring Cron jobs.
- [x] Record deployed URL, deployment evidence, and any environment-variable or external identity-provider gates discovered during verification.
- [x] Fix and redeploy the Vercel serverless function after verifying the public health endpoint’s module-resolution failure.
- [x] Align the Vercel deployment guide with the verified static output-directory configuration.
- [x] Create a step-by-step Vercel operator runbook covering environment configuration, OAuth callback registration, redeployment, health/readiness interpretation, verification, and the explicitly gated scheduler trial.
- [x] Verify the latest GitHub CI and Vercel deployment state after the documentation synchronization, then record any credential-independent findings.
- [x] Pin the Vercel runtime to the locally and CI-validated Node.js 22 major release, then verify the deployment contract.

## Enterprise Audit and IoT Expansion

- [x] Perform an adversarial repository, deployment, security, reliability, accessibility, and operational-readiness audit with a transparent scorecard.
- [ ] Remediate all practical high- and medium-severity application-level security and reliability findings, with regression tests and verification evidence.
- [x] Produce a secure IoT integration design covering device identity, gateway or webhook ingestion, validation, tenant mapping, replay protection, observability, and an AIEM Campus pilot path.
- [x] Re-score the platform after remediation, clearly separating verified improvements from external/operator-dependent gaps.
- [x] Replace the public key-based managed-storage proxy with an authenticated tenant-scoped access boundary while retaining only explicit public brand assets.
- [x] Repair and regression-test the clean local production-start contract.
- [x] Fail closed on missing or weak production session configuration, bind session claims to the active application, and surface authentication readiness safely.
- [x] Reduce global request parsing exposure and add explicit request-origin and rate-limit protections for unsafe application traffic.
- [x] Add additive IoT device and telemetry-replay persistence records with tenant, site, meter, credential-version, lifecycle, and audit boundaries.
- [x] Implement a signed device-key telemetry ingress that validates device state, tenant meter mapping, payload size, timestamp skew, unit, sequence/idempotency, and controlled rate before persisting readings.
- [x] Add protected IoT device registration and lifecycle controls plus deterministic API and domain regression tests.
- [x] Tighten production CSP script and form directives without disrupting the current application shell, and add regression coverage.
- [x] Add dependency-update automation configuration and repository security reporting guidance without changing external branch-protection policy automatically.
- [x] Add a server-side session-version revocation control for authenticated users, with safe legacy migration behavior and regression tests.
- [x] Align the session-secret strength threshold with the secure built-in runtime secret format while retaining a fail-closed readiness check.
- [x] Require an explicit organization identifier in IoT telemetry requests so a device key is always resolved inside one tenant namespace.
- [x] Add owner-governed IoT device-secret rotation with credential-version audit evidence and one-time secret return semantics.
- [x] Add an authenticated, owner-governed IoT device-management panel that exposes device inventory, registration, lifecycle, and one-time credential rotation feedback without revealing persisted secrets.
- [x] Remove the unaudited external analytics script and restrict production CSP script/connect sources to first-party application endpoints, with regression validation.
- [x] Document the application threat model, data classification/retention boundaries, residual risks, and evidence-based security review cadence for the pilot release.
- [x] Move pnpm patch and override configuration from ignored package metadata into the supported workspace configuration, then verify deterministic installation and quality checks.
- [x] Remove the unsupported development-only Vite JSX-location plugin and its peer-version warning without changing production application behavior.
- [x] Perform a fresh credential-independent review of authentication, authorization, input handling, worker safety, observability, dependency hygiene, performance, and accessibility; record prioritized findings and acceptance evidence.
- [x] Constrain dynamic chart style keys, identifiers, and CSS values so the reusable chart primitive cannot generate arbitrary stylesheet content if reused with untrusted inputs.
- [x] Bound in-process rate-limit bucket growth and rate-limit the scheduler callback route so credential-independent request floods cannot consume unbounded local memory or repeated authentication work.
- [x] Enforce the documented twelve-hour session maximum inside the signing primitive so future server-side callers cannot accidentally mint longer-lived application sessions.
- [x] Validate storage object-key paths centrally and prevent upstream presign response bodies from being surfaced through application errors.
- [x] Tighten the production CSP with explicit object, worker, manifest, and script-attribute restrictions after confirming the current client origin inventory.
- [x] Remove the restrictive mobile viewport scale cap so users can zoom content for accessibility without affecting responsive layout behavior.
- [x] Produce a fresh adversarial audit of product functionality, intelligence quality, workflows, security, reliability, accessibility, performance, and test coverage; document the transparent baseline score and evidence.
- [x] Fix OAuth state-cookie lifecycle consistency and replace brittle string-based automatic login redirects with structured unauthorized handling.
- [x] Build a deterministic, clearly labeled Live Demo Simulation control flow with campus setup, recurring test-cycle ingestion, controlled HVAC-spike injection, pipeline refresh, and reset safeguards.
- [x] Add an executive SDG-impact evidence view and connect server-calculated scenario and action impacts to SDG 7, 9, 11, 12, and 13 disclosures.
- [x] Remove monitoring-worker quadratic per-meter history copying and cap deterministic analytics history without changing anomaly semantics.
- [x] Improve product entry, mutation announcements, and missing-asset fallback behavior for a resilient judge-facing demonstration flow.
- [x] Add tenant/site sustainability targets with deterministic energy, water, waste, carbon, and EcoScore attainment status plus explicit data-freshness evidence in the executive overview.
- [x] Harden OAuth state serialization and cookie clearing with a base64url-safe, UTF-8-aware contract and matched secure lifecycle options.
- [x] Normalize target date-window inputs to explicit UTC boundaries so assessment windows do not shift with browser/server timezone or daylight-saving changes.
- [x] Eliminate repeated unauthenticated/localStorage profile writes from the auth hook while preserving intentional authenticated preview compatibility.
- [x] Replace implicit database connection-string initialization with an explicit pooled MySQL/TiDB client and preserve existing readiness behavior through regression verification.
- [x] Enrich tenant-scoped executive evidence snapshots with bounded target assessments, scenario outputs, and explicit simulated-demo provenance.
- [x] Make intervention-ranking policy and recommendation confidence evidence explicit in the scenario and intelligence workflows, and add reusable disclosed intervention templates without inventing campus results.
- [x] Present generated tenant-scoped evidence snapshots in a concise executive report view with explicit modeled, simulated, and non-certification disclosures.
- [x] Restrict simulated readings to guided-demo provenance so generic ingestion cannot contaminate resettable demonstration evidence.
- [x] Clarify scenario preview scope and ensure the site selector cannot imply a calculation dimension the server does not apply.
- [x] Make report overview exports and print views snapshot-bound and persistently disclose tenant scope, factor, modeled, and simulated limitations.
- [x] Verify unauthenticated redirect-path behavior cannot strand users in a protected redirect loop.
- [x] Bound local MySQL/TiDB connection-pool queueing so a busy process cannot retain unlimited pending database work.
- [x] Add a tenant-scoped evidence timeline that links persisted monitoring events, recommendations, and accountable actions without fabricating missing lineage.
- [x] Add transparent deterministic forecast-model comparison and backtest-based selection without claiming predictive accuracy.
