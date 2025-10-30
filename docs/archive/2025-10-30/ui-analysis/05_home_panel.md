# Home Panel Overview (`HomePanel`)

- **Element ID**: `<HomePanel ... />`
- **Source**: `webapp/src/components/HomePanel.tsx`
- **Role**: Primary gameplay surface showing energy stats, tap CTA, progress, prestige, and social proof.

## Purpose & Success Criteria
- Deliver instant comprehension of current energy, tap power, passive income, and XP progress.
- Encourage tapping and highlight next goals (buildings, prestige) while reinforcing streak mechanics.

## Implementation Summary
- Two-column layout on large screens; single column stack on mobile (`lg:grid`).
- Hooks: `useDevicePerformance`, `useSafeArea` adjust animations and paddings.
- Components: `StatCard`, `DailyRewardBanner`, `XPProgressCard`, `PrestigeCard`, `SocialProofCard`, `Card` (Next Goal).
- Uses Framer Motion for tap button and streak badge animations.

## UX Compliance Check
- **Safe Area**: Adds top/bottom padding via `safeArea.content`. Confirm left/right padding on devices with gesture bars (landscape). **Severity: Medium**
- **Localization**: Mixed English (`Tap Lvl`, `Power Up`) and Russian copy; plan localisation. **Severity: Medium**
- **Accessibility**: Animated streak badge lacks `aria-live`, so screen readers miss state change when streak updates. Consider `aria-live="polite"`. **Severity: High**
- **Skeleton States**: Panel shown only when `isLoading=false`; ensure store sets `isLoading` properly to avoid blank screen during fetch.
- **Haptics**: Tap button uses `useHaptic`; consider haptic for prestige or daily reward claims.

## Interaction & API Coverage
- Tap button calls `useGameStore.tap(1)` -> `POST /gameplay/tap`. Need to confirm backend throttling to avoid 429; add QA scenario.
- Prestige button (inside `PrestigeCard`) triggers `performPrestige` -> `POST /prestige/perform`. Check whether UI blocks while `isPrestigeLoading`.
- Next Goal card is informational only; consider CTA to open `BuildingsPanel`.

## Issues & Risks
1. **Animation Performance**: Large motion button may degrade on low-end devices despite `useDevicePerformance`; profile to ensure 60fps. **Severity: Medium**
2. **Random Social Proof**: `Math.random()` per render can cause hydration mismatch if server renders in future; wrap in memo or store. **Severity: Low**
3. **Purchase Insight Null Case**: When `purchaseInsight` is undefined, user lacks next guidance; consider fallback messaging referencing `/buildings`. **Severity: Low**

## Opportunities
- Expose telemetry: `tap_button_press`, `prestige_open`, `goal_card_view`.
- Introduce tutorial nudge for new players before unlocking prestige.
- Provide manual refresh for data cards (XP, prestige) if WebSocket sync fails.
