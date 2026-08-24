# Current Credential-Independent Hardening Review

**Reviewed:** 24 August 2026  
**Scope:** Source-level audit, targeted regression tests, production dependency audit, and unauthenticated public-page desktop/mobile review.

## Verified Findings and Actions

| Area | Finding | Status | Evidence |
|---|---|---|---|
| Dynamic chart styling | The reusable chart primitive used an interpolated stylesheet. It is safe in current static uses, but future reuse with untrusted inputs could have created arbitrary CSS content. | **Remediated** | Chart identifiers, metric keys, and CSS values are constrained; invalid values are omitted. `chart.test.tsx` covers safe and unsafe cases. |
| In-process abuse control | Unique request-IP keys could accumulate without a hard cardinality ceiling, and the scheduler callback had no route-local rate bound. | **Remediated** | Rate buckets use a bounded overflow bucket, return reset metadata, and the scheduler callback is limited. `security.test.ts` covers per-IP and overflow behavior. |
| Session duration | The documented twelve-hour session limit could be bypassed by a future internal caller supplying a longer duration. | **Remediated** | The session-signing primitive now clamps all durations to `SESSION_MAX_AGE_MS`; `sdk.test.ts` covers default, invalid, shorter, and oversized values. |
| Storage boundary | The generic storage helper accepted non-canonical object paths and could surface an upstream presign response body through an application error. | **Remediated** | Object keys reject traversal, empty segments, backslashes, control characters, and oversized paths; presign failures log status server-side and return only a status-safe error contract. `storage.test.ts` covers both controls. |
| Browser policy | The first-party CSP did not explicitly deny plugin objects, inline script attributes, or non-self worker/manifest sources. | **Remediated** | Production CSP now includes `object-src 'none'`, `script-src-attr 'none'`, `worker-src 'self'`, and `manifest-src 'self'`; middleware tests assert all directives. |
| Mobile accessibility | The viewport metadata set `maximum-scale=1`, preventing users from increasing text size with pinch zoom. | **Remediated** | The responsive viewport no longer blocks user zoom. `client/index.test.ts` prevents reintroducing a scale cap. |
| Dependency toolchain | pnpm patch/override metadata was ignored by pnpm 10, and an unused Vite plugin had an unsupported Vite 7 peer range. | **Remediated** | Workspace configuration is now supported, frozen installs pass, and the unused plugin was removed without affecting production build output. |
| Public narrative visual quality | The public `/narrative` page was reviewed at 1280×720 and 375×812. | **Pass** | The desktop review found the Field Operations Ledger direction strong and ship-ready. The mobile view retained readable sections and did not show horizontal overflow. This is a visual implementation review, not a measured Lighthouse or WCAG conformance test. |

## Remaining Operator or External Gates

The current local release gate passed with a frozen dependency installation, **30 test files / 143 tests**, TypeScript validation, production build, production dependency audit with no known vulnerabilities, and a clean production-server liveness response on an isolated port. Vercel database and identity configuration, authenticating at the deployed origin, two-tenant production denials, invitation delivery, scheduler activation/trial, backup restore rehearsal, production performance/accessibility measurement, edge/distributed rate limiting, protected-main GitHub policy, and a live IoT pilot cannot be completed safely without the required service configuration or organizational approval. These are deliberately retained as release gates.
