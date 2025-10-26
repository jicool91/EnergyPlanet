# Profile Panel (`ProfilePanel`)

- **Source**: `webapp/src/components/ProfilePanel.tsx`
- **Role**: Display player profile, stats, bio, and active boosts.

## Checklist Findings
- **Data Handling**: Shows skeleton while loading; handles error + empty states. Good UX alignment. citeturn0search0 **Severity: Low**
- **Localization**: Labels in Russian; ensure uppercase microcopy remains legible. `Tap lvl` uses lowercase `lvl` (in English). Standardise. **Severity: Low**
- **Accessibility**: Avatar div `aria-hidden`; good. Provide alt text when custom avatar frame displayed.
- **Boost List**: `boost.boost_type` raw string (e.g., `daily_boost`). Map to Russian label for clarity. **Severity: Medium**
- **Telemetry**: No analytics for profile view.

## Interaction & API Coverage
- Data from `useGameStore.loadProfile` hitting `/profile`. On failure, error card displayed. Provide retry button to re-fetch.
- Active boosts should align with `BoostHub`; ensure caching invalidated when claiming new boost (`refreshSession` called). Works via store? confirm.

## Issues & Risks
1. **Bio Rendering**: Plain text; consider sanitising to prevent HTML injection (if backend returns). **Severity: Medium**
2. **Empty Boosts**: If boosts zero, no CTA to discover `BoostHub`; add link.

## Opportunities
- Allow editing profile once backend supports (edit button).
- Display prestige stats within profile for deeper engagement.
