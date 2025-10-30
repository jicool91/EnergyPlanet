# 02 · Recommendations & Roadmap

This plan ties the audit gaps back to industry guidance so we can iterate with focus.

## Priority A · Accessibility & Navigation (Sprint-ready)
1. Replace emoji-only tab icons with tokens from the design system and add keyboard arrow handlers on the tab bar (`webapp/src/components/TabBar.tsx:69`). This aligns with the accessibility audit emphasis on recognisable controls and keyboard parity. citeturn2search1
2. Hide or demote the inactive “Clan” tab until content ships, and redistribute navigation labels based on critical tasks (Tap, Shop, Boosts, Profile). Clear wayfinding reduces overload as recommended for navigation-heavy products. citeturn2search3

## Priority B · Home Loop Clarity (Design & Frontend pair)
3. Rebalance the hero area: reserve the top fold for energy CTA + streak badge, move passive/boost insights into collapsible accordions, and trim uppercase microcopy to sentence case (aim for 48–60 characters per line). Better hierarchy improves scannability and reduces cognitive load. citeturn2search3
4. Convert glow/ripple animations to CSS transforms backed by `prefers-reduced-motion`, and throttle Framer Motion timelines on low FPS devices (`webapp/src/components/HomePanel.tsx:537`). Calibrated micro-interactions keep the experience delightful without harming performance. citeturn3search0

## Priority C · Shop Restructuring (Cross-functional)
5. Collapse redundant “Совет” cards into one contextual helper and surface a breadcrumb chip or sticky header that reflects the current star-pack subsection (`webapp/src/components/ShopPanel.tsx:652`). Pair this with metrics tracking of tab bounce rate to validate the change. Grouping and prioritising findings into actionable clusters is key to moving fast. citeturn2search5
6. Define KPI baselines for shop conversion, quest completion, and boost activation before shipping UI adjustments. Instrument GA4 dashboards + Mixpanel funnels so the team can measure delta after each iteration. citeturn2search6

## Priority D · Async & Feedback Hygiene (Follow-up)
7. Add skeleton or shimmer states to the Achievements modal while `loadAchievements` resolves (`webapp/src/screens/MainScreen.tsx:272`). Apply the same pattern to any modal that fetches on open to avoid blank canvases. citeturn2search0
8. Update notification teardown to clear outstanding timers when users dismiss toasts early (`webapp/src/store/uiStore.ts:52`). This keeps the UI store leak-free over multi-hour sessions and honours stability heuristics. citeturn2search6

## Research Backlog Hooks
- Schedule a pluralistic walkthrough across Tap → Shop → Prestige flows to validate that the new hierarchy supports player goals. Capture qualitative quotes and feed them into the research log. citeturn2search16
- After the redesign, run targeted accessibility testing with screen-reader users to confirm WCAG 2.2 AA parity; automation alone will not surface fit-and-finish regressions. citeturn2search1

Each item should receive an owner, target release, and success metric before entering the sprint. Track progress in Linear and reference this file inside the ticket description.
