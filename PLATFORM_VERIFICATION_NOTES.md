# Platform Verification Notes

## Protected route behavior

The `/app` route renders the intended sign-in gate when no valid session is available. Its sign-in control correctly enters the configured OAuth flow. The browser reached the identity provider’s login screen, which currently requires user-controlled authentication and human verification. The protected dashboard and ingestion workbench therefore require one authenticated browser pass after user sign-in; server-side API behavior is covered by the automated router tests in the meantime.

The subsequent browser sign-in attempt was rejected by the external identity provider as a stopped cross-device login. No product code failed and no credentials were requested or stored. Authenticated browser validation remains a deliberate pending release gate; it must be completed from a successful browser session before the platform can be called production-ready.

The managed preview captured the public landing page, `/app`, and `/app/ingestion` successfully. The public Field Operations Ledger presentation retained its full visual hierarchy, while the protected-route preview rendered the readiness control and data-intake workbench with an available preview identity. Direct browser OAuth remains pending, so the preview rendering is evidence of route/UI composition rather than proof of a user-controlled external authentication completion.

The post-expansion mobile review passed for the public narrative and `/app/scenarios`. The public report adapts without horizontal overflow, and the no-tenant Scenario workspace presents a purposeful Field Operations Ledger state with an explicit next step rather than an ambiguous blank page. The user-controlled authenticated flow remains the only outstanding end-to-end browser gate.

All eight authenticated ecosystem routes were reviewed at 375×812: Overview, Registry, Live Data, Intelligence, Scenarios, Actions, Reports, and Readiness. Each route rendered without horizontal overflow. The zero-data tenant state is intentional and informative: Registry exposes organization/site/meter setup, Live Data exposes the protected ingestion sequence, and all downstream workspaces describe their evidence dependency rather than fabricating sustainability activity. Readiness remains available as the implementation inventory.

At 05:00 on 22 August 2026, the active browser reached `https://3000-i8aycog54bs8cylwu7lz2-c5c7eed1.us4.manus.computer/app/registry` but displayed the sign-in gate. The browser session therefore remains unauthenticated; a user-controlled OAuth completion is required before recording a true Registry → Live Data → Overview/Reports persistence journey.
