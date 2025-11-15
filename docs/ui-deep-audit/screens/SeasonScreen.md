# SeasonScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/season`. Shows season meta, player progress, rewards, and leaderboard.
- KPI: battle pass claims, event participation.
- Data: `/api/v1/season/current`, `/progress`, `/leaderboard` (public + auth endpoints).

## Layer Map
- **Base** — `TabPageSurface` header + stacked surfaces.
- **Primary** — season header + status pill, player progress card.
- **Support** — rewards list, events list, leaderboard.
- **Overlays** — browser alert on reward failure (no inline UI).

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Base | Loading/Error states | Uses plain `<p>` "Загрузка..." and generic error surface; no skeleton or persisted header. | Layout jumps from blank to full content, harming perceived performance. | Add skeleton cards for progress, rewards, and leaderboard; keep header visible while loading. | webapp/src/screens/SeasonScreen.tsx |
| Primary | Status indicator | Uses raw Tailwind classes (`bg-green-500`) instead of design tokens and lacks tooltip/time range. | Visual style diverges from design system; users don’t know timeframe for "active" flag. | Replace with tokenized badge component, include dates (start–end) + countdown. | webapp/src/screens/SeasonScreen.tsx |
| Support | Rewards list | If `seasonProgress.rewards` empty nothing renders (section hidden) so players think rewards missing. | Fails to educate new players about upcoming rewards tiers. | Always render rewards block with empty-state copy/CTA to play more. | webapp/src/screens/SeasonScreen.tsx |
| Support | Leaderboard card | Heading says `Топ {leaderboard.length}` but component slices to 20 entries; no pagination or CTA to full board. | Messaging inconsistent; players expect 100 entries yet only see 20. | Either show actual `leaderboard.length` or rename to `Топ 20`, add CTA to full leaderboard route. | webapp/src/screens/SeasonScreen.tsx |
| Overlay | Reward claim error | `handleClaimReward` calls `alert('Не удалось получить награду')`. | Browser alert breaks UX and doesn’t integrate with design system or telemetry. | Replace with toast + inline error state; include retry/backoff. | webapp/src/screens/SeasonScreen.tsx |

## Interaction & Performance
- Sequential API calls (info → progress → leaderboard) can take long; use `Promise.all` with safe fallbacks.
- Date formatting uses `toLocaleString` without timezone; align with server (UTC) to avoid confusion.

## Content & Localization
- Add descriptive copy about season theme and boosters; currently optional `description` may be empty.
- Show player's next reward threshold and a CTA to open shop if pass is incomplete.
