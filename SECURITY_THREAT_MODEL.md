# EcoSphere AI Security Threat Model and Pilot Data-Handling Policy

**Status:** Pilot-release design control, not a security certification  
**Last reviewed:** 24 August 2026  
**Owner:** EcoSphere AI product owner  
**Applies to:** The EcoSphere web application, its Vercel deployment, the managed database, organization-scoped storage, OAuth integration, and the provider-neutral IoT HTTPS pilot ingress.

## Purpose and Scope

EcoSphere AI is a multi-tenant sustainability operations pilot. Its primary security objective is to prevent one organization, unauthenticated browser, or unregistered device from reading, changing, or attributing another organization’s operational evidence. Its second objective is to ensure that sustainability calculations can be traced to persisted readings, governed factors, and deterministic calculation versions rather than invented values.

This document describes the controls that exist in the repository and the risks that remain. It does not claim certified carbon-accounting controls, a completed penetration test, a live campus integration, or compliance with a specific legal or industry standard.

## Protected Assets and Data Classification

| Asset or data class | Classification | Primary protection | Retention position for the pilot |
|---|---|---|---|
| Public narrative, product copy, and four approved brand visual keys | Public | Explicit storage allowlist and ordinary browser delivery | Retain while published; review before adding any new public object key. |
| Organization, site, meter, reading, factor, scenario, action, alert, report, and audit records | Internal tenant operational data | Authenticated tRPC procedures, organization membership checks, tenant-scoped persistence queries, audit events | Retain only for the pilot/business need. A production owner must set a documented schedule before onboarding customer data. |
| CSV imports, correction lineage, evidence attachments, and generated report snapshots | Restricted tenant evidence | Tenant-bound storage access and attachment media-type allowlist | Keep only while the associated decision/audit record is required; verify deletion and restore behavior before promising retention periods. |
| OAuth/session material, device secrets, database credentials, and environment configuration | Secret | Environment configuration; signed sessions; device secrets hashed at rest; one-time credential display | Never commit, log, include in reports, or return after the initial one-time device-credential response. |
| Simulated readings, forecasts, modeled savings, and pilot carbon factors | Internal modeled evidence | Explicit simulated/provenance labels, deterministic method/version persistence | Retain with their provenance and method version. Never restate as campus-source telemetry, realized savings, or certified accounting. |

## System Trust Boundaries

```text
Browser / user
  | OAuth session cookie; same-origin mutations; first-party CSP
  v
EcoSphere Express + tRPC boundary
  | authentication, role checks, organization scope, schema limits, audit event creation
  v
Managed database and organization-scoped object storage

Campus gateway or meter adapter
  | explicit organization header, device key/secret, meter binding, timestamp/unit/message checks
  v
IoT HTTPS ingress
  | active device lookup, rate control, receipt replay detection, connector provenance
  v
Same validated reading and deterministic monitoring pipeline
```

The browser is never a trusted monitoring worker. It can request authorized one-shot operations, but recurring monitoring remains an explicitly gated server-side operation. Device hardware is not trusted merely because it can reach the public internet; it must be registered, active, bound to the requested tenant/site/meter, and authenticated with a current device credential.

## Threat Register

