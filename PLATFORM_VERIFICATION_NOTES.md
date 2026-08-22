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
