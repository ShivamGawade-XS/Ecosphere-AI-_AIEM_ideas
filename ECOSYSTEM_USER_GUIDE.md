# EcoSphere AI Ecosystem Guide

EcoSphere AI is a **multi-page sustainability operations prototype**, not a single landing page. The screen visible at `/` while signed out is intentionally an access gate: operational pages hold tenant-scoped readings, controlled simulation state, actions, and reports, so they require an authenticated workspace session. The public workspace directory at [`/explore`](/explore) now makes all pages discoverable before sign-in.

> **Access boundary:** Public pages explain the product. Authenticated pages operate on tenant-scoped records. The public directory never exposes readings, scores, alerts, or simulated campus state.

## Page Map

| Route | Page | Main purpose | Key interactive capabilities | Access |
|---|---|---|---|---|
| `/` | Workspace access | Starts the authenticated mission-control journey | Sign in, open the directory, or read the public narrative | Public entry; sign-in required for workspace data |
| `/explore` | Workspace Directory | Explains the whole ecosystem before sign-in | Filter pages by purpose; select a workspace; review its scope; open the protected handoff | Public |
| `/narrative` | Field Operations Ledger | Public product and AIEM pilot story | Explore the monitor-to-measure loop; select an intervention idea; hand off to protected scenarios | Public |
| `/app` | Operations Overview | Authenticated mission-control hub | Start/advance/reset the controlled demo; inject HVAC spike; inspect EcoScore, targets, freshness, maintenance windows, and next steps | Authenticated tenant member |
| `/app/registry` | Registry | Establishes trustworthy tenant setup | Create sites and meters; view inventory; manage roles; register and govern IoT devices | Authenticated; mutations depend on role |
| `/app/data` | Live Data | Records and governs sustainability evidence | Ingest manual readings; preview and commit CSV; inspect quarantine/lineage; correct readings; manage factors | Authenticated; mutations depend on role |
| `/app/intelligence` | Intelligence | Explains monitored sustainability signals | Run a bounded monitoring cycle; review quality findings, anomalies, alerts, forecasts, recommendations, escalation and recovery evidence | Authenticated; selected controls depend on role |
| `/app/scenarios` | Scenarios | Tests interventions using server-owned calculations | Create/save what-if scenarios; apply accepted-reading baselines; compare interventions; inspect methodology and sensitivity | Authenticated |
| `/app/actions` | Actions | Turns signals into accountable work | Create actions; capture evidence and deadlines; assign tenant members; record approval; compare post-action evidence | Authenticated; governed controls depend on role |
| `/app/reports` | Reports | Produces evidence-bound executive views | Select stored snapshots; inspect traceability; export CSV/JSON; print reports; read methodology appendix | Authenticated |
| `/app/presenter` | Presenter Mode | Provides a concise AIEM judge flow | Follow six ordered handoffs from tenant setup to evidence-bound report | Authenticated |
| `/app/readiness` | Readiness | Shows implementation and verification status | Filter implementation inventory and inspect evidence for product capabilities | Authenticated |
| `/app/administration` | Administration | Governs service readiness and scheduler trial planning | Inspect liveness/readiness; review deployment prerequisites; manage the deploy-gated scheduler trial | Authenticated; owner controls are role-gated |

## What the Product Can Demonstrate Locally

The core loop is **Monitor → Detect → Predict → Simulate → Recommend → Act → Measure → Repeat**. In the authenticated AIEM Campus flow, an owner or manager can start an explicitly simulated fixture, advance normal readings, inject an HVAC spike, and then follow the persisted anomaly, alert, recommendation, scenario, action, and report evidence across the workspace pages.

| Capability | What it does | Important boundary |
|---|---|---|
| EcoScore | Persists a 0–100 pilot score with inspectable components | Not a certified ESG rating |
| Monitoring | Runs deterministic validation, anomaly, forecast, score, and recommendation stages on the server | Recurring production scheduling remains deployment-gated |
| CSV and manual intake | Preserves source, unit, idempotency, quarantine, correction, and lineage evidence | No configured utility, Odoo, or live hardware connector |
| What-if scenarios | Calculates modeled energy, water, waste, carbon, savings, ROI, payback, and SDG impacts | Model outputs are not realized savings or procurement quotes |
| Portfolio planning | Selects saved scenarios under an explicit modeled budget and objective | Does not establish feasibility, dependencies, funding, or implementation outcomes |
| Accountable actions | Tracks deadlines, assignment, approvals, completion evidence, and post-action windows | Does not automate routing, external notifications, or delivery |
| Reports | Exports stored snapshot evidence with methodology and non-certification disclosure | Not certified reporting or external assurance |

## Recommended First-Time Flow

1. Open [`/explore`](/explore) to see the purpose of each page.
2. Authenticate at `/`, then open **Operations Overview**.
3. If no tenant exists, use **Registry** to create the organization, site, and canonical meter.
4. Use **Live Data** to add a manual reading or import a CSV—or use the controlled demo flow on **Operations Overview**.
5. Review anomalies, forecasts, and recommendations in **Intelligence**.
6. Use **Scenarios** to model an intervention and compare options.
7. Convert a selected intervention into an owned, approved action in **Actions**.
8. Use **Reports** or **Presenter Mode** for an evidence-led AIEM demonstration.

The product is intentionally honest about its current scope: the local experience supports deterministic calculations and server-owned evidence workflows, while deployed OAuth validation, a controlled production scheduler trial, invitation delivery, restore rehearsal, and live hardware/utility integration remain separate external verification work.
