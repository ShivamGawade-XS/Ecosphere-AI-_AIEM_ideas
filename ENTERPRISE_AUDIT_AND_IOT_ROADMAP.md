# EcoSphere AI — Adversarial Enterprise Audit and IoT Roadmap

**Reviewed:** 24 August 2026  
**Scope:** Repository source, automated tests, production build, production dependency audit, GitHub governance, Vercel deployment evidence, and supported IoT integration paths.  
**Verdict:** **55/100 — strong competition prototype and credible product foundation; not yet enterprise-production ready.**

> A score of 55 does **not** mean the product is poor. It means the deterministic sustainability model, tenant-aware application structure, test suite, and deployment adapter are substantially ahead of a static demo, while several mandatory enterprise controls remain absent, unconfigured, or unverified. A true 100/100 claim would be misleading: it would require external identity, database, backup, operations, security-review, and IoT pilot evidence that code alone cannot create.

## Evidence-Based Scorecard

| Domain | Weight | Score | Audit basis | Enterprise gap |
|---|---:|---:|---|---|
| Product and sustainability logic | 20% | 73 | Deterministic EcoScore, carbon, anomaly, forecast, scenario, CSV-lineage, action, and report modules are implemented and tested. | No verified live campus telemetry or validated forecast/savings accuracy. |
| Data integrity and tenancy | 15% | 76 | Tenant-scoped organizations, role checks, idempotent ingestion, quarantine, corrections, provenance, and audit records are present. | Managed-file retrieval is key-based rather than tenant-authorized; external database is not connected in Vercel. |
| Application security | 20% | 42 | Baseline headers, CSP/HSTS, input schemas, role checks, and production dependency audit are present. | Public storage redirect, permissive session assumptions, oversized global body parser, no API rate limit, and broad CSP allowances remain. |
| Identity and access control | 10% | 48 | OAuth callback nonce validation and tenant-role controls are implemented. | Vercel OAuth values are not configured; session lifetime/revocation and app-binding checks need hardening; invitations are unverified. |
| Reliability and recovery | 10% | 47 | Worker lifecycle, idempotent run keys, health routes, and recovery state models are implemented. | A clean local production build cannot start with the current `pnpm start` script; no deployed restore rehearsal or scheduler trial has occurred. |
| Operations and observability | 10% | 45 | Structured request IDs, health/readiness route, CI, audit events, and operational runbooks exist. | Readiness is presently `503`; no alert-service delivery, central log retention, SLOs, on-call escalation, or production exercise evidence. |
| Deployment and supply chain | 5% | 58 | Git-linked Vercel deployment, Node 22 build evidence, frozen lockfile, passing CI, and no known production dependency vulnerabilities. | GitHub `main` is unprotected; repository is public; Dependabot security updates are disabled; no external artifact signing or SBOM process. |
| Accessibility and performance | 5% | 67 | Keyboard/focus/reduced-motion practices, route-level chunks, and client tests exist. | No measured published-site accessibility or performance baseline; main React chunk remains sizeable. |
| IoT readiness | 5% | 5 | The data model can accept deterministic readings and clearly labels simulated data. | No device registry, credential lifecycle, gateway, telemetry webhook, certificate model, device replay control, or live pilot exists. |
| **Weighted total** | **100%** | **54.9 / 100** | Rounded reporting score: **55 / 100**. | The highest-impact work is security, configured external dependencies, and device ingestion. |

## What Is Already Strong

EcoSphere AI has a better foundation than a typical competition dashboard. Numerical outputs originate from deterministic services rather than fabricated language-model values. The system persists data quality findings, anomaly events, alerts, forecasts, scenarios, recommendations, actions, report snapshots, and audit evidence. The monitoring design is browser-independent, idempotency-aware, and avoids continuous language-model calls. The repository also has 23 passing test files and 117 passing tests, a successful production build, a clean production dependency audit, and a live Vercel application shell with verified liveness.

The project also correctly exposes an honest readiness state instead of pretending that an unconfigured deployment is operational. `/healthz` is live, while `/readyz` reports that the Vercel deployment lacks a configured database and scheduler activation. This is a useful reliability behavior, but it also means the hosted instance is not yet a functional production service.

