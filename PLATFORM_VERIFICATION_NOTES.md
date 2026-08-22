# Platform Verification Notes

## Protected route behavior

The `/app` route renders the intended sign-in gate when no valid session is available. Its sign-in control correctly enters the configured OAuth flow. The browser reached the identity provider’s login screen, which currently requires user-controlled authentication and human verification. The protected dashboard and ingestion workbench therefore require one authenticated browser pass after user sign-in; server-side API behavior is covered by the automated router tests in the meantime.

The subsequent browser sign-in attempt was rejected by the external identity provider as a stopped cross-device login. No product code failed and no credentials were requested or stored. Authenticated browser validation remains a deliberate pending release gate; it must be completed from a successful browser session before the platform can be called production-ready.

The managed preview captured the public landing page, `/app`, and `/app/ingestion` successfully. The public Field Operations Ledger presentation retained its full visual hierarchy, while the protected-route preview rendered the readiness control and data-intake workbench with an available preview identity. Direct browser OAuth remains pending, so the preview rendering is evidence of route/UI composition rather than proof of a user-controlled external authentication completion.
