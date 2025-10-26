# Main Container (`MainScreen`)

- **Element ID**: `MainScreen` root `<div className="flex flex-col w-full h-full relative overflow-hidden flex-1">`
- **Source**: `webapp/src/screens/MainScreen.tsx:138`
- **Role**: Hosts navigation tabs and the active panel inside the Telegram WebApp viewport.

## Implementation Snapshot
- Uses `ScrollContainerContext` to expose the scrollable node to descendants.
- Applies safe-area aware padding via `useSafeArea()` for bottom inset.
- Lazy-loads heavy panels (`ShopPanel`, `BoostHub`, etc.) behind `Suspense`.
- Tab meta copied from `TAB_META` constant (no localisation abstraction).

## Checklist Findings
- **Safe Areas & Layout**: Scroll padding bottom combines tab bar reserve + safe area, matching Telegram guidance on bottom insets. However there is no explicit handling for horizontal safe-area on landscape screens, so content may touch edges on iPhone landscape. **Severity: Medium**
- **Theme Compliance**: Relies on CSS custom properties (e.g. `--color-text-primary`) consistent with Telegram theme variables; ensure theme tokens map to `--tg-theme-*` upstream. **Severity: Low**
- **Scroll Behaviour**: `overflow-y-auto` container resets scroll on tab switch, but `ScreenTransition` children may internally own their own scroll (e.g., Virtuoso). Need to confirm nested scrollbars stay in sync when the main container scrolls. **Severity: Low**
- **Accessibility**: `role="tabpanel"` and `aria-labelledby` wired, but the outer scroll container lacks `role="main"` or landmarks, making screen reader navigation harder. **Severity: Medium**
- **Performance**: Lazy loading reduces bundle size; consider preloading non-home tabs after idle to prevent blank skeleton loops on slow connections. **Severity: Low**

## Interaction & API Coverage
- Tab switching handled by `onTabChange`, with `TabBar` dispatching ID strings. No debounce; acceptable for navigation.
- Floating “Back to Tap” button uses `motion.button` with `onClick` that alters tab and triggers `scrollToTop(true)`; ensure Framer Motion exit animations do not conflict with Telegram low-power devices.
- Needs QA across mini-app heights (50%, 70%, full) as the fixed bottom tab bar plus floating FAB might overlap in compact mode. Queue manual test.

## Issues & Risks
1. **Missing Landmark**: Add `role="main"` or `aria-label` describing the primary content region to satisfy accessibility checks. **Severity: Medium**
2. **Landscape Padding Gap**: Horizontal insets from `useSafeArea().safe.left/right` unused; may lead to clipped content with keyboard or on folding devices. **Severity: Medium**
3. **Skeleton Loop Risk**: When `Suspense` fallback returns skeletons, repeated tab toggles can mount/unmount heavy components causing jank (need to profile). **Severity: Low**

## Opportunities & Follow-ups
- Preload the next-most-used tab on idle using `prefetch` patterns.
- Expose telemetry when users bounce between tabs to study navigation friction.
- Consider splitting tab metadata into localisation file to ease translation.
