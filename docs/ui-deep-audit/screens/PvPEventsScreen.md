# PvPEventsScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/pvp` (internal). Shows featured modes + upcoming schedule.
- KPI: PvP queue conversion, streak retention.
- Data: currently mocked via `useMemo` arrays.

## Layer Map
- **Base** — `TabPageSurface` stacking two sections.
- **Primary** — `MatchLobby` (mode cards, queue estimates, CTA?).
- **Support** — `EventSchedule` timeline with events list.
- **Overlays** — none wired.

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Primary | `modes` data | Hard-coded array inside `useMemo`, never refreshed, not tied to backend or experiments. | Live ops can’t reconfigure queues or disable modes without shipping code; players see stale queue sizes. | Fetch lobby config from API/feature flags with fallback skeleton + cache invalidation. | webapp/src/screens/PvPEventsScreen.tsx |
| Primary | Queue CTA | `MatchLobby` receives `friendsOnline`, `dailyBonus`, but there’s no explicit CTA callback from this screen. | Users cannot join queue directly—best-case they tap inside child component, worst-case nothing happens. | Pass queue/join handlers down (navigate to match, open modal) and instrument clicks. | webapp/src/screens/PvPEventsScreen.tsx |
| Support | `EventSchedule` `events` data | Also mocked with `useMemo` and uses client clock for start/end. | Schedules drift vs server timezone; daylight changes will misalign countdowns. | Request events from backend with server timestamps and display timezone label. | webapp/src/screens/PvPEventsScreen.tsx |
| Support | Empty/error states | No fallback when `events` array empty or fetch fails. | Screen would render blank area; no CTA to subscribe or refresh. | Add skeleton + "нет событий" message with subscribe button. | webapp/src/screens/PvPEventsScreen.tsx |

## Interaction & Performance
- `useMemo` recalculates events when `now` changes? `now` never updates, so countdown never moves; need ticker or derived component.
- Add virtualization or `IntersectionObserver` if event list grows.

## Content & Localization
- Provide explanation of league tiers and rewards; now only icons/emojis.
- Surface timezone (e.g., Europe/Moscow) next to schedule heading.
