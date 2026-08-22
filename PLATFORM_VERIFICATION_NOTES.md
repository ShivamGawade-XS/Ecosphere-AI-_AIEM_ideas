# Platform Verification Notes

## Protected route behavior

The `/app` route renders the intended sign-in gate when no valid session is available. Its sign-in control correctly enters the configured OAuth flow. The browser reached the identity provider’s login screen, which currently requires user-controlled authentication and human verification. The protected dashboard and ingestion workbench therefore require one authenticated browser pass after user sign-in; server-side API behavior is covered by the automated router tests in the meantime.

The subsequent browser sign-in attempt was rejected by the external identity provider as a stopped cross-device login. No product code failed and no credentials were requested or stored. Authenticated browser validation remains a deliberate pending release gate; it must be completed from a successful browser session before the platform can be called production-ready.

The managed preview captured the public landing page, `/app`, and `/app/ingestion` successfully. The public Field Operations Ledger presentation retained its full visual hierarchy, while the protected-route preview rendered the readiness control and data-intake workbench with an available preview identity. Direct browser OAuth remains pending, so the preview rendering is evidence of route/UI composition rather than proof of a user-controlled external authentication completion.

The post-expansion mobile review passed for the public narrative and `/app/scenarios`. The public report adapts without horizontal overflow, and the no-tenant Scenario workspace presents a purposeful Field Operations Ledger state with an explicit next step rather than an ambiguous blank page. The user-controlled authenticated flow remains the only outstanding end-to-end browser gate.

All eight authenticated ecosystem routes were reviewed at 375×812: Overview, Registry, Live Data, Intelligence, Scenarios, Actions, Reports, and Readiness. Each route rendered without horizontal overflow. The zero-data tenant state is intentional and informative: Registry exposes organization/site/meter setup, Live Data exposes the protected ingestion sequence, and all downstream workspaces describe their evidence dependency rather than fabricating sustainability activity. Readiness remains available as the implementation inventory.

At 05:00 on 22 August 2026, the active browser reached `https://3000-i8aycog54bs8cylwu7lz2-c5c7eed1.us4.manus.computer/app/registry` but displayed the sign-in gate. The browser session therefore remains unauthenticated; a user-controlled OAuth completion is required before recording a true Registry → Live Data → Overview/Reports persistence journey.

The final OAuth gate was subsequently completed in the active browser. Under the authenticated AIEM Campus Pilot tenant, the verification created **AIEM Main Campus** (`AIEM-MAIN`), registered the **HVAC Electricity** meter with the canonical `energy · kWh` contract, and submitted a manual **112.5 kWh** reading. The Live Data workbench confirmed “Reading accepted and recorded with provenance” and listed ingestion batch **#1**, status `completed`, with `1 accepted` reading at 05:17 on 22 August 2026.

The authenticated Overview then showed the same connected record state: **1 registered meter**, **1 validated reading**, the current reading **HVAC Electricity · 112.5000 kWh**, and a staged monitoring status. This proves tenant-scoped persistence from Registry and Live Data into the operational summary.

The authenticated Actions workspace also created the intervention **Review HVAC operating schedule**, linked to the verified `112.5 kWh` source context with a `12.5 kgCO₂e` expected impact. The workspace confirmed the audit-backed creation and then successfully moved the action from `proposed` to `in progress` with an explicit status-update message.

The authenticated Scenario workspace calculated the `HVAC reduction option` with the explicit `pilot-v1` deterministic factor set. It returned a baseline of **6,672 kgCO₂e**, projected **5,786 kgCO₂e**, and a modeled **886 kgCO₂e** reduction, then saved that output, all input assumptions, and its calculation version into tenant decision history at 05:19 on 22 August 2026.

After the action transition, the Overview reflected **1 active action** alongside the registered meter and validated reading. Reports then independently summarized the same tenant scope as **1 site**, **1 meter**, **1 reading**, **1 action**, and ingestion batch **#1** with `1/1 accepted`. This completes the authenticated Registry → Live Data → Overview → Reports persistence verification.

