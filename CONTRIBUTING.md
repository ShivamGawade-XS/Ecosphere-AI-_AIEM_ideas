# Contributing to EcoSphere AI

EcoSphere AI values focused contributions that make the sustainability mission-control workflow more reliable, auditable, and useful in a campus context.

## Before you start

Open an issue for a substantial feature or design change before beginning implementation. Describe the intended user outcome, affected sustainability indicators, whether any data is simulated, and the verification method. Do not add external telemetry credentials or unapproved data sources to the repository.

## Engineering expectations

Numerical sustainability values must come from deterministic, reviewable logic. Any change to EcoScore, carbon conversion, anomaly thresholds, forecast behavior, or simulation formulas requires a corresponding test and an explicit update to the architecture documentation. The AI advisor may explain results, but it must receive bounded context and must not become the numerical source of truth.

Use concise, conventional commit messages such as `feat: add approved csv validation`, `fix: preserve alert resolution timestamp`, or `docs: clarify demo reset flow`. Keep commits cohesive; avoid mixing formatting-only changes with feature work.

## Local verification

Run the following checks before opening a pull request.

```bash
pnpm check
pnpm test
pnpm build
```

For user-facing changes, include desktop and mobile screenshots and describe the manually verified flow. For monitoring changes, include the alert state transitions and notification behaviour tested.

## Pull request checklist

Each pull request should reference an issue where practical, state the user-facing outcome, disclose whether data is simulated, include tests, and identify any follow-up deployment or configuration step. Reviewers should be able to understand the change without running external paid services.
