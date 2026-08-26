# EcoSphere AI — Where to Get the Vercel Production Variables

**Current observed state:** the Vercel project has **no environment variables**, `/healthz` is reachable, and `/readyz` truthfully returns `503` because the database and authentication dependencies are unavailable. This guide explains what each required value is, where it comes from, and how to enter it safely.

> **Never paste secrets into chat, GitHub, source code, `vercel.json`, browser URLs, screenshots, or public notes. Enter them only in Vercel’s Environment Variables form.**

## Before you add anything

You are already on **Vercel → ecosphere-ai-aiem-ideas → Settings → Environment Variables**. For each value, use **Add Environment Variable**, select **Production**, paste the value, and save. Repeat one variable at a time. Do not add the scheduler variables yet.

| Variable | What it does | Where to obtain it | What to enter in Vercel |
|---|---|---|---|
| `DATABASE_URL` | Connects EcoSphere to its production MySQL/TiDB database. | Create or use an externally reachable MySQL-compatible database. Obtain its **TLS-enabled connection string** from the database provider dashboard. | The full connection string, for example the provider’s supplied `mysql://user:password@host:port/database?ssl=...` format. Use the provider’s exact string; do not invent parameters. |
| `JWT_SECRET` | Signs EcoSphere’s server-side session cookies. | Generate a new production-only secret locally or in a trusted password manager. | Generate with `openssl rand -base64 48`, then paste the one-line result. Never reuse a database password, OAuth secret, or cron secret. |
| `VITE_APP_ID` | Identifies the browser-side OAuth application. | The OAuth provider’s application/client registration page. For Manus OAuth, this is the application identifier issued when the OAuth app is registered. | The provider-issued application/client ID. This is an identifier, but treat it as configuration—not application copy. |
| `VITE_OAUTH_PORTAL_URL` | Tells the browser where to start sign-in. | The OAuth provider documentation or application settings. For a Manus-backed configuration, use the provider portal base URL associated with the registered application. | The complete portal base URL, including `https://`; do not append the EcoSphere callback path here unless the provider explicitly specifies it. |
| `OAUTH_SERVER_URL` | Lets EcoSphere’s server exchange the callback authorization code for a session. | The OAuth provider’s token/session service documentation or app settings. | The complete server base URL, including `https://`, supplied by that provider. |
| `OWNER_OPEN_ID` | Identifies the first EcoSphere tenant owner. | Sign in to the selected OAuth provider with the intended owner account and obtain its stable `openId` from the provider’s identity/profile/API view. | The exact stable provider `openId`, not a display name, email address, or Vercel username. |

## Database: practical options

EcoSphere requires a **MySQL-compatible** production database because its schema and migrations use MySQL/TiDB. Choose one provider or existing institutional database that permits secure remote connections from Vercel and supports TLS. Before adding `DATABASE_URL`, ensure that the target database is intended for this pilot and that the full reviewed migration history is applied.

| Requirement | Confirm before using the connection string |
|---|---|
| Engine compatibility | MySQL or TiDB, not PostgreSQL or SQLite. |
| Network path | The provider allows Vercel serverless connections and enforces TLS where available. |
| Database identity | The database name is specifically for EcoSphere’s approved production/pilot use. |
| Credentials | Use a least-privilege application user, not a personal administrator account. |
| Migrations | Apply the reviewed EcoSphere migration files in order; do not run indiscriminate schema push commands against production. |

## OAuth callback you must register

In the OAuth provider’s application settings, register this **exact** production callback URL:

```text
https://ecosphere-ai-aiem-ideas.vercel.app/api/oauth/callback
```

Also allow the production origin:

```text
https://ecosphere-ai-aiem-ideas.vercel.app
```

EcoSphere uses a browser nonce to bind the initiated sign-in flow to the callback. A wrong callback URL, client ID, portal URL, server URL, or owner `openId` prevents a usable authenticated tenant session.

## Do **not** add these yet

| Variable | Why it must remain unset now |
|---|---|
| `CRON_SECRET` | A scheduler trial must be explicitly approved only after database, readiness, OAuth, and tenant checks pass. |
| `VERCEL_CRON_ORGANIZATION_ID` | Scheduler execution must be constrained to one approved pilot tenant after its positive numeric ID is known. |
| `BUILT_IN_FORGE_API_KEY` | Add only if a Vercel-compatible service adapter specifically requires it; never expose it as `VITE_*`. |
| `BUILT_IN_FORGE_API_URL` | Add only with the corresponding compatible adapter configuration. |

## After the six required values are saved

1. Open **Vercel → Deployments** and redeploy the production branch. Environment changes do not modify a completed serverless deployment retroactively.
2. Wait until Vercel reports the deployment as **Ready**.
3. I will then recheck `/healthz` and `/readyz`. The required readiness target is HTTP `200` with `database: configured`; the scheduler may still correctly remain `not_activated_in_this_environment`.
4. In a normal browser session, sign in with the account matching `OWNER_OPEN_ID` and verify the tenant-scoped Operations Overview, Registry, Live Data, and role boundaries.

> **Do not create a new production tenant merely to test this flow unless the pilot data is approved.** The existing Guided Campus Simulation is explicitly simulated and must never be presented as live AIEM telemetry.

## If you do not yet have a database or OAuth provider

Stop at this point rather than entering placeholders. Tell me which of the two is missing—**database** or **OAuth provider**—and I will give you a provider-specific setup checklist. The production readiness endpoint is intentionally failing rather than pretending the application is operational.

## References

[1] [EcoSphere AI Vercel Operator Runbook](./VERCEL_OPERATOR_RUNBOOK.md)

[2] [Vercel, “Environment Variables”](https://vercel.com/docs/environment-variables)

[3] [Vercel, “Node.js Version Configuration”](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
