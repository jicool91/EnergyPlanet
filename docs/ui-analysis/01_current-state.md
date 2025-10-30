# 01 · Current-State Audit (Telegram Mini App)

_Last reviewed: October 30, 2025_

## Strengths
- Tab shell already respects Telegram safe-area insets and exposes semantic roles for each tab button, reducing baseline accessibility debt (`webapp/src/components/TabBar.tsx:39`).
- Core loop feedback is immediate: taps trigger haptics, glowing CTA animation, and streak counters so players feel rewarded instantly (`webapp/src/screens/MainScreen.tsx:280`, `webapp/src/components/HomePanel.tsx:528`).
- Administrative metrics screen ships with clear loading/error states and inline retry, so operators are not left guessing (`webapp/src/screens/AdminMonetizationScreen.tsx:220`).

## High-Risk Gaps
### Navigation & Discoverability
- Tab bar relies on emoji glyphs with no alternative icon set, hurting recognisability and scannability on Android OEM fonts; keyboard arrow navigation is also missing, which breaks expected WAI-ARIA tab behaviour (`webapp/src/components/TabBar.tsx:69`).
- Clan tab renders a “coming soon” placeholder but still occupies prime navigation real estate; users must pay a navigation tax with no payoff, diluting perceived breadth of available content (`webapp/src/screens/MainScreen.tsx:742`).

### Home Panel Visual Hierarchy
- Hero CTA competes with streak chips, multipliers, and multiple uppercase micro-copy blocks; dense gradients and uppercase paragraphs create a “wall of intensity” that slows scanning (`webapp/src/components/HomePanel.tsx:520`).
- Repeated micro typography (`text-xs`, `text-[11px]`) drives contrast issues on Telegram dark mode overrides and fails minimum 4.5:1 contrast when the platform theme reduces accent brightness (`webapp/src/components/HomePanel.tsx:567`).

### Information Architecture & Shop
- Shop view nests three layers of tabs (main sections, star-pack sub-tabs, boost sub-tabs), each rendered in horizontal scroll containers without persistent breadcrumbs; users must rely on memory to know where they are (`webapp/src/components/ShopPanel.tsx:573`).
- Star pack section renders two consecutive “Совет” cards with identical copy, diluting the impact of contextual guidance and pushing the featured pack below the fold (`webapp/src/components/ShopPanel.tsx:652`).

### Feedback & Async States
- Passive income, prestige, and quest widgets share the same column with no progressive disclosure; the right column scrolls longer than the viewport on smaller devices before reaching “Next goal”, hurting task completion (`webapp/src/components/HomePanel.tsx:565`).
- Achievement modal fetches data only after it opens, but there is no optimistic skeleton; modal shows empty content while loading, causing perceived latency spikes (`webapp/src/screens/MainScreen.tsx:272`).

### Performance & Maintainability
- The home tap button stacks nested `motion` animations for glow, ripple, and hover; on lower-end devices Framer Motion rerenders every frame and triggers layout thrash, yet there is no frame-budget guard aside from a coarse `isLowPerformance` flag (`webapp/src/components/HomePanel.tsx:537`).
- UI store schedules toast dismissal with `setTimeout` but never clears the timer if a notification is removed manually, risking late-state updates and memory churn in long sessions (`webapp/src/store/uiStore.ts:52`).

## Medium-Risk Issues
- Admin monetisation screen defaults to RU locale formatters; international ops teams will see inconsistent decimals when the Telegram client locale differs, and there is no toggle (`webapp/src/screens/AdminMonetizationScreen.tsx:10`).
- Leaderboard CTA gating uses frequency caps but lacks explanatory copy when the CTA is hidden, making the panel feel empty once goals are met (`webapp/src/components/LeaderboardPanel.tsx:200`).

## Positive Differentiators to Preserve
- Quest flows respect 30-second fetch cooldowns to minimise API churn and include telemetry on failure pathways (`webapp/src/store/questStore.ts:43`).
- Toast notifications are screen-reader friendly (`aria-live="polite"`) and include keyboard-dismissable close buttons (`webapp/src/components/notifications/Toast.tsx:111`).

Keep these notes synced with production builds. When an item is resolved, move it to the archive template in `docs/archive/2025-10-30` alongside the previous analysis set.
