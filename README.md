# EcoSphere AI — AI-Powered Sustainability Mission Control

EcoSphere AI is a full-stack sustainability intelligence prototype created for **AIEM IDEAS 2026** at Agnel Institute of Engineering and Management, Goa. It turns campus telemetry into a clear operational loop: **monitor → detect → predict → simulate → recommend → act → measure → repeat**.

The project is intentionally designed for a dependable live demonstration. Its AIEM Campus Pilot runs without paid external data services, identifies all seeded information as **simulated**, and keeps numerical findings deterministic and traceable.

## What the prototype demonstrates

| Capability | Demonstration behavior |
| --- | --- |
| Executive dashboard | Energy, water, waste, calculated carbon, EcoScore, and a compact sustainability trend view. |
| Anomaly response | A controlled HVAC energy spike produces a server-side high-severity alert with a next action. |
| Forecasting | A transparent short-horizon forecast based on the latest energy telemetry trend. |
| What-if simulator | Adjustable conservation measures calculate projected carbon avoidance, monthly savings, EcoScore lift, and intervention rank. |
| AI advisor | Short follow-up guidance grounded in the supplied telemetry context; it does not invent metrics. |
| SDG impact | Measurable prototype indicators for SDGs 7, 11, 12, and 13. |
| Data ingestion readiness | Approved CSV import today, with sensor and API source records ready for controlled future activation. |
| Monitoring architecture | Scheduled unresolved-alert checks and owner notifications are prepared for activation after publication. |

## Quick start

Install dependencies and start the local development server.

```bash
pnpm install
pnpm dev
```

Run the quality checks before proposing changes.

```bash
pnpm check
pnpm test
pnpm build
```

The first dashboard request creates the **AIEM Campus** demonstration dataset in the configured database. This dataset is synthetic and is visibly labelled in the interface.

## Judge-ready demo flow

Open the AIEM Campus dashboard, observe the EcoScore, and select **Run live demo**. EcoSphere AI injects a controlled simulated HVAC spike, calculates its deviation from the trailing baseline, opens a high-severity alert, and refreshes the energy trend. Review the alert centre and ask the AI advisor how to respond. Then use the What-if Sustainability Studio with a 15% energy reduction to compare projected carbon avoidance and savings. The SDG panel shows the resulting contribution signals.

> **Important:** The prototype’s electricity emission factor and tariff are disclosed demo constants, not a claim about current local utility tariffs or grid factors. Replace them with a campus-approved methodology before operational use.

## CSV import format

Only sources marked **approved** can ingest telemetry. Use a UTF-8 CSV with the required header fields:

```csv
timestamp,metric,value,unit
2026-08-22T09:00:00Z,energy,742,kWh
2026-08-22T09:00:00Z,water,35,kL
```

Allowed metrics are `energy`, `water`, `waste`, and `carbon`. Imported data is not labelled as simulated; the source must therefore be approved by the campus owner before it is used in decisions.

## Architecture and operations

See [the architecture guide](docs/ARCHITECTURE.md) for the data flow, deterministic calculations, database model, alert lifecycle, and scheduling design. See the [demo runbook](docs/DEMO_RUNBOOK.md) for the recommended presentation sequence and expected observations.

The scheduled monitoring endpoint is included at `/api/scheduled/monitoring`. Its job must be activated only **after** a published deployment exists, using the project owner’s signed-in session. This avoids a scheduler pointing to an unpublished preview environment.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. The project uses small, meaningful commits, deterministic calculations, and mandatory verification for material changes.

## License

This project is released under the [MIT License](LICENSE).
