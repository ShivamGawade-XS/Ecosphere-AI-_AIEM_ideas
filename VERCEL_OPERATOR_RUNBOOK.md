# EcoSphere AI — Vercel Operator Runbook

**Purpose.** This runbook completes the remaining Vercel-side configuration and validates EcoSphere AI without enabling an unapproved recurring monitoring schedule. It is written for the operator of the Vercel project and OAuth/database services.

> **Security rule:** Enter secret values only in the Vercel dashboard. Do not paste `DATABASE_URL`, `JWT_SECRET`, OAuth secrets, or Cron secrets into Git, chat, issue trackers, `vercel.json`, browser URLs, or screenshots.

## 1. Current Verified State

| Item | Verified status | Evidence / implication |
|---|---|---|
| Public application URL | Available | [https://ecosphere-ai-aiem-ideas.vercel.app](https://ecosphere-ai-aiem-ideas.vercel.app) serves the EcoSphere application shell with HTTP `200`. |
| Liveness | Passing | `/healthz` returns HTTP `200`, JSON `ok: true`, security headers, and an `x-request-id`. |
| Readiness | Blocked by configuration | `/readyz` currently returns HTTP `503` with `database: unavailable` and `scheduler: not_activated_in_this_environment`. |
| Git integration | Active | Vercel is linked to `ShivamGawade-XS/Ecosphere-AI-_AIEM_ideas`, production branch `main`. |
| Latest verified CI | Passing | The GitHub Quality gate passed for main at [run 32626991291](https://github.com/ShivamGawade-XS/Ecosphere-AI-_AIEM_ideas/actions/runs/32626991291). |
| Recurring Cron | Disabled | No `crons` declaration is committed and no `CRON_SECRET` or tenant Cron identifier should be added yet. |

The deployed service is **reachable but not operationally ready** until its production database and OAuth configuration are connected. This is intentional and safer than reporting a misleading ready state.

## 2. Confirm the Vercel Project Settings

Open **Vercel Dashboard → ecosphere-ai-aiem-ideas → Settings → General**. Confirm that the linked Git repository is `ShivamGawade-XS/Ecosphere-AI-_AIEM_ideas` and the production branch is `main`. The project is configured through the repository; do not replace its commands with platform defaults.

| Setting | Required value | Reason |
|---|---|---|
| Framework | Vite / Other auto-detection | The project uses a Vite client with a Node serverless adapter. |
| Install command | `pnpm install --frozen-lockfile` | Uses the committed dependency graph. |
| Build command | `pnpm build` | Produces `dist/public` and the serverless bundle. |
| Output directory | `dist/public` | Serves the compiled client instead of the server bundle. |
| Node.js | Node.js `22.x` | `package.json` pins the validated major version. The current project metadata previously reported Node `24.x`; the next deployment after the pin is pushed must report Node 22. |

Vercel honors the `engines.node` field in `package.json` over a project setting when a version is declared.[1] Do not override that version with an incompatible value in the dashboard.

## 3. Configure Environment Variables

Open **Vercel Dashboard → ecosphere-ai-aiem-ideas → Settings → Environment Variables**. Add the following values for **Production**. Add the same values for **Preview** only if preview deployments need real authenticated access; otherwise keep preview access limited to non-sensitive smoke testing.

| Variable | Add now? | How to source it | Verification purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | An externally reachable, TLS-enabled MySQL or TiDB connection string for the migrated EcoSphere database. | Makes `/readyz` report `database: configured` and enables persistent tenant data. |
| `JWT_SECRET` | Yes | Generate a new production-only high-entropy value, for example locally with `openssl rand -base64 48`. | Signs session cookies. Never reuse a database or Cron secret. |
| `VITE_APP_ID` | Yes | OAuth client/application identifier registered with the chosen provider. | Lets the browser initiate sign-in. |
| `VITE_OAUTH_PORTAL_URL` | Yes | OAuth-provider portal base URL used for browser sign-in. | Required by the client’s sign-in redirect. |
| `OAUTH_SERVER_URL` | Yes | OAuth token/session service URL that exchanges the callback authorization code. | Required by the server callback flow. |
| `OWNER_OPEN_ID` | Yes | Stable provider `openId` for the initial EcoSphere owner. | Supports owner bootstrap and role governance. |
| `BUILT_IN_FORGE_API_URL` | Conditional | Only add when the selected Vercel-compatible integration supplies the service endpoint. | Needed only for the corresponding platform service adapter. |
| `BUILT_IN_FORGE_API_KEY` | Conditional | Only add alongside a Vercel-compatible service adapter. | Server-only credential; never expose it as a `VITE_*` variable. |
| `CRON_SECRET` | No | Leave unset until an explicitly approved trial. | Prevents accidental scheduler activation. |
| `VERCEL_CRON_ORGANIZATION_ID` | No | Leave unset until an explicitly approved trial for one pilot tenant. | Prevents ambiguous or multi-tenant Cron execution. |

After saving the required values, use **Deployments → latest production deployment → Redeploy**. Select the existing production branch and wait for the new deployment to reach **Ready**. Environment-variable changes do not retroactively modify a completed serverless build.

## 4. Register the OAuth Callback

In the OAuth provider’s application settings, add this exact production callback URL:

```text
https://ecosphere-ai-aiem-ideas.vercel.app/api/oauth/callback
```

The provider must allow the Vercel production origin and this callback. EcoSphere validates a one-time browser nonce on the callback before it exchanges the authorization code, writes the user record, issues the signed session, and redirects to `/`. A callback missing `code` or `state` returns `400`; a callback whose nonce does not match the initiating browser returns `403`; provider/token failures return `500` without exposing credential material.

## 5. Validate Health and Readiness

Run these commands after Vercel reports the redeployment as ready. They may be run from any terminal with `curl`.

```bash
export APP_URL="https://ecosphere-ai-aiem-ideas.vercel.app"

curl --fail --silent --show-error "$APP_URL/healthz"
curl --fail --silent --show-error "$APP_URL/readyz"
```

The expected liveness result is an HTTP `200` JSON body containing `ok: true`. The expected readiness result is also HTTP `200`; its dependency body must show `database: configured` and may continue to show `scheduler: not_activated_in_this_environment`. Verify the response headers include `x-request-id`, `content-security-policy`, `strict-transport-security`, `x-content-type-options`, and `x-frame-options`.

If readiness remains `503`, re-check that `DATABASE_URL` was saved to the **Production** target, the database accepts remote TLS connections from Vercel, the connection string has the expected database name and credentials, and all applied EcoSphere migrations exist in that database. Do not work around a readiness failure by disabling the readiness endpoint.

## 6. Validate Login, Tenant Boundaries, and Persistence

Use a normal browser profile or a private window to prevent an old cookie from masking a configuration error.

1. Visit the production URL and select **Sign in**.
2. Complete the provider login using the account whose `openId` matches `OWNER_OPEN_ID` for the owner check.
3. Confirm the browser returns to the EcoSphere Operations Overview rather than an OAuth error page.
4. Open **Registry** and verify the expected AIEM Campus Pilot organization is visible only to the authenticated tenant member.
5. Verify that a member with a non-owner role cannot perform owner-only membership changes, and that the final owner cannot be demoted.
6. Open **Live Data** and confirm tenant-scoped readings, import history, and provenance are visible.
7. Refresh the browser and confirm the session and tenant context persist without using browser memory as the source of truth.

Do not create a new production tenant merely to test access unless that data is approved for the pilot. The existing simulated fixture is explicitly labeled and must not be described as live campus telemetry.

## 7. Run the Controlled Scheduler Trial Only After Approval

This section is intentionally **not actionable until health, readiness, OAuth, and tenant checks have passed**. The current deployment has no recurring Cron schedule.

When a responsible operator explicitly approves a one-tenant trial, choose a non-production or clearly approved pilot tenant and obtain its positive numeric organization ID. Set a new `CRON_SECRET` and that one `VERCEL_CRON_ORGANIZATION_ID` in Vercel. Then request a controlled code update to add a Vercel Cron schedule for `/api/scheduled/monitoring`; do not add it manually without the repository change and review. Vercel Cron uses the `Authorization: Bearer <CRON_SECRET>` convention for protected calls.[2]

The trial must demonstrate one scheduled invocation, one tenant-bound monitoring run, persisted run evidence, no duplicate run key, correct health status, and no raw exception disclosure. Review the Administration workspace, `/readyz`, and runtime logs after the invocation. Pause the trial immediately if an unexpected tenant, repeated execution, or failed readiness state occurs.

## 8. Resolve the Remaining Release Gates

| Gate | Owner action | Completion evidence |
|---|---|---|
| Database readiness | Configure `DATABASE_URL` and verify migrations/network reachability. | `/readyz` returns `200` with `database: configured`. |
| OAuth | Register callback and configure the four required OAuth/application values. | Successful sign-in, callback, signed session, and tenant-scoped route access. |
| Tenant protection | Test owner, manager/operator, and unauthenticated route behavior. | Recorded allow/deny outcomes without cross-tenant reads. |
| Scheduler | Obtain explicit approval, then conduct a single-tenant trial. | One auditable scheduled run; recurrence remains disabled unless separately approved. |
| Invitations | Select and connect a real identity-provider invitation delivery mechanism. | Invitation receipt and acceptance evidence. |
| Restore rehearsal | Perform a deployed backup/restore exercise against an approved non-production target. | Documented restore timing and data-integrity checks. |
| Accessibility and performance | Measure the published site after database/OAuth configuration. | Recorded keyboard, mobile, and deployed performance observations. |

## 9. Incident and Rollback Procedure

If a new deployment causes public failures, open **Vercel Dashboard → Deployments**, select the most recent known good deployment, and use the Vercel rollback/promotion control. Preserve the failing deployment URL and runtime logs first. In GitHub, do not force-push or reset shared history; submit a corrective commit and let the linked Vercel project deploy it. If a database migration is involved, evaluate rollback separately because application rollback does not reverse a database schema or data change.

## References

[1] [Vercel, “Node.js Version Configuration”](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

[2] [Vercel, “Cron Jobs”](https://vercel.com/docs/cron-jobs)