## Critical Findings — Fix Before Any Enterprise Claim

| ID | Finding | Verified evidence | Risk | Required remediation |
|---|---|---|---|---|
| E-01 | **Production is not operationally configured.** | Vercel readiness reports database unavailable; OAuth/application settings are not configured. | Authenticated tenant data, persistence, and scheduled monitoring cannot be verified in production. | Configure database and OAuth environment variables, apply migrations, verify readiness/login/tenant boundaries. |
| E-02 | **Managed storage is publicly key-addressable.** | `/manus-storage/*` obtains a signed URL for any supplied key without session, tenant, or evidence ownership checks. | A leaked or guessed key can disclose action evidence or imports. | Replace the public proxy with authenticated, tenant-scoped evidence download authorization; reject arbitrary keys. |
| E-03 | **Clean Node production start is broken.** | Clean build emits `dist/server/index.js`; `pnpm start` invokes missing `dist/index.js`. | Non-Vercel production deployment fails or may be masked by stale artifacts. | Correct start output/entry contract and add a clean-build start regression test. |
| E-04 | **Production request limits are too broad.** | App-wide JSON and URL-encoded parsers accept 50 MB; attachments are limited later but parser allocation occurs first. | Serverless memory/CPU denial of service and unnecessary attack surface. | Remove unused URL-encoded parsing, use a small global JSON limit, and apply a narrowly scoped attachment limit. |
| E-05 | **Session security lacks fail-closed configuration controls.** | Missing `JWT_SECRET` falls back to an empty signing secret; session payload does not verify its `appId` against the current environment. | A missing production secret can create a dangerously weak trust boundary; cross-environment token acceptance is possible if secrets are reused. | Reject production authentication when session secret is absent/weak; bind verified session `appId` to current app ID; surface readiness dependency. |
| E-06 | **No application rate-limiting or mutation-origin protection is present.** | No server-side request-rate middleware; cookies use `SameSite=None`; state-changing endpoints rely on standard route auth. | Brute-force, sustained resource use, and cross-site request risk are not explicitly bounded. | Use safer cookie defaults, explicit unsafe-method origin validation, and deployment-aware per-route rate limiting. |

## Important Findings — Must Be Resolved for an Enterprise Programme

| ID | Finding | Why it matters | Resolution path |
|---|---|---|---|
| E-07 | CSP allows inline scripts/styles and broad HTTPS/WSS connection and form targets. | Reduces browser exploit containment if an injection bug emerges. | Tighten directives after confirming external analytics/OAuth hosts; remove unsafe allowances where the generated frontend permits it. |
| E-08 | Session lifetime is long and token revocation/rotation is not modeled. | Lost devices or credential compromise cannot be centrally invalidated. | Use shorter sessions, rotation, server-side session/version records, logout/revocation tests, and administrator session controls. |
| E-09 | GitHub `main` is unprotected and Dependabot security updates are disabled. | A direct push can bypass review and automated security update flow. | Enable required checks, pull-request review, signed/verified commit policy if available, and Dependabot updates. |
| E-10 | No deployed database restore rehearsal, availability SLO, external alert delivery test, or published-site performance/accessibility measurement. | Operational claims are not evidence-backed. | Run controlled exercises with recorded objectives, evidence, recovery time, and failure handling. |
| E-11 | The repository is public. | Usually appropriate for a competition, but unsuitable for future private integration code, infrastructure details, or customer data. | Keep secrets out of source, separate private operations/infrastructure configuration, and consider a private production repository after judging. |
| E-12 | Vercel production is functionally limited by external provider compatibility. | Manus-managed OAuth/storage values cannot be assumed to work in Vercel. | Select Vercel-compatible identity, storage, and database providers and test them end to end. |

## Medium and Product-Quality Findings

The current platform lacks enterprise service-level objectives, centralized logs with retention, incident paging, a device inventory, a real invitation-delivery provider, immutable backup evidence, data-retention policies, privacy classification, a formal threat model, independent penetration testing, a software bill of materials, and a documented change-approval process. The performance and accessibility work is credible but still local and static: it is not evidence of a measured, authenticated, database-backed production experience on ordinary mobile networks.

