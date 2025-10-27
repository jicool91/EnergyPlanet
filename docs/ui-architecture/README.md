# Energy Planet UI Architecture

**Scope:** webapp (`webapp/src`) – Telegram Mini App client
**Maintainers:** Frontend guild & design systems squad
**Updated:** 2025-10-27

---

## 1. Current Architecture Snapshot

- **App Shell (`webapp/src/App.tsx`):** Owns Telegram safe-area padding, tab state, modal stack, telemetry bootstrap, and orchestrates `MainScreen` plus global chrome (`MainScreenHeader`, `TabBar`).
- **Main Screen (`webapp/src/screens/MainScreen.tsx`):** Single routed surface containing seven tab panels rendered via `ScreenTransition`, sharing a scroll container (`ScrollContainerContext`) and safe-area aware padding. Data comes from `gameStore`, `catalogStore`, and `authStore`.
- **Design System Layer:** CSS custom properties in `webapp/src/styles/design-tokens.css` + Tailwind config (`webapp/tailwind.config.js`) expose colors, shadows, typography, and safe-area spacing. Components consume tokens via CSS vars (e.g., `Card`, `Button`, `Badge`).
- **Performance Patterns:** Heavy tabs (`BuildingsPanel`, `ShopPanel`, `BoostHub`, etc.) are lazy loaded, while large lists use virtualization (`react-virtuoso` in `BuildingsPanel`). Skeleton components provide perceived performance.
- **State Management:** Zustand stores split across gameplay (`gameStore`), catalog (`catalogStore`), auth (`authStore`), and UI (`uiStore`, `preferencesStore`). Panels subscribe selectively with `shallow` comparison to limit re-renders.

---

## 2. Strengths Worth Preserving

| Area | What Works | Notes |
|------|------------|-------|
| Safe-area handling | `useSafeArea` + CSS vars keep content usable across Telegram browsers. | Mirrors Telegram Mini App guidelines for expanded mode and dynamic viewport changes.
| Component library | `Card`, `Button`, `Badge`, skeletons, and notifications provide cohesive look & feel with haptics and telemetry hooks. | Already integrated across most panels.
| Data orchestration | Lazy loading + Suspense ensures first meaningful paint remains fast; each tab handles its own loading/error states. | Keep `ScreenTransition` animation budget aligned with 300–400 ms guidance.
| Theme awareness | CSS tokens respect Telegram theme params delivered via `@tma.js/sdk`. | Night mode parity already validated in QA runs.

---

## 3. Focus Areas & Roadmap

| Theme | Goal | Why it Matters | Target Sprint |
|-------|------|----------------|---------------|
| **Spacing & scale alignment** | Map Tailwind spacing utilities to `--spacing-*` tokens and replace hard-coded `gap-3/gap-4` with semantic utilities. | Unlock global spacing tweaks without hunting classes. | Week 45 2025
| **Page surfaces** | Introduce shared layout primitives (`TabPageSurface`, `SectionSurface`) wrapping safe-area padding, scroll behaviour, and spacing. Refactor non-home tabs to use them. | Remove repeated `px-4`/`pb-4` code, make animations consistent. | Week 46 2025
| **Accessibility & input** | Standardize focus rings, ARIA labelling, and keyboard flows across tabs (Shop filters, Settings toggles). | Reach Telegram Mini App accessibility checklist baseline. | Week 47 2025
| **Telemetry & UX signals** | Centralize UI event logging (tap errors, boost claims, store purchases) with structured payloads and success/error parity. | Provide product analytics for design system ROI tracking. | Week 48 2025

Status legend: 🟩 shipped · 🟨 in progress · 🟥 not started. Update table each sprint.

---

## 4. Next Step Checklist (short term)

- [ ] Bridge CSS spacing tokens into Tailwind (`tailwind.config.js`) and replace one representative panel (`ShopPanel`) spacing utilities.
- [ ] Draft `TabPageSurface` component encapsulating `ScrollContainerContext` padding rules; pilot on `ProfilePanel`.
- [ ] Audit keyboard interactions for Shop category tabs and Settings toggles; document gaps.
- [ ] Review haptic + toast coverage to ensure every async button surfaces success/failure consistently.

Mark completed items with commit hashes when done.

---

## 5. Changelog

- **2025-10-27:** Rebuilt documentation to reflect actual architecture, added actionable roadmap, aligned with Telegram Mini App safe-area guidance, and queued spacing/layout workstreams.

Keep this section short and focused on structural changes.
