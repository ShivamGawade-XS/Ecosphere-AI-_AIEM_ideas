# EcoSphere AI Performance Notes

**Measured:** 2026-08-22 during the R4 hardening increment, using `pnpm build` with Vite’s production asset report.

## What Changed

Route modules were already loaded through dynamic imports. The shared application runtime, however, remained in a single `index` JavaScript chunk. The build now places stable React, data, UI, icons, charts/motion, and general third-party dependencies into deterministic vendor chunks. This makes the entry module materially smaller and lets browsers cache shared dependencies independently of route changes.

| Asset | Before chunk boundary | After chunk boundary | Interpretation |
|---|---:|---:|---|
| Application entry JavaScript | 698.61 kB minified / 203.71 kB gzip | 68.58 kB minified / 12.45 kB gzip | The route shell no longer embeds the shared runtime. |
| React shared runtime | bundled into entry | 400.49 kB minified / 118.39 kB gzip | Shared cacheable chunk; still a major first-visit dependency. |
| Data client shared runtime | bundled into entry | 62.62 kB minified / 17.43 kB gzip | Shared cacheable tRPC/React Query client chunk. |
| UI shared runtime | bundled into entry | 54.75 kB minified / 16.88 kB gzip | Shared cacheable component primitives. |
| General vendor chunk | bundled into entry | 102.74 kB minified / 34.00 kB gzip | Shared utility dependencies. |

The production build no longer emits Vite’s single-chunk warning above 500 kB. This is a **delivery and cacheability improvement**, not evidence that the total first-visit transfer is lower: the application still requires its shared dependency chunks on a cold cache.

## Current Limits and Next Measurements

The Vite HTML artifact remains large because the current embedded/document runtime must be reviewed separately. The React shared chunk is also substantial. Do not set a performance claim or service-level objective from build output alone. Before a production performance claim, capture deployed metrics for Core Web Vitals, cold/warm-cache route loads, data-query latency, and low-bandwidth mobile behavior.

The next safe optimizations are to profile the deployed application, defer route-specific charting or rich interaction dependencies where their route does not need them, audit imported UI primitives, and set explicit performance budgets in remote CI only after a deployed baseline is retained. Avoid removing operational loading/error states merely to optimize a bundle-size number.

## Reproducible Check

```bash
pnpm build
```

Record the Vite asset report in the release evidence. Treat an unexpected large route chunk or any reappearance of a single large application-entry chunk as a release-review finding.
