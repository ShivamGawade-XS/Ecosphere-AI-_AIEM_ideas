# Vercel Deployment Guide

EcoSphere AI can be deployed to Vercel as a **Node.js serverless Express application**. The repository now exposes the same Express application through `api/index.ts`, and `vercel.json` rewrites browser, tRPC, OAuth, health, asset, and scheduled-monitoring requests to that function. Vercel supports exporting an Express app as the default handler in an ES module. [1]

> **Operating boundary:** Vercel functions are request-driven. They are suitable for API handling and externally triggered monitoring cycles, but they do not turn the browser or a serverless instance into a permanent worker. This deployment retains EcoSphere’s browser-independent monitoring model: a scheduled request starts one bounded cycle, persists its result, and exits.

## Repository Configuration

| File | Purpose |
|---|---|
| `api/index.ts` | Exports the reusable Express application as the Vercel Node.js Function and declares a 60-second maximum duration. |
| `server/_core/app.ts` | Builds routes, security headers, OAuth, storage, tRPC, health/readiness, and scheduled-monitoring authorization without binding a TCP port. |
| `vercel.json` | Uses frozen pnpm installs, runs `pnpm build`, includes `dist/public/**` in the function bundle, and rewrites all requests to `/api`. |
| `server/_core/vercelCron.ts` | Validates the optional Vercel Cron bearer secret and an explicit single-tenant organization identifier. |

The default `vercel.json` contains **no `crons` array**, so simply importing the repository cannot activate recurring monitoring.

## Create the Vercel Project

In Vercel, import the GitHub repository:

```text
ShivamGawade-XS/Ecosphere-AI-_AIEM_ideas
```

Select **`main`** as the production branch. Vercel should use the repository configuration. Do not override the install command with a non-frozen dependency install.

| Project setting | Required value |
|---|---|
| Framework preset | Other / auto-detect. |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `dist/public`, matching the committed `vercel.json` and the verified static client artifact. |
| Node.js version | 22.x, matching the validated local and GitHub Actions environment. |

## Environment Variables

Configure secrets through **Vercel Project Settings → Environment Variables** for the appropriate preview and production environments. Do not commit values, echo values in logs, or place values in `vercel.json`.

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Database-backed product operations | Use a TLS-enabled, externally reachable MySQL/TiDB connection. |
| `JWT_SECRET` | Session signing | Generate a high-entropy production secret. |
| `VITE_APP_ID` | OAuth client identity | Public client identifier; must match the deployed callback settings. |
| `OAUTH_SERVER_URL` | OAuth token/session flow | Must permit the Vercel production origin and callback URL. |
| `OWNER_OPEN_ID` | Owner bootstrap and role governance | Set to the designated operator identity. |
| `BUILT_IN_FORGE_API_URL` | Platform services | Required only when the chosen OAuth/storage/service adapter supports it outside Manus. |
| `BUILT_IN_FORGE_API_KEY` | Platform services | Server-only secret; do not expose with a `VITE_` prefix. |
| `CRON_SECRET` | Optional Vercel Cron | Create only when preparing an explicit controlled scheduler trial. |
| `VERCEL_CRON_ORGANIZATION_ID` | Optional Vercel Cron | Positive numeric ID of **one** tenant organization. Required together with `CRON_SECRET`. |

The web client also requires the Vite variables provided by the existing OAuth/analytics integration. Reconcile each current managed-platform value with a Vercel-compatible provider before promotion; do not assume a Manus-managed OAuth or storage token will function on a third-party host.

## OAuth and Storage Readiness

Before deploying production traffic, register the final Vercel origin and callback route with the OAuth provider:

```text
https://<your-production-domain>/api/oauth/callback
```

Then verify login, logout, owner/manager/operator role boundaries, tenant isolation, and attachment retrieval. If managed object storage or OAuth depends on a Manus-only platform credential, connect an equivalent Vercel-compatible service before enabling those workflows.

## Health and Readiness Verification

After Vercel reports a successful production deployment, verify:

```bash
export APP_URL="https://<your-vercel-domain>"
curl --fail --silent --show-error "$APP_URL/healthz"
curl --fail --silent --show-error "$APP_URL/readyz"
```

Both endpoints should return `200` and an `x-request-id`. Readiness must show a configured database. It is expected to report an inactive scheduler until the controlled Cron gate below is completed.

## Controlled Vercel Cron Trial

Vercel Cron can call a configured path and sends `Authorization: Bearer <CRON_SECRET>` when the secret is set. [2] EcoSphere accepts that path only when **both** `CRON_SECRET` and `VERCEL_CRON_ORGANIZATION_ID` are configured. Partial configuration returns a safe `503` misconfiguration state; invalid secrets return `403` without revealing the secret.

1. Publish and validate health, readiness, OAuth, database access, and tenant role boundaries.
2. Pick one non-production or explicitly approved pilot organization, obtain its numeric tenant ID, and set `VERCEL_CRON_ORGANIZATION_ID`.
3. Set a new `CRON_SECRET` in Vercel; do not reuse a session or database secret.
4. Add the following **only for the controlled trial branch or after explicit operations approval** to `vercel.json`:

   ```json
   {
     "crons": [
       {
         "path": "/api/scheduled/monitoring",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```

5. Deploy that configuration and inspect Vercel function logs plus the tenant’s persisted monitoring-run, recovery, score, alert, and recommendation evidence.
6. Disable/remove the cron configuration immediately if the result is not accepted. Enable recurrence only after a named owner records the successful trial.

The current Vercel Cron mode is deliberately scoped to **one configured tenant**. Multi-tenant production scheduling needs a reviewed dispatch service or one explicitly configured task per tenant; do not silently broaden a single Cron call to every tenant.

## Vercel Platform Constraints

| Constraint | EcoSphere response |
|---|---|
| Function duration is bounded. | `api/index.ts` requests 60 seconds; keep one monitoring cycle bounded and move large fan-out work to a queue/worker service. |
| Instances are ephemeral. | Persist run keys, health, recovery, alerts, actions, and reports in the database; do not depend on process memory. |
| Cron is static configuration. | Cron is disabled by default and requires a reviewed deployment change plus secret/tenant configuration. |
| Serverless files are read-only at runtime. | The function serves the bundled client assets and uses managed object storage for action evidence. |
| Managed service credentials may be host-specific. | Verify OAuth, storage, and platform-service alternatives before claiming full production parity. |

## Required Evidence Before Production Claims

Keep the Vercel deployment URL, Git commit, deployment ID, `/healthz` and `/readyz` responses, OAuth verification, database migration/backup reference, one controlled monitoring run, Cron evidence if used, and a restore rehearsal in the release record. Complete deployed keyboard/screen-reader and representative-network performance checks before making conformance or performance claims.

## References

[1] [Vercel — Express on Vercel](https://vercel.com/docs/frameworks/backend/express)

[2] [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

[3] [Vercel — Project Configuration (`vercel.json`)](https://vercel.com/docs/project-configuration/vercel-json)
