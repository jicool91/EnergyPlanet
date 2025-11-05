# Energy Planet UI & Design Review (2025-11-05)

## Scope & References
- Code snapshot: `webapp/` React 19.2 + Vite build dated 2025-10-27.
- Telegram Mini Apps official docs: [Platform Guidelines](https://docs.telegram-mini-apps.com/platform/design-guidelines), [Safe Areas & Viewport](https://core.telegram.org/bots/webapps#safe-areas), [Main Button](https://docs.telegram-mini-apps.com/platform/advanced-topics/main-button), [Theme Parameters](https://docs.telegram-mini-apps.com/platform/advanced-topics/theme).
- React official docs (React 19): [Application Layout](https://react.dev/learn), [Suspense for Data Fetching](https://react.dev/reference/react/Suspense), [startTransition](https://react.dev/reference/react/startTransition), [useEffectEvent](https://react.dev/reference/react/useEffectEvent), [Strict Mode Effects](https://react.dev/reference/react/StrictMode).

## High-Level Observations
- Strong, consistent dark theme with Tele­gram theme params mapped to design tokens (`index.css`, `tokens.css`).
- Layout respects safe-area insets via `useSafeArea` + CSS variables; navigation remains touch-friendly.
- Components lean on motion/feedback (Framer Motion, haptics) to reinforce game feel.
- Multiple network-bound `useEffect` blocks fire on mount; StrictMode double-invocation is handled, but concurrency constraints need review.
- Accessibility, reduced-motion, and localization guardrails are not yet on par with flagship Telegram mini apps.

## Priority Findings & Recommendations

### 1. Safe-area & viewport listeners leak on bootstrap (High)
**Where:** `webapp/src/main.tsx:24-47`

`onTmaSafeAreaChange` / `onTmaViewportChange` are invoked with `noop`, but their unsubscribe callbacks are not retained. Every hot reload or navigation rebinds new listeners, eventually duplicating DOM writes and causing layout jank. Telegram SDK docs call out the need to detach listeners once a component unmounts.

**Ref:** Telegram docs “Safe Areas & Viewport” stress removing listeners via the disposer returned from `viewport.state.sub`.

**Fix:** Capture the returned disposers and tear them down during hot reload / module dispose. In practice, wrap setup in a module-level lifecycle (e.g. `if (import.meta.hot) { import.meta.hot?.dispose(() => offSafe(); offViewport(); ) }`). Also drop the `noop` subscription once `useSafeArea` hydrates state in React.

### 2. Main button state lacks lifecycle parity (High)
**Where:** `webapp/src/services/tma/mainButton.ts`

Official Mini Apps guidance requires that custom buttons synchronize with the native MainButton lifecycle: hide on navigation, avoid leaving loaders visible, and respond to theme changes. The current helper never applies Telegram’s dynamic theme colors, and `mainButton.hideLoader()` is executed even when no loader is active, breaching the “no-op” expectation in Telegram SDK reference.

**Fix:**
- Pull `themeParams` (already mounted in `core.ts`) and default to `themeParams.buttonColor` / `buttonTextColor` when options omit overrides.
- Guard `hideLoader()` / `hide()` behind `mainButton.hasLoader()` / `mainButton.isVisible()` checks to avoid redundant bridge calls.
- Ensure `withTmaMainButton` auto-hides on route change by pairing with React Router effects (Telegram docs recommend calling `MainButton.hide()` in `useEffect` cleanup).

### 3. Reduced-motion + haptics accessibility gap (Medium)
**Where:** `Button.tsx`, `TapCircle`, `useHaptic`

React accessibility guidance and WCAG 2.3 recommend respecting `prefers-reduced-motion` and disabling non-essential animation/haptics. Framer Motion animations have no guard, and haptic feedback fires on every tap even when the OS requests reduced motion.

**Fix:** Utilize `window.matchMedia('(prefers-reduced-motion: reduce)')` before enabling `whileHover`, `whileTap`, and haptic feedback. React docs’ “Managing Non-Blocking Updates” section suggests reading user settings once per mount. Expose a `useMotionPreferences` hook and gate animations/haptics accordingly.

### 4. Color contrast regression paths (Medium)
**Where:** `PurchaseInsightCard` (`TapScreen.tsx`), `FriendsList`

Accent cyan/magenta token variants overlay translucent backgrounds that slip below Telegram’s recommended contrast (minimum 4.5:1) when rendered on AMOLED devices. The `contrast` Playwright script covers base theme only.

**Fix:** Expand `npm run test:contrast` to iterate both palette variants and light mode fallback. Adjust gradient overlays or text colors to hit contrast ratios documented in Telegram design guidelines (“Avoid low-contrast text”).

### 5. Localization & typography scaling (Low)
**Where:** Multiple screen headers (`FriendsScreen`, `TapScreen`).

Headers lock font sizes via Tailwind utilities, ignoring Telegram’s dynamic font scaling recommendations. Long translations (e.g., German) will truncate inside fixed-width CTA buttons.

**Fix:**
- Adopt relative units tied to the typography tokens (e.g., clamp + `calc(var(--font-heading) * var(--tg-text-size-scale, 1))`).
- Provide overflow strategies (`text-balance`, `text-wrap: balance`) and allow button labels to wrap.

## Additional Notes
- **Suspense Fallback:** The loading fallback inline `<div>` should be promoted to a shared skeleton component for consistency. React Suspense docs advise keeping fallbacks visually similar to resolved UI.
- **startTransition Usage:** Transitioning tab navigation is good; consider logging navigation metrics after transition completes to match React guidance on avoiding work inside transitions that blocks paint.
- **Experiment Palette:** `ensureExperimentVariant` randomizes palette each mount. Cache assignment per user (e.g., via `localStorage`) to avoid flicker that Telegram guidelines flag as “avoid sudden theme changes”.
- **Skeleton States:** `FriendsList` pulse skeleton lacks `aria-busy`. Add `role="status"` + `aria-live="polite"` per React accessibility docs.

## Suggested Next Steps
1. Implement listener lifecycle fixes in `main.tsx` and verify via Vite hot reload + Telegram in-app reload.
2. Extend `withTmaMainButton` to pull defaults from `themeParams`, add visibility guards, and integrate with router cleanup.
3. Introduce `useMotionPreferences` to gate Framer Motion + haptic feedback, covering all motion-heavy components.
4. Re-run contrast checks across palette variants; adjust gradients/tokens until Playwright audit passes.
5. Audit typography scaling in Russian + English + German locales, adjusting Tailwind utilities to respect Telegram font scaling tokens.

## Appendix: File Touchpoints
- `webapp/src/main.tsx`
- `webapp/src/services/tma/mainButton.ts`
- `webapp/src/hooks/useHaptic.ts`
- `webapp/src/components/Button.tsx`
- `webapp/src/screens/TapScreen.tsx`
- `webapp/src/components/friends/FriendsList.tsx`
