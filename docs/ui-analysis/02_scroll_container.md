# Scroll Container (`MainScreen` Inner Scroll)

- **Element ID**: `<div ref={handleScrollContainerRef} className="flex flex-col overflow-y-auto flex-1 min-h-0 relative">`
- **Source**: `webapp/src/screens/MainScreen.tsx:145`
- **Role**: Provides vertical scrolling for all tab content while sharing ref via `ScrollContainerContext`.

## Implementation Snapshot
- Scroll handler toggles `isScrolled` state for floating “Back to Tap” button visibility.
- Inline style adds bottom padding equal to tab bar reserve + safe inset.
- `useScrollToTop` hook exposes `scrollRef` and `scrollToTop`, enabling tab resets.

## Checklist Findings
- **UX Compliance**: Maintains `min-h-0` and flex to avoid layout collapse; matches Telegram requirement to handle dynamic viewport shrink on keyboard open. **Severity: Low**
- **Accessibility**: No `aria` labelling for scroll region; consider `aria-label="Основной контент"` or hooking up `role="region"` to announce to screen readers. **Severity: Medium**
- **Performance**: Scroll handler updates state on every scroll event; consider throttling to 16ms using `requestAnimationFrame` to avoid re-renders on long lists (especially when `Virtuoso` is mounted). **Severity: Medium**
- **Nested Scroll Conflicts**: Child panels like `BuildingsPanel` mount `Virtuoso`, which expects its own scroll parent. `ScrollContainerContext` passes the node, but ensure virtualization uses `customScrollParent` (currently not passed—`Virtuoso` may default to window). Need verification. **Severity: High** (potential virtualization malfunction).

## Interaction & API Coverage
- `scrollToTop(true)` ensures smooth scroll for the Back-to-Tap action; verify Telegram built-in navigation gestures don’t conflict (test on Android back swipe).
- On tap switches, `useEffect` resets `scrollTop` to zero when returning to `home`; ensure this doesn’t break when `scrollContainer` is null (e.g., during Suspense fallback).

## Issues & Risks
1. **Virtuoso Parent Binding**: `BuildingsPanel` obtains context but does not pass `scrollParent` to `Virtuoso` as `customScrollParent`, causing fallback to the window and ignoring safe padding. Update component to use `ScrollContainerContext`. **Severity: High**
2. **Scroll Handler Thrashing**: `setIsScrolled` triggers React render for every 1px move; add throttle or `useState` guard to reduce updates. **Severity: Medium**

## Opportunities
- Instrument scroll depth analytics to measure Discoverability of lower content.
- Provide a gradient fade at bottom to hint there is more content per Telegram UI heuristics.