The default root route was updated and verified to open the authenticated **Operations Overview** with all eight workspace links and live tenant evidence. The former landing experience is preserved at `/narrative`; both its header and hero expose explicit **Open workspace / Open mission control** links back to the complete product ecosystem.

Automated entry-route coverage now verifies the same separation: `/` renders the protected Operations Overview inside the operations shell, while `/narrative` renders the standalone public Field Operations Ledger narrative. The final validation run completed with **7 test files and 25 tests passing**, clean TypeScript, and a successful production build.

## Monitoring foundation verification

At 06:11 on 22 August 2026, the authenticated AIEM Campus Pilot Overview rendered the persisted monitoring evidence from the browser-independent worker: **EcoScore 100**, latest run `completed`, and **0 open alerts**. The root workspace correctly directed the operator to Intelligence rather than claiming a staged worker.

The authenticated Intelligence workspace rendered the actual operational contract: **pilot-carbon-v1 EcoScore**, **92.3 kgCO₂e** of pilot energy carbon, current quality count, alert lifecycle, anomaly evidence state, and a role-protected **Run monitoring now** control. It explicitly states that its control calls the same browser-independent worker used by the scheduler callback, and it keeps forecasting and AI-written recommendations labeled as planned. This confirms the interface is backed by persisted pilot evidence, but does not yet substitute for the planned simulated-spike end-to-end anomaly scenario recorded below.

For the controlled verification sequence, the authenticated Live Data workspace selected the existing **HVAC Electricity · kWh** meter. The next intake values are simulated test evidence only and are not campus-source measurements.

The Live Data interface was updated and reviewed in the authenticated browser to expose a **Simulated pilot test — explicitly labeled** source selector beside the target meter and reading value. Its in-product copy states that these readings must not be treated as campus-source data; the selected source persists `simulated` provenance for the verification fixture.

The controlled browser fixture selected **HVAC Electricity · kWh** as its target and selected the explicit **simulated** source before any verification intake was submitted.

At 06:15 on 22 August 2026, the browser submitted the first **100 kWh** controlled baseline reading. The product confirmed “Simulated pilot reading accepted and visibly labeled in provenance,” and the ingestion audit listed batch **#30001**, source **SIMULATED**, status `completed`, and `1 accepted`. This record is a test fixture, not a campus reading.

The second controlled **101 kWh** simulated baseline was submitted through the same authenticated form; its asynchronous audit refresh is verified separately before it is used as anomaly evidence.

The subsequent audit refresh did not yet display a second simulated batch, despite retaining the success notice. The browser console contained no client error. Treat the second baseline as unverified until the server-side ingestion outcome is independently confirmed; do not include it in final anomaly evidence until resolved.

The controlled form-state diagnostic confirmed target meter `1`, source `simulated`, and an enabled **Ingest reading** button. The missing mutation is therefore not explained by an absent selection or a disabled UI control; it remains an active verification discrepancy.

Browser replay identified that the preview overlay intercepted earlier low-viewport clicks; scrolling the form moves the ingest control into an interactive position. Subsequent verification clicks must use the current visible button index after scrolling rather than a stale element index.

At 06:18 on 22 August 2026, the corrected visible ingest click submitted the second **101 kWh** simulated baseline. The audit listed batch **#60001**, source **SIMULATED**, status `completed`, and `1 accepted`. The fixture now contains the original manual reading plus two explicitly simulated baseline readings; one additional baseline and a high simulated spike will be added before the worker run.

At 06:18:32 on 22 August 2026, the final **99 kWh** simulated baseline was accepted as batch **#60002**. The tenant now has four prior HVAC readings available for the rolling baseline: the original 112.5 kWh manually entered pilot fixture and the explicitly simulated 100, 101, and 99 kWh test values. The next value is a deliberately simulated high spike.