The sustainability model is well-scoped for a pilot, but it must not be positioned as certified carbon accounting, a guaranteed savings engine, or a forecast validated on real AIEM history. Current simulated readings and pilot factors require visible disclosure in demos and reports.

## Remediation Order

| Priority | Workstream | Completion evidence |
|---:|---|---|
| P0 | Fix E-02 through E-06 and the clean-start defect. | Focused tests, full quality gate, source review, and documented security assertions. |
| P0 | Configure deployed database and OAuth. | `readyz` HTTP 200, authenticated owner flow, tenant-denial test, persisted data verification. |
| P1 | Protect GitHub main and enable dependency-update automation. | Branch-protection and Dependabot settings evidence. |
| P1 | Conduct controlled scheduler, backup/restore, invitation, alert-delivery, and deployed UX/performance exercises. | Time-stamped runbook evidence and observed results. |
| P2 | Add session rotation/revocation, security telemetry, SLOs, data retention, and threat-model review. | APIs, migrations, tests, operational dashboards, and written acceptance evidence. |
| P2 | Build the IoT pilot described below. | Device identity, telemetry validation, replay tests, pilot device reading, and failure-mode evidence. |

## First-Pass Remediation Record

The following P0 repository controls have now been implemented and verified locally. Managed storage now exposes only an explicit allowlist of public brand assets; organization-scoped keys require a signed session and tenant membership, while unknown key shapes return `404`. Action attachments now accept a limited document/image media-type allowlist rather than arbitrary browser-declared types. The build now produces and starts a dedicated `dist/server/start.js` artifact, and a clean build/start exercise confirms the static client can be found without stale artifacts.

Session signing now fails closed unless `JWT_SECRET` is at least 32 characters, verified sessions must match the configured application ID, production bearer-session fallback is disabled unless explicitly enabled, and readiness reports authentication configuration separately. Cookies and OAuth nonce state use `SameSite=Lax`; unsafe production requests with a conflicting browser Origin are rejected; global request parsing is reduced to 3 MB; and the tRPC boundary has an in-process per-IP request limit. These protections are regression-tested alongside the existing suite.

This pass does **not** convert an in-process rate limiter into a distributed edge control, add server-side session revocation, configure external identity/database providers, or prove a production restore. Those remain enterprise release gates rather than completed claims.

Production CSP has also removed inline-script permission and restricted form submissions to the same origin while retaining HTTPS external-script compatibility for the configured analytics/runtime surface. A repository `dependabot.yml` now requests weekly npm and GitHub Actions update pull requests. Branch protection, required reviews, and GitHub security settings remain owner-controlled GitHub configuration tasks and have not been changed automatically.

The final browser-policy pass removes the external analytics script rather than treating a browser telemetry vendor as an implicit enterprise dependency. Production CSP now permits only first-party scripts and first-party browser connections; this deliberately prioritizes tenant privacy and deterministic application behavior over passive third-party analytics.

The later session-invalidating increment adds `users.sessionVersion` through migration `0014_busy_sandman.sql`, verified in the managed database with a non-null default of `1`. New OAuth sessions carry that version; every authenticated request compares it with the persisted user version, and `auth.revokeAllSessions` atomically increments the version and clears the active cookie. This invalidates already-issued application sessions without storing raw session tokens.

## Post-Remediation Score

The evidence-backed score increases from **55/100 to 64/100**. The improvement is driven by verified storage authorization, clean production startup, session fail-closed behavior, request hardening, attachment controls, and a tested IoT device/telemetry foundation. The improvement is real but bounded: security reaches 62/100 because distributed abuse controls, session revocation, formal threat modeling, independent testing, and externally configured identity/database evidence remain outstanding; IoT rises to 40/100 because code and schema exist but no approved physical device has been connected.

> The correct enterprise claim today is **“64/100 production-readiness foundation, with concrete controls in progress”**—not “perfect,” “100/100,” or “fully enterprise-certified.”

## IoT Integration: Feasible Paths

