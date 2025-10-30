# Current Pages Analysis

**Audit Date:** 2025-10-27
**Evaluated Source:** `webapp/src/components`, `webapp/src/screens/MainScreen.tsx`

---

## 1. Overview Table

| Tab | Component | Strengths | Issues / Debt | Immediate Actions |
|-----|-----------|-----------|---------------|-------------------|
| Home | `HomePanel.tsx` | Rich data viz, responsive grid, haptic feedback, safe-area aware padding. | Padding defined inline (`panelPadding`) with hard-coded `12px`/`TAB_BAR_RESERVE_PX`; no shared surface. | After `TabPageSurface`, drop manual padding and adopt spacing tokens for stat grid.
| Shop | `ShopPanel.tsx` | Keyboard-accessible tabs, highlight card for featured pack, reuse of `Card` & `Button`. | Mix of `gap-4`, gradient backgrounds, and inline `style={panelPadding}`. Notification copy partly hard-coded. | Swap spacing classes to token utilities; migrate to shared surface; document notification strings for localization.
| Boosts | `BoostHub.tsx` | Timers auto-refresh every second, success/error toasts consistent. | Inline `setInterval` without cleanup guard for empty arrays; repeated layout pattern. | Keep cleanup (already returns `clearInterval`) but move padding to layout surface; add ARIA labels for multiplier buttons.
| Buildings | `BuildingsPanel.tsx` | `react-virtuoso` virtualization, bulk purchase logic, haptics. | Uses array of purchase options without token spacing; button groups rely on default spacing. | After spacing bridge, update classnames; ensure virtualization container receives new wrapper ref.
| Leaderboard | `LeaderboardPanel.tsx` | Motion highlight for user row, responsive table, error/skeleton states. | Table padding uses literal `[14px]`; focus styles limited. | Replace `[14px]` with token-based classes; add `aria-sort`/`scope` attributes for columns.
| Profile | `ProfilePanel.tsx` | Simple cards, optional sections, uses `Badge`. | Grid layout uses `gap-3`, lacks keyboard/focus cues. | Adopt tokens; add focusable controls if profile actions introduced later.
| Settings | `settings/SettingsScreen.tsx` | Comprehensive keyboard controls, haptic cues, toggles. | Layout duplicates spacing utilities; confirm focus ring after Tailwind update. | Migrate to shared surface; audit notifications on destructive actions.

---

## 2. Safe-Area & Scroll Behaviour

- Non-home tabs rely on `MainScreen.tsx` to set `paddingTop` (`HEADER_RESERVE_PX + safeArea.content.top`) and `paddingBottom` for FAB spacing.
- Panels themselves often apply additional padding, leading to double spacing on devices with large insets.
- **Action:** Once `TabPageSurface` is live, remove per-panel padding styles and rely on the wrapper.

---

## 3. Performance Notes

| Area | Observation | Plan |
|------|-------------|------|
| Lazy loading | All non-home tabs are `lazy()` imports wrapped in Suspense (good). | Keep skeletons lightweight (<1 KB). Consider preloading Shop/Boosts after app idle.
| Virtual lists | `BuildingsPanel` uses `react-virtuoso` with `ScrollContainerContext`. | Verify new layout wrapper forwards the scroll ref; add regression test to catch accidental re-mounts.
| Animations | `ScreenTransition`, `Button`, and `BuildingCard` animate via Framer Motion. | Ensure additional wrappers do not introduce layout thrash; throttle scroll listeners already using `requestAnimationFrame`.

---

## 4. Analytics & Feedback Coverage

| Scenario | Current Behaviour | Gap |
|----------|-------------------|-----|
| Tap spam / rate limit | Toast + `tap_error` event logged. | ✅
| Boost claim | Logs success/error, haptic feedback. | ✅
| Shop purchase | Success toast, handles 409 conflicts. | Missing telemetry for tab switch (log `shop_tab_change`).
| Leaderboard view | No event when leaderboard tab opens besides data fetch. | Add `leaderboard_view` + metadata (rank, entries loaded).
| Settings changes | Haptic only; some toggles lack toast. | Decide whether to surface success toasts or rely on haptics only.

---

## 5. Backlog Snapshot

- [ ] Implement spacing token classes across all panels (start with Shop → Boosts → Profile).
- [ ] Introduce telemetry for leaderboard visibility and settings toggles.
- [ ] Add ARIA labelling to boost claim buttons and leaderboard tables.
- [ ] Document localization-ready copy for all toasts (centralize in `content/` when translation pipeline arrives).

Update this file as work completes—include commit IDs next to closed items (e.g., `[done in 3f4a1b7]`).