At 06:18:56 on 22 August 2026, the controlled **250 kWh** high spike was accepted as simulated batch **#60003**. This is explicitly simulated verification evidence and must not be presented as an AIEM Campus source measurement. The browser ingestion sequence now contains three simulated baselines plus a clearly labeled simulated spike, ready for deterministic worker validation.

At 06:19 on 22 August 2026, the authenticated Intelligence workspace initiated its role-protected manual monitoring run. The UI showed **Running deterministic checks…**, confirming the request entered the same server-owned worker path used by the scheduled callback.

The completed run evaluated **4 newly unprocessed readings**, created **1 critical anomaly event**, and created **1 alert**. It persisted EcoScore **65**, pilot energy carbon **543.3 kgCO₂e**, and a critical HVAC evidence record showing **250.0000** observed against a **103.1250** rolling baseline with z-score **23.30**. These outputs derive solely from the controlled simulated fixture and the documented deterministic rules.

The authorized user then acknowledged the critical alert in the same workspace. The alert and anomaly both displayed `acknowledged`, and the open-alert metric changed from **1** to **0**. A client-cache follow-up fix invalidates all status/readiness evidence after acknowledgement so the pipeline summary cannot retain a stale open-alert count.

After a full browser reload, Intelligence still displayed EcoScore **65**, **0** open alerts, the acknowledged critical alert, and the z-score **23.30** anomaly evidence. The refreshed pipeline correctly reported “Latest run: completed; 0 open alerts,” confirming that persisted records—not browser state—drive the reviewed monitoring result.

## R1 trusted data plane and R2 operations controls

The authenticated **Live Data** workspace was reviewed at desktop width after the R1 update. It exposes source registration, explicitly labeled simulated intake, CSV preview/quarantine/commit controls, factor governance, and correction lineage. The UI does not present simulated values as campus telemetry and retains a clear distinction between valid, quarantined, active, and superseded evidence.

The authenticated **Intelligence** workspace was reviewed at desktop width after the R2 update. It surfaces persisted EcoScore, alert/anomaly evidence, manual one-shot worker control, disabled-by-default scheduled-worker health, recovery queue, and opt-in owner-notification routing. The page explicitly states that saving a health target does not create an external platform schedule and that owner-delivery outcomes are recorded rather than assumed.

The same Intelligence review verified the **In-app escalation** surface. Its policy is disabled by default; when a manager enables it, the bounded evaluator can create a persisted pending, triggered, suppressed, or resolved escalation record and, after the configured threshold, create an accountable sustainability action. The UI explicitly excludes email, SMS, Slack, campus escalation, and guaranteed external response from this feature.

## R3 decision-support desktop review

The authenticated **Intelligence** workspace now presents short-horizon forecast generation and evidence-linked recommendation controls beneath the persisted monitoring evidence. Its copy correctly states that no LLM is used to invent numerical values. The desktop view retained the established Field Operations Ledger hierarchy and showed the new controls without overflow.

The authenticated **Actions** workspace retained the existing accountable action lanes and exposes an **Open evidence** entry point for tenant-scoped notes and completion-evidence references. The authenticated **Scenarios** workspace continues to frame calculations as pilot deterministic outputs; its saved-scenario comparison controls are intentionally below the initial desktop viewport and become useful only after two saved scenarios exist. The authenticated **Reports** workspace visibly distinguishes its current tenant-scoped overview CSV from its server-persisted evidence snapshot and factor-disclosure workflow. None of these R3 surfaces constitutes certified reporting, live telemetry, or guaranteed savings.

The subsequent authenticated desktop review of **Actions** confirmed that the action creation form now exposes a **No saved scenario link** selector alongside site, priority, expected impact, and the existing accountable work lanes. This establishes an explicit user-selected scenario-to-action reference without claiming that modeled impacts have been realized.
