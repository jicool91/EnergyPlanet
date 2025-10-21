# Sprint 1 Plan (Oct 29 – Nov 4, 2025)

_Generated via best-practice sprint planning prompt combining MoSCoW prioritisation, RICE scoring, 25% capacity buffer, and now/next/later framing._

## Team Capacity & Buffer
- Team: 2 backend, 2 frontend, 1 designer, 1 data/QA hybrid.
- Sprint capacity: 6 engineer-weeks + 1 designer-week + 1 QA-week.
- Reserve 25% (≈1.5 engineer-weeks) for maintenance, telemetry, emergent fixes.

## Now (Must)

| Epic | MoSCoW | Owner(s) | RICE (R × I × C ÷ E) | Narrative |
| --- | --- | --- | --- | --- |
| Redis Tap Aggregation & Worker | Must | Backend #1 | Reach 60k taps/day × Impact 3 × Confidence 0.7 ÷ Effort 2 ⇒ **63k** | Batch tap writes to cut DB load, unlock reliable tap telemetry, and feed monetisation loops. Redis buffer `tap:{userId}` + 500 ms/50-tap flush, `tap_events` table, `tap_batch_commit` logging. |
| Passive Session Refresh | Must | Backend #2, Data/QA | Reach 30k daily sessions × Impact 2.5 × Confidence 0.65 ÷ Effort 1.5 ⇒ **32.5k** | `/session` reflects off-line grants and passive-per-sec in real time. Stores last flush timestamp, logs `offline_income_grant`. QA adds tap/buy/offline log coverage. |
| Core Loop UI Polish | Must | Frontend #1/#2, Designer | Reach 35k daily active users × Impact 2.8 × Confidence 0.6 ÷ Effort 2 ⇒ **29.4k** | Introduce streak counter and real-time passive income panel to make energy gains legible and retain newcomers. Error affordances retained. |
| Content Rebalance Tier1–3 | Must | Designer, Backend #2 | Reach 100% of new players × Impact 2.2 × Confidence 0.7 ÷ Effort 1 ⇒ **15.4k** | Update `content/buildings.json`, add comparison table to keep early progression smooth and align with new passive panel. |

## Should (Next)
- **Session Summary Modal (Frontend #2, Designer)** — Present energy/xp/buff summary after offline return; reuse passive-income data. RICE 12k.
- **Auto-Grant Solar Panel (Backend #1, QA)** — If tutorial skipped, ensure inventory seed; log `building_purchase` synthetic event. RICE 9k.
- **Redis Telemetry Dashboard Slice (Data/QA)** — Grafana/Kibana queries for tap buffer lag & flush errors. RICE 7k.

## Later (Could)
- **Tap Heatmap Experiment** — feed aggregated `tap_events` into analytics layer (post-MVP).
- **Offline Income Push Prompt** — notify players after large grants once messaging channel ready.

## Buffer (25%)
- Production support, redis latency alert tuning, content QA on rebalanced tiers, test data reset script for tap events (Backend/Data/QA).

## Dependencies & Risks
- Ensure Redis maxmemory policy `volatile-lru` and network latency < 30 ms to keep flush <500 ms.
- New `tap_events` table requires migration before worker start; staging DB must enable `uuid-ossp`.
- Passive income panel depends on content diff; coordinate release to avoid mismatched numbers.

## Success Metrics
- DB write load on `/tap` reduced ≥40%.
- Redis flush latency p95 < 400 ms; zero lost tap batches (validated via `tap_events` gaps).
- Passive income panel adoption ≥80% of sessions; streak completion D1 uplift +5pp.
- Offline grant log coverage: 100% of `/session` returns include `offline_income_grant`.