Yes—EcoSphere AI can evolve from a simulated data source into a real campus IoT sustainability platform. It should **not** expose the Vercel app as a raw MQTT broker or place device keys in browser code. Devices should communicate with a managed broker or campus gateway, which authenticates every device and forwards a normalized, signed event to EcoSphere’s server-side ingestion boundary.

| Option | Best fit | Advantages | Tradeoffs | Recommended pilot |
|---|---|---|---|---|
| **HTTPS gateway push** | One or a few ESP32/Arduino gateway devices, existing meter APIs, fastest pilot. | Simple server-to-server boundary, easy Vercel deployment, direct HMAC verification, lower operational complexity. | Gateway must buffer offline readings; no native broker sessions. | **Start here** for 1–3 AIEM meters. |
| **Managed MQTT platform** | Multiple devices, intermittently connected sensors, device lifecycle needed. | QoS, device identity, topic policies, offline buffering, broker observability. | Requires a broker/provider and device provisioning workflow. | Second-stage rollout using AWS IoT Core, ThingsBoard, or managed EMQX. |
| **Campus edge gateway plus broker** | Legacy Modbus/BACnet meters, high-frequency buildings data, network-isolated sites. | Keeps OT/legacy protocols off the public internet; supports protocol translation and local buffering. | Requires managed edge hardware and stronger operations/patching discipline. | Use only after a facilities integration assessment. |

ThingsBoard supports timestamped telemetry over MQTT and HTTPS, including batch payloads.[1] [2] AWS IoT Core supports MQTT/MQTT-over-WSS, device SDKs, TLS/SNI, QoS 0/1, and persistent sessions.[3] EMQX supports device authentication through X.509 certificates, JWTs, password-based methods, and external HTTP services, but its documentation explicitly warns that authentication must be configured for production.[4]

### Recommended AIEM Pilot Architecture

```text
Meter / Sensor / Building API
          |
          v
Campus gateway (ESP32, industrial gateway, or vendor API adapter)
  - device certificate or per-device secret
  - local encrypted queue and clock health
  - payload sequence and timestamp
          |
          v
Managed broker or HTTPS ingestion gateway
  - mTLS / HMAC verification
  - topic or device authorization
  - replay and rate controls
          |
          v
EcoSphere server-side IoT ingress
  - registered device lookup
  - tenant/site/meter mapping
  - schema, unit, timestamp, and sequence validation
  - idempotency key and quarantine
          |
          v
Existing deterministic reading → monitoring → anomaly → EcoScore pipeline
```

### Required IoT Security Contract

Every device must have a unique immutable device ID, an assigned tenant/site/meter mapping, status, credential version, credential expiry/rotation history, and an explicit decommission state. Telemetry must include a device ID, observed timestamp, monotonically increasing sequence or nonce, metric/value/unit, and a signature or broker-authenticated identity. The server must validate device state, tenant ownership, payload size, canonical unit, allowed timestamp skew, duplicate sequence, and per-device rate before it creates a reading. Failures must be quarantined with no automatic cross-tenant fallback.

The first real pilot should use only electricity interval data from one approved meter or gateway. Compare three days of device totals against a trusted meter export before claiming accuracy. Water/waste and HVAC control should remain read-only integration targets until facilities approval, calibration, and fault-response procedures exist.

### Implemented Pilot Foundation

The repository now contains a provider-neutral HTTP gateway foundation, documented in `IOT_GATEWAY_PILOT.md`. It adds an additive device registry, hashed one-time device credentials, lifecycle control, organization/site/meter binding, canonical-unit and timestamp validation, connector provenance, receipt-based replay detection, and a bounded public telemetry endpoint. The managed database migration was applied and both IoT tables were verified. This is an implementation foundation—not evidence of a live AIEM device, broker, or calibrated meter.

## References

[1] [ThingsBoard, “MQTT Telemetry API”](https://thingsboard.io/docs/pe/reference/mqtt-api/telemetry/)

[2] [ThingsBoard, “HTTP Telemetry API”](https://thingsboard.io/docs/pe/reference/http-api/telemetry/)

[3] [AWS IoT Core, “MQTT”](https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html)

[4] [EMQX, “Authentication”](https://docs.emqx.com/en/emqx/latest/access-control/authn/authn.html)
