# TapScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/` → `TabPageSurface` hero with `TapCircle`, quick stats, resource shortcuts, and modal overlays (`AchievementsModal`).
- KPIs: tap engagement, streak retention, boost/shop conversion, and prestige resets.
- Data dependencies: `useGameStore`, `useCatalogStore`, `useAuthStore`, `useExperimentVariant`.

## Layer Map
- **Base shell** — `TabPageSurface` stacking hero content with `gap-6` (vertical scroll only).
- **Primary hero** — `TapCircle`, `StatsSummary`, and `Button` → buildings CTA.
- **Support cards** — `DailyTasksBar`, `PurchaseInsightCard`, social proof `Card`.
- **Overlays** — `AchievementsModal`, notification toasts, haptic feedback.

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Hero | `TapCircle` hero button & badges | Uses localized aria-label but still renders English copy (`Tap!`, `Tap Lv`) and emoji-only badges. | Mixed-language UI breaks immersion and violates localization tone, especially for RU-first onboarding. | Move badge copy to i18n strings and swap `Tap Lv` with localized tokens; add text equivalents for emoji badges. | webapp/src/components/tap/TapCircle.tsx |
| Hero metrics | `StatsSummary` numbers for energy/tap/passive/prestige | Component renders live metrics as static text without `aria-live` or animation gating. | Screen readers and reduced motion users never hear energy or multiplier updates, violating WCAG 2.2 real-time info guidance. | Wrap metric blocks with `aria-live="polite"`, debounce announcements, and add micro-interactions guarded by `prefers-reduced-motion`. | webapp/src/components/tap/StatsSummary.tsx |
| Support CTA | `PurchaseInsightCard` | CTA "Улучшить сейчас" always enabled even when `affordable` is false; card only shows text "Осталось накопить". | Users tap through to boosts they cannot buy, inflating frustration and telemetry noise. | Bind `Button` disabled state + copy to affordability, add alternative action (e.g., set saving goal) when remaining cost > 0. | webapp/src/screens/TapScreen.tsx |
| Support block | `DailyTasksBar` social proof | Leaderboard count renders plain text "Загрузка…" without skeleton/focus handling; social card mixes static `<div>` + focusable buttons. | During loading the card shrinks abruptly and offers no `aria-busy`, hurting spatial rhythm and accessibility. | Add skeleton rows, `aria-live`, and consistent button layout so focus order remains predictable while numbers stream in. | webapp/src/components/tap/DailyTasksBar.tsx |

## Interaction & Performance
- Polling loops (`setInterval` for streak reset + boost timers) run regardless of tab visibility; gate them via Page Visibility API to avoid hidden-tab CPU drain.
- Achievements data loads only when modal is open; badge count can show outdated claimable tiers. Consider background refresh with stale-while-revalidate logic.

## Content & Localization
- Normalize CTA copy to Russian ("Тап" vs "Tap"), and expose translation hooks for future locales.
- Provide explanatory microcopy near prestige reset button about XP loss vs multiplier gains.
