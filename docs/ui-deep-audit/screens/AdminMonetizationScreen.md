# AdminMonetizationScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/admin/monetization` (internal). Combines monetization metrics, shop preview, and seasonal rewards tooling.
- Users: internal operators who need anomaly detection + payout tools.
- Data: `/admin/monetization` API, `/season/snapshot`, `ShopPanel` catalog, `SeasonRewardsAdminPanel`.

## Layer Map
- **Base** — `TabPageSurface` stacked sections.
- **Primary** — KPI cards + daily trend table.
- **Support** — embedded shop preview, seasonal rewards admin panel.
- **Overlays** — reward modal, export toast (handled by `SeasonRewardsAdminPanel`).

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| KPI header | Metrics header + preset buttons | Shows "Окно: ... · Обновлено ..." but no source timezone or refresh timestamp for seasonal data; preset buttons lack pressed state. | Operators can’t tell if data is stale during incidents; preset toggles don’t expose selection to screen readers. | Add timezone label, "Updated at" timestamp, `aria-pressed` on preset buttons, and badges for stale data. | webapp/src/screens/AdminMonetizationScreen.tsx |
| Trend table | `<table>` inside `Surface` | Table scrolls horizontally but header row scrolls away; no inline sparklines or delta coloring. | Scanning 30 days requires constant realignment; anomalies are invisible without color/graph cues. | Freeze header (`position: sticky`), add inline sparklines or minicharts, color-code positive/negative deltas. | webapp/src/screens/AdminMonetizationScreen.tsx |
| Shop preview | `<ShopPanel bare />` | Renders full shop UI with no max-height, injecting modals and analytics meant for players. | Heavy component load bloats admin page (hooks, telemetry) and can fire customer-facing events from admin context. | Replace with lightweight catalog preview (static cards) or sandboxed iframe; disable player analytics when `bare` is true. | webapp/src/screens/AdminMonetizationScreen.tsx |
| Seasonal block | `SeasonRewardsAdminPanel` wrapper | Loading + error UI are plain text paragraphs without surface context or action buttons besides "Обновить". | When snapshot fetch fails there’s no retry guidance or log ID, slowing ops response. | Wrap states in alert surfaces, include retry CTA near message, and expose request ID for support. | webapp/src/screens/AdminMonetizationScreen.tsx |

## Interaction & Performance
- Both monetization and season fetches run concurrently but manage loading separately, so layout thrashes as sections appear at different times. Consider top-level suspense skeleton.
- Export uses `URL.createObjectURL` without success toast; add toast and error boundary to confirm operator action.

## Content & Localization
- KPI labels mix English ("Shop visit rate") and Russian tooltips; standardize copy.
- Add doc links for each metric definition so analysts share vocabulary.
