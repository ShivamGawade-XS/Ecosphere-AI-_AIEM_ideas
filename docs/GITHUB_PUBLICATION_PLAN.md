# GitHub Publication Plan

This plan applies **only** to [`ShivamGawade-XS/Ecosphere-AI-_AIEM_ideas`](https://github.com/ShivamGawade-XS/Ecosphere-AI-_AIEM_ideas). It turns the implemented work into a credible, reviewable repository history without creating misleading activity.

## Proposed issue drafts

| Proposed title | Labels | Body summary | Acceptance criteria |
| --- | --- | --- | --- |
| `feat: establish sustainability telemetry and monitoring domain` | `enhancement`, `backend` | Create persistence for campus telemetry, alerts, source governance, scenarios, and scheduled monitoring. | Demo campus seeds deterministically; calculations are traceable; scheduled callback is authenticated. |
| `feat: deliver AIEM Campus mission-control experience` | `enhancement`, `frontend` | Build the responsive dashboard, controlled anomaly flow, alert center, simulator, SDG impact view, and advisor. | Desktop and mobile layouts work; simulated data is labelled; demo spike produces a clear alert. |
| `test: harden deterministic sustainability workflow` | `testing`, `quality` | Add calculation, CSV validation, alert-state, scheduled-refresh, and advisor-guardrail verification. | Type check, lint, tests, and production build pass. |
| `docs: prepare judge demo and contribution workflow` | `documentation` | Add runbook, architecture, contribution guide, issue forms, and PR template. | A new contributor can run the project and follow the demonstration flow. |

## Proposed pull-request sequence

| Branch | Pull request title | Linked issue | Merge condition |
| --- | --- | --- | --- |
| `feat/sustainability-monitoring` | `feat: establish sustainability monitoring backbone` | Telemetry and monitoring domain issue | Migration reviewed; deterministic checks verified. |
| `feat/mission-control-dashboard` | `feat: build AIEM Campus mission-control dashboard` | Mission-control experience issue | Desktop and mobile screenshots reviewed; controlled alert flow demonstrated. |
| `test/sustainability-quality` | `test: cover sustainability lifecycle and quality gates` | Quality issue | `pnpm check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass. |
| `docs/project-workflow` | `docs: add demo workflow and contribution standards` | Documentation issue | README, architecture, runbook, templates, and contribution guidance reviewed. |

## Local commit history already prepared

The local repository uses five focused commits: `feat: add sustainability monitoring backbone`, `test: cover deterministic sustainability calculations`, `feat: build AIEM mission control dashboard`, `docs: add demo workflow and contribution standards`, and the final verification commit created after the quality pass. These commits should be pushed only after the owner confirms the exact GitHub action.

## Owner-approved publication sequence

1. Confirm the GitHub session is authenticated as `ShivamGawade-XS`.
2. Add the target repository as the local `origin` remote and push the verified commits.
3. Create the four issues above with the indicated labels.
4. If a reviewer workflow is desired, recreate the listed branches from the corresponding local commits and open the proposed pull requests. Do not merge until the owner confirms each merge.
5. Publish the web project through the project interface, then use the **Activate after publish** control to create the scheduled unresolved-alert check.

> GitHub issues, pull requests, pushes, and merges are external account actions. They are deliberately left for explicit owner confirmation.