| Threat | Abuse path | Implemented mitigation | Residual risk and release evidence still required |
|---|---|---|---|
| Cross-tenant data exposure | Guessing an object key, changing an organization ID, or reusing a route from another tenant | Organization membership checks in APIs and storage proxy; explicit public-key allowlist only; tenant-safe database helpers and authorization tests | Perform deployed two-tenant denial tests after Vercel database/OAuth configuration. Review every future non-organization storage key before making it public. |
| Session forgery or use after revocation | Missing/weak signing secret, token copied across applications, stale signed cookie | Fail-closed secret check, active application-ID binding, 12-hour session maximum, persisted `sessionVersion` revocation, production bearer fallback off by default | Configure Vercel authentication variables; complete real login/logout/revocation checks; consider MFA and organization-level administrator controls before enterprise rollout. |
| Browser-originated state change | Cross-site POST or replayed browser request | `SameSite=Lax` cookies, unsafe-method Origin validation, same-origin form CSP, authenticated tRPC procedures | Add edge/distributed abuse mitigation before high-volume/public launch; test every new external OAuth or embedded-browser origin deliberately. |
| Resource exhaustion | Large JSON payload, high request volume, repeated device traffic | 3 MB global JSON parser limit, attachment type policy, in-process per-IP and device ingress bounds | In-process limits are not distributed across serverless instances. Add a managed edge/WAF/rate-limit service and alerting before enterprise traffic. |
| IoT impersonation or cross-tenant telemetry | Stolen key, inactive device reuse, forged meter mapping, stale or duplicated messages | Hashed one-time device secret, explicit organization namespace, active lifecycle state, tenant/site/meter binding, unit/timestamp/value validation, receipt replay control, credential versions/rotation | No mTLS, broker policy, hardware root of trust, or live gateway has been verified. Start with one read-only meter and compare three days against a trusted meter export. |
| Malicious or misleading evidence | Unsupported attachment type, untraceable CSV row, modeled output stated as actual outcome | Attachment allowlist, import/quarantine/correction provenance, factor and calculation versions, explicit simulated labels | Malware scanning, DLP, legal retention controls, and independent evidence assurance are not implemented. Do not accept unreviewed executable or archive formats. |
| Injection or browser compromise | Script injection, unsafe third-party script, broad connection destination | Production CSP limits scripts and browser connections to first-party sources; HSTS, anti-framing, nosniff, referrer and permissions policies; no external analytics script | Inline styles remain permitted for the existing UI; conduct an independent application security test before enterprise claims and add reviewed CSP origins only when needed. |
| Dependency or delivery compromise | Vulnerable dependency or direct unreviewed change to main | Node 22 pin, frozen lockfile, production audit in quality flow, Dependabot configuration, GitHub CI | Protect GitHub main with review/status requirements, review Dependabot pull requests individually, enable security updates, and create an SBOM/attestation process for a formal release. |
| Data loss or unrecoverable corruption | Database incident, erroneous migration, destructive operator action | Migration discipline, readiness gates, runbooks, audit records, idempotent/recovery-aware monitoring model | A deployed restore rehearsal has not occurred. Establish backup ownership, RPO/RTO targets, and a timed restoration exercise before production data commitments. |

## Security-Control Verification Map

| Control family | Repository evidence | Current verification status |
|---|---|---|
| Session handling | `server/_core/sdk.ts`, `server/_core/oauth.ts`, `users.sessionVersion` migration | Unit and router tests pass locally; deployed OAuth/revocation is pending configuration. |
| HTTP hardening | `server/_core/security.ts`, `server/_core/app.ts` | Header, origin, and rate-limit tests pass; production `/healthz` exposes HSTS, anti-framing, nosniff, referrer/permissions, and first-party CSP headers. |
| Tenant access | `server/db.ts`, `server/routers.ts`, `server/_core/storageProxy.ts` | Tenant/scope tests pass locally; deployed two-tenant denial exercise remains a release gate. |
| IoT pilot ingress | `server/iot/telemetry.ts`, `iot_devices` and `iot_telemetry_receipts` migrations | Device, replay, rotation, and owner/non-owner UI tests pass locally. No physical device or broker proof exists. |
| Supply chain | `package.json`, lockfile, `.github/dependabot.yml`, GitHub Quality workflow | Full local quality passes; remote Quality passed for the code hardening commit. Branch protection and Dependabot security-update settings remain operator actions. |
| Operational recovery | `VERCEL_OPERATOR_RUNBOOK.md`, health/readiness routes, monitoring recovery records | Local production start and live liveness are verified. Production readiness is intentionally `503`; restore and scheduler exercises remain pending. |

## Security Review Cadence and Change Triggers

The product owner should review this threat model before adding a new external provider, browser-originated integration, public storage path, device/broker type, privileged role, data export, or category of customer data. Every such change requires a tenant-bound authorization decision, a logging decision, a retention/deletion decision, a failure mode, and a regression test.

For the pilot, perform a lightweight monthly review of open Dependabot updates, dependency audit results, authenticated error patterns, and tenant audit events. Before any customer or campus-wide production launch, require a formal review of this document, protected-main configuration, Vercel environment completeness, backup/restore evidence, a measured accessibility/performance baseline, a deployed two-tenant isolation exercise, and an independent security assessment.

## Explicit Residual-Risk Statement

The application is a **67/100 production-readiness foundation**, not an enterprise-certified service. In particular, it has no confirmed Vercel database/identity configuration, no deployed authentication or tenant-isolation evidence, no distributed rate limiting, no external invitation delivery proof, no restore rehearsal, no measured production accessibility/performance baseline, and no physical IoT pilot. These are release gates, not conditions to waive through documentation.
