# AirdropScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/airdrop`. Intended to tease limited-time collaborations + future clan drops.
- Currently renders static `SAMPLE_EVENTS` and a "coming soon" block.

## Layer Map
- **Base** — simple `<div>` with header.
- **Primary** — `AirdropTimeline` component showing events.
- **Support** — `TabPageSurface` containing `ClanComingSoon` placeholder.
- **Overlays** — none.

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Primary | `SAMPLE_EVENTS` data | Events are generated client-side relative to `Date.now()` with whimsical text. | Players never see real drops; timestamps drift per user clock; statuses are meaningless. | Replace sample array with API-driven feed (signed + cached), include absolute start/end + countdown. | webapp/src/screens/AirdropScreen.tsx |
| Primary | AirdropTimeline copy | Descriptions mention rewards but there are no CTAs or claim buttons. | Users can’t act on information—they just read marketing text. | Add per-event CTA (claim, set reminder, open shop) and show eligibility status. | webapp/src/screens/AirdropScreen.tsx |
| Support | `ClanComingSoon` reuse | Clan placeholder appears even though this route is for airdrops. | Confusing messaging; players expect air-drop content but see clan teaser again. | Replace with FAQ about drop cadence or highlight next collaboration partners. | webapp/src/screens/AirdropScreen.tsx |
| Support | Header copy | Title is "Airdrop" (English) while body Russian. | Localization inconsistency reduces professionalism. | Localize heading + microcopy, add subheading describing cadence (e.g., "Обновляем каждые выходные"). | webapp/src/screens/AirdropScreen.tsx |

## Interaction & Performance
- No loading/error states; if future API fails, screen would silently show "coming soon".
- For long timelines, add virtualization or collapse past events.

## Content & Localization
- Provide trust signals (partners, rarity) and timeline (UTC, local time) so players know when to return.
