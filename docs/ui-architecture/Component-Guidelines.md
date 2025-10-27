# Component Guidelines

**Scope:** Shared UI components under `webapp/src/components` (+ subfolders)
**Updated:** 2025-10-27

---

## 1. Layout & Navigation

| Component | File | Purpose | Key Props | Notes |
|-----------|------|---------|-----------|-------|
| `MainScreenHeader` | `components/MainScreenHeader.tsx` | Displays level, XP, energy, quick shortcuts to Shop/Settings. | `level`, `energy`, `xpProgress`, callbacks. | Sticks to top; relies on safe-area padding from `App.tsx`.
| `ScreenTransition` | `components/ScreenTransition.tsx` | Wraps tab content with fade/slide animations. | `type` (`fade`/`slide`/`slide-right`). | Keep duration within 0.3–0.4 s; do not nest multiple transitions.
| `TabBar` | `components/TabBar.tsx` | Bottom navigation with 7 tabs. | `tabs`, `active`, `onChange`. | Already keyboard accessible; ensure icons have accessible labels.
| *(Planned)* `TabPageSurface` | `components/layout/TabPageSurface.tsx` (to be added) | Shared wrapper for non-home tabs (safe-area padding, spacing). | `insetTop`, `className`. | Introduce as part of spacing alignment initiative.

---

## 2. Content Surfaces

| Component | Purpose | Patterns | ToDos |
|-----------|---------|----------|-------|
| `Card` (`components/Card.tsx`) | Standard surface with variants (`default`, `elevated`, `outlined`) and highlight badge. | Consume CSS vars for colors/shadows; add `card-interactive` when clickable. | Standardize padding via spacing tokens once Tailwind bridge lands.
| `Button` (`components/Button.tsx`) | CTA with variants (`primary`, `secondary`, `success`, `danger`, `ghost`), motion + haptics. | Use `class-variance-authority` for variants; success/error states trigger haptics + toasts. | Ensure loading/success states used for every async CTA.
| `Badge` (`components/Badge.tsx`) | Status pill for cards / tables. | Lightweight, tailwind classes only. | Add semantic variants (info/warning) if product requests.
| `Section` family | `SettingsSection`, `StatCard`, `XPProgressCard`, skeletons. | Provide consistent headings and spacing. | Align to new surfaces once `TabPageSurface` shipped.

---

## 3. Data-Rich Panels

| Panel | File | Key Dependencies | UX Notes |
|-------|------|------------------|----------|
| `HomePanel` | `components/HomePanel.tsx` | `useDevicePerformance`, `useSafeArea`, `useNotification`. | Central tap CTA – keep pointer events optimized; uses `Button` for prestige path. Consider migrating static padding to tokens.
| `ShopPanel` | `components/ShopPanel.tsx` | `catalogStore`, `Button`, `Card`, `Badge`. | Keyboard navigation already implemented. Needs spacing refactor and potential `SectionSurface` extraction.
| `BoostHub` | `components/BoostHub.tsx` | `catalogStore`, `useNotification`, `Button`. | Timer updates via `setInterval`. Remember to clear interval on unmount.
| `BuildingsPanel` | `components/BuildingsPanel.tsx` | `react-virtuoso`, `useGameStore`, `useCatalogStore`. | Ensure virtualization container inherits scroll parent. When adding layout wrapper, pass `scrollParent` from `ScrollContainerContext`.
| `LeaderboardPanel` | `components/LeaderboardPanel.tsx` | `framer-motion`, `Card`. | Responsive table – keep column widths via padding tokens.
| `ProfilePanel` | `components/ProfilePanel.tsx` | `useGameStore`. | Needs keyboard focus and spacing cleanup.
| `SettingsScreen` | `components/settings/SettingsScreen.tsx` | `preferencesStore`, `Button`, `Toggle`, `SliderControl`. | Already handles keyboard arrows; ensure focus outlines visible after spacing updates.

---

## 4. Async Feedback & Haptics

- Notifications: `useNotification` surfaces success/warning/error toasts. All asynchronous buttons should provide feedback through this hook plus haptic cues (`useHaptic`).
- Logging: Use `logClientEvent` for critical interactions (tap errors, boost claims, purchases). Maintain parity between success and error branches for analytics accuracy.
- Sound: `BuildingCard` uses `useSoundEffect` for unlock events; consider centralizing if more cards adopt audio cues.

---

## 5. Implementation Playbook

1. **Use tokens first:** Favor CSS variables (`var(--color-text-primary)`) over hard-coded values. When Tailwind utilities do not exist yet, create temporary inline styles and log a TODO.
2. **Keep keyboard paths:** If adding new interactive elements, wire `onKeyDown` handlers similar to existing tabs (see `ShopPanel` for reference) and honour `focus-ring` utility.
3. **Respect virtualization:** When wrapping panels, ensure virtualization libraries (`react-virtuoso`) receive the correct scroll container via context.
4. **Update docs while coding:** Add component-specific notes or checklists here in the same PR to keep documentation evergreen.

---

## 6. Outstanding Todos

- [ ] Create `TabPageSurface` and migrate non-home panels.
- [ ] Normalize `Card` padding/spacing once Tailwind exposes `gap-md`, `px-lg`, etc.
- [ ] Add accessible names to TabBar icons (ARIA `aria-label`).
- [ ] Document example compositions (Home dashboard, Shop hero) once spacing refactor lands.
