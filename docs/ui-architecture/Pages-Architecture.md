# Pages & Navigation Architecture

**Scope:** Frontend (`webapp/src`) – seven-tab Telegram Mini App
**Updated:** 2025-10-27

---

## 1. High-Level Flow

```
App.tsx
 ├─ MainScreenHeader (level/energy summary)
 ├─ MainScreen (tab router + scroll container)
 │   ├─ ScreenTransition (animations)
 │   ├─ Suspense + lazy-loaded tab panels
 │   └─ ScrollContainerContext (shared scroll ref)
 └─ TabBar (7 bottom-nav items)
```

- The entire UI lives inside one `MainScreen` instance; tab switches do **not** remount the app shell.
- `ScrollContainerContext` exposes the active scrollable element for panels that need imperative scrolling (`BuildingsPanel`, virtualization, FAB anchor calculations).
- Safe-area padding (top, bottom, left, right) is applied in two layers: the app shell (`App.tsx`) and per-tab padding (`MainScreen.tsx` for non-home tabs).

---

## 2. Data & Lifecycle Orchestration

| Concern | Owner | Trigger | Notes |
|---------|-------|---------|-------|
| Game bootstrap | `gameStore.initGame()` | Fired in `App.tsx` once auth is ready | Populates core stats, streaks, buildings.
| Catalog data | `catalogStore` | `ShopPanel`, `BoostHub`, `BuildingsPanel` mount and call `load*` actions | Lazy tabs fetch on demand.
| Prestige status | `MainScreen` `useEffect` | After initialization, refreshed when tab changes | Supplies prestige CTA in `HomePanel`.
| Leaderboard data | `MainScreen` `useEffect` | On auth ready and whenever leaderboard tab opens | Keeps `HomePanel` social proof fresh.
| Profile data | `MainScreen` `useEffect` | When profile tab becomes active | Avoids fetching until needed.

Each panel has its own skeleton + error boundary to keep the tab responsive even if a fetch fails.

---

## 3. Tab Composition

| Tab ID | Component | File | Layout Notes | Data Entry Points | Status |
|--------|-----------|------|--------------|-------------------|--------|
| `home` | `HomePanel` | `webapp/src/components/HomePanel.tsx` | Custom grid layout, safe-area aware padding inside component. Central tap CTA with Framer Motion. | `gameStore`, `catalogStore` (purchase insight), `boostHub` summary. | ✅ feature-complete, needs spacing alignment.
| `shop` | `ShopPanel` | `webapp/src/components/ShopPanel.tsx` | Flex column + token typography utilities. Section tabs handled with keyboard support. | `catalogStore` cosmetics + star packs. | 🟨 consistent spacing pending.
| `boosts` | `BoostHub` | `webapp/src/components/BoostHub.tsx` | Card list with timers; handles claim actions + notifications. | `catalogStore.loadBoostHub()`. | 🟨 needs shared layout wrapper.
| `builds` | `BuildingsPanel` | `webapp/src/components/BuildingsPanel.tsx` | `react-virtuoso` for infinite list; purchase/upgrade CTA with haptics. | `gameStore` buildings, `catalogStore` catalog. | 🟨 ensure virtualization plays well with new layout surface.
| `leaderboard` | `LeaderboardPanel` | `webapp/src/components/LeaderboardPanel.tsx` | Responsive card + table view, motion highlight for current user. | `gameStore.loadLeaderboard()`. | 🟨 unify spacing + typography tokens.
| `profile` | `ProfilePanel` | `webapp/src/components/ProfilePanel.tsx` | Card grid for stats, optional sections for bio/boosts. | `gameStore.loadProfile()`. | 🟥 waiting for layout wrapper + keyboard review.
| `settings` | `SettingsScreen` | `webapp/src/components/settings/SettingsScreen.tsx` | Sections with toggles, sliders, CTA. | `preferencesStore`, `gameStore.logoutSession()`. | 🟥 align with new spacing utilities and focus styles.

Status legend: ✅ solid · 🟨 needs refactor · 🟥 tech debt.

---

## 4. Animations & Transitions

- `ScreenTransition` offers `fade` (home) and `slide` (other tabs) with 0.3–0.4 s curves. Keep within Telegram Mini App recommendations (<=400 ms cross-fade).
- `Button` components rely on Framer Motion for hover/tap micro-interactions and haptic cues (`useHaptic`). Ensure new layout components do not wrap them in scroll containers that block pointer events.

---

## 5. Identified Gaps

1. **Duplicated layout math:** Non-home tabs manually compute padding inside `MainScreen` and inside each panel. Introduce `TabPageSurface` (see `Quick-Start.md`).
2. **Spacing tokens not enforced:** Tailwind utilities use numeric steps (`gap-4`, `px-4`). Map them to semantic token utilities so spacing can be tuned centrally.
3. **Accessibility drift:** Keyboard support is solid in Shop and Settings but lacks consistent focus outlines and ARIA labelling in Profile/Boosts.
4. **Analytics coverage:** Toasts and haptics fire for most async actions, but events such as leaderboard view toggles lack telemetry parity.

Track each item through the roadmap in `README.md` and mark completion with commit references.
