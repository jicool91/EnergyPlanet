# ClanScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/clan`. Currently pure placeholder telling players "Кланы появятся".
- KPI: pre-registration / interest capture for clans (not implemented).

## Layer Map
- **Base** — `TabPageSurface` with two stacked elements.
- **Primary** — Informational `Surface` with heading + paragraph.
- **Support** — `ClanComingSoon` component.
- **Overlays** — none.

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Primary | Announcement surface | Static copy, no CTA, no timeline, no notification hook. | Players bounce because they cannot sign up or learn ETA; page wastes a tab slot. | Add waitlist CTA (Telegram link), countdown, and summary of planned clan perks. | webapp/src/screens/ClanScreen.tsx |
| Support | `ClanComingSoon` component | Reused component duplicates same message, creating redundant vertical space. | Feels rushed/unfinished and pushes key content below fold. | Replace with visual teaser (mockups) or remove until unique content ready. | webapp/src/screens/ClanScreen.tsx |
| Base | SEO / telemetry | Screen doesn’t log exposure or interest metrics. | Product can’t measure clan demand. | Fire telemetry event + include share/click metrics. | webapp/src/screens/ClanScreen.tsx |
| Base | Accessibility | No heading hierarchy beyond `Text` component; screen lacks `aria-label` or context. | Users navigating via landmarks can’t tell why this tab exists. | Add region label ("Кланы скоро"), restructure headings (H1/H2). | webapp/src/screens/ClanScreen.tsx |

## Interaction & Performance
- Lightweight, but consider lazy-loading this route until real content is added.

## Content & Localization
- Provide bilingual copy or at least Russian-only message; avoid English loanwords unless brand-approved.
