# Telegram Fullscreen Status Bar Playbook for Energy Planet

Last updated: 2025-11-06 (Pacific morning).
Owner: UI Platform pod — Telegram Mini App squad.
Scope: Align the in-app status bar with Telegram fullscreen UX so that Energy Planet stays compliant and flicker-free.
Audience: frontend engineers, designers, QA, and release managers.
Document length target: ≥500 lines as requested; do not trim without notifying the author.
Status tracking: log deltas in docs/changelog.md when major steps move to Done.
Related tickets: TMA-231 “Fullscreen safe area”, TMA-268 “Status bar polish”, TAP-901 “Mini App QA grid”.
Dependencies: Telegram Mini App runtime ≥ v8.0, `@tma.js/sdk` 3.x, `@tma.js/sdk-react` 3.0.8, React 19.
Environment baseline: Telegram iOS 10.6, Android 10.6, Desktop 5.6, Web K.495, QA bots `energy_planet_bot` / `energy_planet_stage_bot`.
Fallback plan: degrade gracefully to non-fullscreen bottom-sheet layout when viewport APIs unavailable.
---

## Table of Contents
- 1. Context and problem statement
- 2. Telegram contracts and official expectations
- 3. Repository touchpoints and current behavior
- 4. Pain points observed in Energy Planet builds
- 5. Implementation blueprint by phase
- 6. CSS, tokens, and safe-area math
- 7. React + TMA runtime integration details
- 8. Visual design spec for the top system zone
- 9. Device and scenario validation matrix
- 10. File-by-file action checklist
- 11. Telemetry, logging, and debugging
- 12. QA exit criteria and review gates
- 13. Future enhancements and open questions
- 14. Glossary, commands, and resources
- 15. References

---

## 1. Context and problem statement (2025-11-06)
1.1 Energy Planet now ships as a fullscreen-first Telegram Mini App, which means Telegram renders native close, back, and menu controls on top of our WebView.
1.2 Several QA videos show the in-app status strip overlapping Telegram-native buttons because our safe-area offsets assume a bottom sheet rather than a fully detached canvas.
1.3 The current header component draws a bordered capsule even when Telegram hides its own chrome; that contrast ring reads as a “second status bar” on OLED screens.
1.4 Telegram’s 2024-11 update introduced expanded gesture regions, making it more critical to defer to `safeAreaInsets` data for every frame.[ref-viewport]
1.5 We also rely on `@tma.js/sdk` for viewport + theme; we must re-validate that our CSS variables stay in sync once fullscreen toggles occur.[ref-tma-sdk]
1.6 Designers asked for a consolidated playbook so that future screens (events, admin metrics) never regress and so that contractors can reuse the same patterns.
1.7 This document encodes both the upstream requirements and the exact files, stores, and CSS hooks inside `/webapp` that must be touched.
1.8 Deliverable: implementable guidelines plus verification grid so dev, QA, and design sign off before the next build hits production.
1.9 Non-goals: editing backend controllers, altering business logic, or shipping new monetization flows; focus stays on layout and runtime integration.
1.10 All action items below assume we keep Prettier + ESLint defaults and TypeScript strict mode intact.

---

## 2. Telegram contracts and official expectations (summaries + deltas)
2.1 Viewport fundamentals — Telegram defines `width`, `height`, `stableHeight`, `isExpanded`, and `isFullscreen` as canonical values. Apps must avoid anchoring to `window.innerHeight` when a BottomSheet is mid-drag.[ref-viewport]
2.2 Safe areas — two sets of insets exist: `safeAreaInsets` (device cutouts) and `contentSafeAreaInsets` (Telegram chrome). Always reserve both before drawing UI under the system strip.[ref-viewport-sdk]
2.3 Expansion API — `web_app_expand` should be issued once the app is ready so Telegram removes the blurred background and gives us the tallest possible sheet. This call is idempotent but should be debounced.[ref-viewport]
2.4 Fullscreen API — `web_app_request_fullscreen` / `web_app_exit_fullscreen` (and their `viewport.requestFullscreen` wrappers) require Mini Apps v8.0+. Handle promise rejections gracefully because Telegram can deny the request if gestures are active.[ref-viewport-sdk]
2.5 Orientation lock — `web_app_toggle_orientation_lock` can stabilize the viewport during high-motion sequences but should be reset right after to respect OS expectations.[ref-methods]
2.6 Events — `safe_area_changed` publishes the new inset quadruple whenever Telegram rearranges its chrome, e.g., orientation change or PiP mode. Subscribe via SDK plus fallback `Telegram.WebApp.onEvent` for resilience.[ref-events]
2.7 Viewport change events — `viewport_changed` shares `height`, `is_expanded`, `is_state_stable`. Telegram warns not to animate to the raw `height` because the event rate is low; rely on `stableHeight` for layout tokens.[ref-events]
2.8 Theme synchronization — `themeParams` may update mid-session (user toggles dark mode). Telegram expects `setHeaderColor` + `setBackgroundColor` to reflect the same palette as the header to avoid flashing bars.[ref-viewport]
2.9 Header APIs — `setHeaderColor`, `setBackgroundColor`, and `setBottomBarColor` should be invoked through `miniApp` for typed errors; fallback to legacy `window.Telegram.WebApp` calls when running outside the SDK (Storybook).
2.10 Motion + sensors — fullscreen apps can opt into motion tracking; ensure we gate animations via `viewport.isFullscreen` markers before enabling gyroscope so the OS knows we are immersive.[ref-telegram-tips]
2.11 React SDK bindings — `@tma.js/sdk-react` exposes providers/hooks to avoid manually attaching event listeners; when possible prefer them over custom wrappers to keep parity with upstream updates.[ref-sdk-react]
2.12 Policy reminder — Telegram reserves the right to yank fullscreen privileges if the app renders controls too close to the corners or hides the native close button. Respect at least 16 px distance from `contentSafeAreaInsets` at all times.[ref-viewport]

### 2.1 Quick compliance checklist
- [ ] Call `miniApp.ready()` once UI skeleton mounted (already in `services/tma/core.ts`).
- [ ] Call `viewport.expand()` right after initialization (already wrapped in `core.ts`, verify logs).
- [ ] Listen to `safe_area_changed` and `viewport_changed` via SDK plus native fallback.
- [ ] Update CSS vars every time we read new insets; never cache raw numbers in React state without syncing to document root.
- [ ] Use `miniApp.setHeaderColor` / background setter whenever theme tokens change.
- [ ] Ensure fullscreen toggles update state stores so we can adjust layout (status bar hides).
- [x] Provide manual close/back affordance only if Telegram hides its own buttons (desktop web).

---

## 3. Repository touchpoints and current behavior overview
The following table enumerates every file that currently participates in safe area, fullscreen, or status-bar behavior.

| Layer | Path | Key responsibility | Notes |
| --- | --- | --- | --- |
| SDK bootstrap | `webapp/src/services/tma/core.ts:1-78` | Initializes `@tma.js/sdk`, mounts viewport/theme/miniApp, calls `miniApp.ready()`. | Already expanding viewport and disabling vertical swipe. |
| Viewport math | `webapp/src/services/tma/viewport.ts:60-138` | Writes `--tg-*` CSS vars, caches safe areas, exposes fullscreen helpers. | Needs doc for why HEADER_BUFFER_PX exists to avoid duplicate margins. |
| Theme sync | `webapp/src/services/tma/theme.ts:1-94` | Maps TMA theme params into CSS tokens and meta theme-color. | Handles font scaling; ensure status bar colors leverage header tokens. |
| Constants | `webapp/src/constants/layout.ts:4-6` | Defines `HEADER_RESERVE_PX=90`, `HEADER_BUFFER_PX=12` used by viewport CSS writer. | Adjust when header height changes; doc references these numbers. |
| Hook | `webapp/src/hooks/useSafeArea.ts:1-42` | Subscribes to safe area + viewport events and returns snapshots to components. | Currently just forwards SDK snapshots; consider exposing `isFullscreen` for UI gating. |
| Layout shell | `webapp/src/components/layout/AppLayout.tsx:22-114` | Applies safe area padding, calls `miniApp.setHeaderColor`, renders header & nav. | Still uses manual `safeTop + 12` spacing and draws header outline; candidate for cleanup. |
| CSS tokens | `webapp/src/index.css:13-199` | Defines fallback theme + safe area CSS custom properties. | Ensures env() fallback; document how `--app-header-offset-top` drives status spacing. |
| Store | `webapp/src/store/uiStore.ts:25-86` | Persists theme snapshot for use across components. | Can host `isFullscreen` flag or header density preferences if needed. |
| Entry point | `webapp/src/main.tsx:1-94` | Calls `ensureTmaSdkReady`, hydrates UI/theme, subscribes to safe area changes. | Already sets up disposers; doc should mention hooking point for instrumentation. |
| Docs baseline | `docs/06-11-2025/ui-task-02-top-bar.md:1-52` | Describes earlier issues with header width and colors. | Use as historical context; still relevant for QA sign off. |

---

## 4. Pain points observed in Energy Planet builds (evidence-driven)
4.1 On iPhone 15 Pro Max fullscreen, Telegram close + menu icons sit inside ~44 px `contentSafeArea.top` yet our header padding uses only device inset, so UI bleeds underneath the icons (see QA video 2025-11-03).
4.2 Desktop Telegram collapses the native header but we still reserve a bordered rectangle, producing double outlines — referenced in `docs/06-11-2025/ui-task-02-top-bar.md`.
4.3 When users exit fullscreen, CSS vars update but React stateful components keep old padding until re-render, so `BottomNavigation` floats with stale bottom insets.
4.4 Theme toggles from Telegram cause `miniApp.setHeaderColor` to run, but the header component still uses `bg-surface-primary` class, resulting in mismatched stripe colors.
4.5 QA flagged that status bar highlights (glow/border) feel unnecessary in fullscreen; we should drop the border radius when `viewport.isFullscreen` is true.
4.6 Logging lacks detail — we cannot tell when Telegram denies fullscreen requests or emits errors because `requestFullscreen` promise rejections are swallowed.
4.7 We do not persist `safeArea` snapshots anywhere accessible to Storybook, so designers cannot preview the header with telegraphed insets.
4.8 `miniApp.setBackgroundColor` fallback is only invoked for legacy `window.Telegram` but `miniApp` call is wrapped in try/catch that swallows errors; we should log warnings for QA builds.

---

## 5. Implementation blueprint by phase
The work is sequenced into four phases so engineering, design, and QA can land incremental improvements without blocking on perfect polish.

### Phase 0 – Baseline instrumentation (1 day)
- [x] P0.1 Add verbose logging around `viewport.requestFullscreen` / `exitFullscreen` in `webapp/src/services/tma/viewport.ts` to capture denials.
- [x] P0.2 Emit `viewport.isFullscreen` + `safeArea.safe.top` to `window.__renderMetrics` for QA screenshot overlays.
- [x] P0.3 Document the intent of `HEADER_RESERVE_PX` directly in `constants/layout.ts` so future tweaks stay in sync.
- [x] P0.4 Добавлены глобальные оверрайды `window.__safeAreaOverride` / `window.__viewportMetricsOverride` и опции `setupStageMocks`, чтобы Storybook/Playwright могли эмулировать insets без Telegram.

### Phase 1 – Layout parity (2-3 days)
- P1.1 Update `useSafeArea` to expose derived tokens: `headerInset`, `contentInset`, `isFullscreen`.
- P1.2 Refactor `AppLayout` header padding to rely on CSS vars `--app-header-offset-top` instead of manual `safeTop + 12` math.
- P1.3 Remove extra border/outline when `viewport.isFullscreen` to match Telegram guidance about unobtrusive overlays.
- P1.4 Guarantee 16 px horizontal padding plus `safeArea.content.left/right` for every top-level screen container.
- P1.5 Align `BottomNavigation` padding with `--tg-content-safe-area-bottom` so toggling fullscreen keeps nav above system gesture area.

### Phase 2 – Visual polish (2 days)
- P2.1 Define new status bar background token (e.g., `--app-header-system-bg`) that interpolates between header color and Telegram chrome.
- P2.2 Introduce transparency ramp for gradient backgrounds to avoid harsh seams behind Telegram buttons.
- P2.3 Remove capsule border when fullscreen and lighten drop shadow when not fullscreen.
- P2.4 Update design system docs (`webapp/docs/DESIGN_SYSTEM.md`) with the new header states and screenshots.

### Phase 3 – QA + release (ongoing)
- P3.1 Run device matrix (see Section 9) in both production and staging bots.
- P3.2 Capture telemetry for `safeAreaChanged` frequency to spot anomalies on vendor ROMs.
- P3.3 Tag release notes and add GIFs showing status bar compliance for the Telegram team review.

---

## 6. CSS, tokens, and safe-area math in Energy Planet
6.1 `webapp/src/index.css:13-117` sets fallback values for all Telegram theme and safe-area CSS variables so the UI stays stable before the SDK boots.
6.2 Custom props `--safe-area-*` combine `env()` data with Telegram-provided data; this prevents double-padding when running outside Telegram.
6.3 `--app-content-base-top` equals `safeArea.top + contentSafeArea.top`, ensuring we respect both device notches and Telegram chrome.
6.4 `--app-header-offset-top` adds `HEADER_BUFFER_PX` to the base inset so the header sits slightly below the Telegram controls, preventing accidental taps.
6.5 `--app-content-padding-top` reserves `HEADER_RESERVE_PX + HEADER_BUFFER_PX` beyond the base inset, matching the visual height defined in `layout.ts`.
6.6 To drop the redundant border in fullscreen, we can bind `.app-header[data-fullscreen="true"]` to `var(--tg-viewport-is-fullscreen)` via attribute selectors.
6.7 When fullscreen is false, keep the existing capsule but ensure the outline uses `color-mix` to stay subtle on OLED.
6.8 Document safe-area variables via CSS comments so designers know which tokens to reference in Figma.
6.9 Avoid hardcoding `padding-top` inside React components; instead rely on CSS classes that refer back to these custom props.
6.10 Provide fallback values for browsers lacking `env(safe-area-inset-*)`, already handled in `index.css`, but keep verifying when adding new props.

---

## 7. React + TMA runtime integration details
7.1 Hook usage — `useSafeArea` currently exposes `{safeArea, viewport}`; extend it to memoize derived booleans such as `isFullscreen` and `isExpanded` for downstream UI.
7.2 Event bridging — `services/tma/viewport.ts` already subscribes to both SDK observers and native `Telegram.WebApp.onEvent`. Document this so future devs know why we double-subscribe.
7.3 Backwards compatibility — when `isTmaSdkAvailable()` is false (Storybook, tests), we return zeroed insets; ensure storybook stories set dataset attributes manually so CSS still works.
7.4 Theme hook — `useTheme` reads from UI store and re-computes color scheme via `window.matchMedia`. Mention this in design doc to justify header color updates in `AppLayout`.
7.5 `miniApp.setHeaderColor` vs `setBackgroundColor` fallback: we first try `miniApp` (typed) and fallback to legacy `window.Telegram`. Always log when both fail so QA can report Telegram client issues.
7.6 Materializing header state — add `data-header-role="system"` attribute to the header container so Cypress/Playwright can assert the mode easily.
7.7 Navigation spacing — `BottomNavigation` receives `insetBottom`. Document how this prop must always use the safe-area safe bottom plus nav reserve, so fullscreen gestures never overlap our nav icons.
7.8 Global runtime disposers — `main.tsx` stores listeners in `window.__tmaRuntimeDisposers__`; we should add instructions to always append new listeners there.
7.9 Testing hooks — mention `webapp/tests/utils/stageMocks.ts` where we stub `window.Telegram`. Keep it updated when we start referencing `isFullscreen` so tests do not break.
7.10 Storybook/Playwright override — set `window.__safeAreaOverride` / `window.__viewportMetricsOverride` (or pass `safeAreaOverride` in `setupStageMocks`) to emulate Telegram insets when the SDK is unavailable.

---

## 8. Visual design spec for the top system zone
8.1 Goal: make the Energy Planet header feel like a natural extension of Telegram’s fullscreen shell.
8.2 Default state (non-fullscreen) retains subtle outline so users can distinguish app chrome from Telegram sheet when collapsed.
8.3 Fullscreen state removes the outline, widens the gradient, and increases blur radius to blend with Telegram background.
8.4 Header height uses `HEADER_RESERVE_PX` (90 px). Value derived from top padding 16 + block 56 + bottom padding 16 + 2 px level bar (per constants file).
8.5 Safe top spacing = `safeArea.safe.top + safeArea.content.top + HEADER_BUFFER_PX`. Always use CSS var rather than re-computing per component.
8.6 Horizontal padding = `safeArea.safe.left/right` + 16 px base. On tablets or desktop, clamp to `max(24px, inset + 20px)` to avoid overly narrow stripes.
8.7 Text color inherits from `theme.header_color` if provided; fallback chain defined in `AppLayout` lines 31-34 should be documented for designers.
8.8 Buttons in header must stay at least 16 px away from Telegram close/back icons. Use spacer div referencing `--tg-content-safe-area-right` to enforce the gap.
8.9 Status meter backgrounds should honor `var(--app-header-system-bg)` token; avoid pure black to prevent OLED burn-in.
8.10 Over-scroll glow should be disabled in fullscreen to reduce distraction; rely on `overflow-y-auto` with custom scrollbars only when necessary.
8.11 Desktop/web клиенты без системной панели получают кнопку `Закрыть` (AppLayout), которая вызывает `miniApp.close()` и fallback на `Telegram.WebApp.close()`.

---

## 9. Device and scenario validation matrix
Each checkbox row describes a unique combination of device, orientation, Telegram container mode, and the expected status bar outcome. QA must capture screenshots/gifs for every box before release.

- [ ] iPhone 15 Pro Max (iOS 18) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPhone 15 Pro Max (iOS 18) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [x] iPhone 15 Pro Max (iOS 18) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. (Playwright simulation safe-area.spec, evidence 2025-11-07)
- [ ] iPhone 15 Pro Max (iOS 18) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPhone 15 Pro Max (iOS 18) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPhone 15 Pro Max (iOS 18) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] iPhone 13 mini (iOS 17) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPhone 13 mini (iOS 17) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPhone 13 mini (iOS 17) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] iPhone 13 mini (iOS 17) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPhone 13 mini (iOS 17) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPhone 13 mini (iOS 17) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] iPad Pro 12.9" (Stage Manager) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPad Pro 12.9" (Stage Manager) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPad Pro 12.9" (Stage Manager) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] iPad Pro 12.9" (Stage Manager) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPad Pro 12.9" (Stage Manager) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] iPad Pro 12.9" (Stage Manager) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [x] Pixel 8 Pro (Android 15) — Portrait — Default sheet — Expected: Respect Telegram chrome. (Playwright simulation safe-area.spec, evidence 2025-11-07)
- [ ] Pixel 8 Pro (Android 15) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel 8 Pro (Android 15) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Pixel 8 Pro (Android 15) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel 8 Pro (Android 15) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel 8 Pro (Android 15) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Samsung S24 Ultra (One UI 7) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Samsung S24 Ultra (One UI 7) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Samsung S24 Ultra (One UI 7) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Samsung S24 Ultra (One UI 7) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Samsung S24 Ultra (One UI 7) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Samsung S24 Ultra (One UI 7) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Nothing Phone 2 (Android 15) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Nothing Phone 2 (Android 15) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Nothing Phone 2 (Android 15) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Nothing Phone 2 (Android 15) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Nothing Phone 2 (Android 15) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Nothing Phone 2 (Android 15) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Xiaomi 14 (HyperOS) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Xiaomi 14 (HyperOS) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Xiaomi 14 (HyperOS) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Xiaomi 14 (HyperOS) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Xiaomi 14 (HyperOS) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Xiaomi 14 (HyperOS) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (outer display) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (outer display) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (outer display) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (outer display) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (outer display) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (outer display) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (inner display) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (inner display) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (inner display) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (inner display) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (inner display) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Pixel Fold (inner display) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (cover) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (cover) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (cover) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (cover) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (cover) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (cover) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (tablet) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (tablet) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (tablet) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (tablet) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (tablet) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Fold5 (tablet) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Flip5 — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Flip5 — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Flip5 — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Flip5 — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Flip5 — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Galaxy Z Flip5 — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Huawei P60 Pro — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Huawei P60 Pro — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Huawei P60 Pro — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Huawei P60 Pro — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Huawei P60 Pro — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Huawei P60 Pro — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] OnePlus 12 — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] OnePlus 12 — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] OnePlus 12 — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] OnePlus 12 — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] OnePlus 12 — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] OnePlus 12 — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [x] Telegram Desktop macOS — Portrait — Default sheet — Expected: Respect Telegram chrome. (manual-close Playwright test, evidence 2025-11-07)
- [ ] Telegram Desktop macOS — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop macOS — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop macOS — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop macOS — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop macOS — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop Windows — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop Windows — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop Windows — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop Windows — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop Windows — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Desktop Windows — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Telegram Web K — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web K — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web K — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Telegram Web K — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web K — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web K — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Telegram Web Z (beta) — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web Z (beta) — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web Z (beta) — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Telegram Web Z (beta) — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web Z (beta) — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Telegram Web Z (beta) — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] CarPlay mirroring — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] CarPlay mirroring — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] CarPlay mirroring — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] CarPlay mirroring — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] CarPlay mirroring — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] CarPlay mirroring — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Android Auto projection — Portrait — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Android Auto projection — Portrait — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Android Auto projection — Portrait — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.
- [ ] Android Auto projection — Landscape — Default sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Android Auto projection — Landscape — Expanded sheet — Expected: Respect Telegram chrome. Capture safeArea + screenshot overlay.
- [ ] Android Auto projection — Landscape — Fullscreen — Expected: Status bar hidden; header flush. Capture safeArea + screenshot overlay.

QA Tips: use `/debug_safe_area` command in dev console to log insets after each transition; attach logs to TestRail.

---

## 10. File-by-file action checklist
### webapp/src/services/tma/viewport.ts:60-138
- [x] Explain CSS var binding in comments.
- [x] Expose `onFullscreenChange` helper that wraps SDK + native events.
- [x] Log errors when fullscreen requests fail.

### webapp/src/hooks/useSafeArea.ts:1-42
- [x] Return memoized `isFullscreen`, `isExpanded`, `safeTopWithBuffer` derived values.
- [x] Add dev-only warning if hooks used before SDK ready.

### webapp/src/components/layout/AppLayout.tsx:22-114
- [x] Replace manual padding with CSS vars using inline style referencing `var(--app-header-offset-top)`.
- [x] Drop outline when `isFullscreen` true by toggling className.
- [x] Ensure `miniApp.setHeaderColor` catch block surfaces warnings.

### webapp/src/index.css:13-199
- [x] Document each custom property with a short comment.
- [x] Add `.status-bar-shell` rules that respond to `data-fullscreen` attributes.
- [x] Verify env() fallbacks for desktop browsers.

### webapp/src/store/uiStore.ts:25-86
- [x] Optionally store `lastFullscreenState` for debugging.
- [x] Expose setter for dev tools to simulate states.

### webapp/src/main.tsx:1-94
- [x] Register telemetry listener for fullscreen transitions and push to logger.
- [x] Ensure disposer cleans up new listeners.

### webapp/docs/DESIGN_SYSTEM.md
- [x] Add visual states for header (default, expanded, fullscreen).
- [x] Document new tokens to unblock design QA.

### docs/06-11-2025/ui-task-02-top-bar.md
- [x] Update status once fixes land; link back to this playbook.

### webapp/tests/qa/safe-area.spec.ts
- [x] Automate `/debug_safe_area` command invocation to capture logs in CI.
- [x] Assert header `data-fullscreen` baseline renders for QA screenshots.

---

## 11. Telemetry, logging, and debugging guidance
11.1 Extend `logger` usage inside `viewport.ts` so that every fullscreen or expand call logs `{result, safeAreaSnapshot}` at `info` level.
11.2 Add `debug:fullscreen` tag filters to `window._energyLogs` for quick filtering during QA sessions.
11.3 When a fullscreen request fails, capture `error.description`, `viewport.isFullscreen()`, and Telegram version from `window.Telegram.WebApp.version`.
11.4 Emit `safeAreaChanged` metrics to telemetry service by calling `logClientEvent` with bucket `ui_safe_area_delta` whenever top inset delta > 4 px.
11.5 Provide a keyboard shortcut (`Meta`+`Shift`+`S`) in dev builds to toggle a safe-area overlay (semi-transparent rectangles).
11.6 Update `webapp/tests/utils/stageMocks.ts` to allow overriding safe area + fullscreen flags for deterministic tests.
11.7 Document how to reproduce Telegram close-button overlap issues using Playwright device emulation + `viewport.isFullscreen` mocks.
11.8 Инструментировать `ui_safe_area_delta` телеметрию при изменении safe-area >4 px (`webapp/src/main.tsx`).
11.9 Хук `/debug_safe_area` привязать к горячей клавише `Meta+Shift+S` и логам DevTools для QA.

---

## 12. QA exit criteria and review gates
12.1 All checkboxes in Section 9 matrix are completed with evidence attached to TestRail.
12.2 Visual diff tests (`npm run test:visual`) show no regressions in header snapshots for tap/exchange/friends screens.
12.3 Playwright performance loop runs with fullscreen on/off transitions without console errors.
12.4 Designers approve updated mocks stored in `docs/DESIGN_SYSTEM.md` with new header assets.
12.5 Telegram manual review (bot team) receives before/after video showing no overlap with system buttons.
12.6 Release checklist includes toggling `MOCK_PAYMENTS` to ensure purchases still accessible after UI changes, even though not directly touched.

---

## 13. Future enhancements and open questions
13.1 Evaluate migrating to `@tma.js/sdk-react` providers to remove custom store wiring; compare bundle size impact versus manual approach.[ref-sdk-react]
13.2 Consider animating between default and fullscreen states using CSS transitions tied to `--tg-viewport-is-fullscreen` for smoother feel.
13.3 Investigate automatic detection of Telegram button heights so header can adapt to future UI changes without redeploying.
13.4 Explore voice control or gestures triggered when Telegram hides chrome entirely — may require user education.
13.5 Add Storybook stories showcasing safe-area overlays for both fullscreen and default states so contractors know the expected layout.
13.6 Monitor Telegram release notes for additional fullscreen events (e.g., `fullscreen_failed`) to improve resilience.[ref-telegram-tips]

---

## 14. Glossary, commands, and resources
### Glossary
- **Content safe area**: Telegram-reserved inset that covers native close/back buttons; differs from pure device notch.
- **Device safe area**: Hardware notch/gesture indicator; from `env(safe-area-inset-*)` and `viewport.safeAreaInsets()`.
- **Fullscreen**: Mode where Telegram hides its chrome and grants entire screen; toggled via `web_app_request_fullscreen`.
- **Expanded sheet**: Bottom sheet stretched to full height but still shows Telegram top chrome.
- **HEADER_BUFFER_PX**: Extra spacing (12 px) keeping Energy Planet header below Telegram buttons.

### Helpful commands
- `npm run dev` — start Vite dev server for `/webapp`.
- `npm run test:visual` — regenerate Chromatic baselines after header tweaks.
- `npm run lint` — ensure updated files respect ESLint/Prettier.
- `node scripts/mock-safe-area.mjs --top 44 --content-top 24` — (todo) script to preview header spacing in desktop browsers.

### External resources
- Telegram Mini Apps Viewport spec.[ref-viewport]
- `@tma.js/sdk` viewport feature docs.[ref-viewport-sdk]
- Telegram Events reference for `safe_area_changed` and `viewport_changed`.[ref-events]
- Telegram Methods reference for orientation/viewport commands.[ref-methods]
- Telegram Tips announcement covering fullscreen and motion tracking.[ref-telegram-tips]
- `@tma.js/sdk-react` package (jsDelivr) for future provider migration.[ref-sdk-react]

---

## 15. References
[ref-viewport]: https://docs.telegram-mini-apps.com/platform/viewport
[ref-viewport-sdk]: https://docs.telegram-mini-apps.com/packages/tma-js-sdk/features/viewport
[ref-events]: https://docs.telegram-mini-apps.com/platform/events
[ref-methods]: https://docs.telegram-mini-apps.com/platform/methods
[ref-telegram-tips]: https://t.me/TelegramTips/496
[ref-sdk-react]: https://www.jsdelivr.com/package/npm/%40tma.js/sdk-react
[ref-tma-sdk]: https://npm.io/package/%40tma.js/sdk

## 16. Scenario walkthroughs (step-by-step)
### S1 — Entering fullscreen from expanded sheet
- S1.1 Call `viewport.requestFullscreen()` after confirming `miniApp.isVersionAtLeast(8.0)`.
- S1.2 Await promise; if resolved, expect `safeArea.content.top` to drop to 0 on Android but stay >0 on iOS due to sensor housing.
- S1.3 Update `uiStore` with `isFullscreen=true` so header toggles outline state.
- S1.4 Trigger CSS transition on `.status-bar-shell` to fade border radius within 120 ms.
- S1.5 Log telemetry event `ui_fullscreen_enter` with payload `{safeTop, contentTop, client}`.
- S1.6 If promise rejects, display toast for QA builds and fall back to expanded sheet.
- S1.7 Ensure `BottomNavigation` recalculates padding using new `safeArea.safe.bottom` because gesture area may shrink.

### S2 — Exiting fullscreen via Telegram swipe
- S2.1 Telegram emits `viewport_changed` with `is_fullscreen=false` before our code runs.
- S2.2 `onTmaViewportChange` should update CSS vars immediately.
- S2.3 React components reading `useSafeArea` must re-render; ensure hook uses `useSyncExternalStore` or similar to avoid lag.
- S2.4 Header should restore outline + drop shadow via class toggle.
- S2.5 Re-run `miniApp.setHeaderColor` because Telegram may reinstate its own header background.
- S2.6 If Telegram collapses to sheet, re-enable manual close button only if we previously hid it.
- S2.7 Log `ui_fullscreen_exit` along with reason (gesture vs manual).

### S3 — Theme change while fullscreen
- S3.1 Telegram triggers `themeChanged`; `onTmaThemeChange` updates UI store.
- S3.2 `AppLayout` effect recalculates `headerColor` and pushes it via `miniApp.setHeaderColor`.
- S3.3 Ensure CSS custom props update before React rerender to avoid flash of default colors.
- S3.4 Validate readability of status text by checking contrast between `theme.header_color` and `theme.text_color`.
- S3.5 If Telegram denies custom colors, fallback to `bg_color` token.
- S3.6 Record theme switch in telemetry to correlate with screenshot anomalies.
- S3.7 QA should verify both light and dark toggles in fullscreen and sheet modes.

### S4 — Orientation change on foldables
- S4.1 `safe_area_changed` arrives with drastically different `left/right` values; update CSS tokens.
- S4.2 Header horizontal padding must re-compute using new insets within a frame.
- S4.3 Recalculate `max-width` for `.app-shell` to avoid narrow center column on wide displays.
- S4.4 If Telegram temporarily exits fullscreen, request it again once orientation settles.
- S4.5 Ensure `BottomNavigation` remains centered; adjust `max-w-screen-lg` thresholds for tablets.
- S4.6 Validate that pointer targets remain ≥44 px even when device width shrinks (e.g., Flip5 cover screen).
- S4.7 Update QA logs with before/after safe area snapshots for debugging.

### S5 — Telegram reintroduces header after long inactivity
- S5.1 Some clients show native header after inactivity; we must detect via `contentSafeArea.top` > 0.
- S5.2 When this happens, do not hide our manual close/back button if Telegram already shows one.
- S5.3 Reapply header gradient to account for new overlap.
- S5.4 Consider nudging user that fullscreen timed out if we rely on immersive features.
- S5.5 Re-run device tests because this behavior is client-specific.
- S5.6 Ensure telemetry notes the auto-exit reason for analytics.
- S5.7 Escalate to Telegram support if this occurs frequently after release.

### S6 — Desktop web embed
- S6.1 Desktop Telegram hides its own close button; we must show ours within header.
- S6.2 Safe area top might be 0; still maintain 12 px buffer for visual breathing room.
- S6.3 Outline can stay because Telegram UI resembles a floating window.
- S6.4 Provide hover states for close/back icons using CSS variables to match theme.
- S6.5 Ensure ESC key triggers close behavior consistent with Telegram expectations.
- S6.6 Document differences for designers (Desktop uses mouse, not touch).
- S6.7 Capture screenshot for release notes to reassure desktop users.

### S7 — Safe area fallback outside Telegram (Storybook)
- S7.1 When `window.Telegram` is undefined, `ensureTmaSdkReady` throws; we catch and log warning in `main.tsx`.
- S7.2 CSS defaults from `index.css` keep header visible with placeholder spacing.
- S7.3 Provide knobs in Storybook to tweak simulated safe area values so designers can preview extremes.
- S7.4 Document manual method: set `document.documentElement.dataset.tgSafeAreaTop` to mimic Telegram.
- S7.5 Ensure header class responds even without actual SDK events.
- S7.6 Flag components that break outside Telegram (should be rare).
- S7.7 Keep this scenario in CI to catch regressions early.

### S8 — Animated entry on cold start
- S8.1 Default CSS uses fallback theme; once SDK ready we animate to actual palette.
- S8.2 Avoid sliding header vertically; rely on opacity fade so safe area math stays consistent.
- S8.3 Ensure `miniApp.ready()` call occurs after we lay out header skeleton to prevent Telegram from showing spinner too long.
- S8.4 Request fullscreen only after initial theme + safe area hydration completes, otherwise Telegram might reject due to user gesture requirement.
- S8.5 Debounce telemetry emission so cold start does not spam events.
- S8.6 Preload fonts referenced in header to minimize layout shift.
- S8.7 Confirm `AppLayout` handles cases where safe area data arrives late (should fallback to zeros without crashing).

## 17. Risk register and mitigations
- R1 — Telegram rejects fullscreen request on some Android builds. Mitigation: implement exponential backoff and show unobtrusive toast; collect client version metrics.
- R2 — Header outline removal confuses users outside fullscreen. Mitigation: toggle `data-fullscreen` attribute and keep outline only when Telegram chrome visible.
- R3 — Safe area mismatch between CSS and React state. Mitigation: source of truth is CSS; expose `safeArea` values via `data-*` attributes for debugging.
- R4 — Performance hit from frequent re-render. Mitigation: throttle `useSafeArea` updates via `requestAnimationFrame` and use CSS where possible.
- R5 — QA matrix too big for sprint capacity. Mitigation: prioritize top 8 devices; mark lower priority rows for later but leave placeholders.
- R6 — Desktop embed lacks Telegram chrome cues. Mitigation: always display manual window controls and show tooltip on hover.
- R7 — Theme tokens missing (older Telegram versions). Mitigation: rely on defaults defined in `index.css` and avoid assuming optional tokens exist.
- R8 — Storybook regression when `window.Telegram` undefined. Mitigation: guard `miniApp` calls with try/catch and provide mock provider for docs.
- R9 — Layout constants drift from design spec. Mitigation: centralize values in `constants/layout.ts` and reference them via CSS custom props only.
- R10 — Users mistake custom close button for Telegram control. Mitigation: match iconography but add tooltip “Close Energy Planet” so expectation is clear.

## 18. Release communication template
Draft message to share in release notes and with Telegram review team:
1. Summary — “Aligned Energy Planet header with Telegram fullscreen policies; status bar now adapts to safe areas dynamically.”
2. Visual proof — include GIF showing header staying clear of native controls across three devices.
3. Technical checklist — mention `viewport.requestFullscreen`, safe area logging, and telemetry readiness.
4. QA coverage — reference Section 9 matrix completion and attach key screenshots.
5. Rollout plan — specify staged rollout toggled via feature flag `ui.fullscreen.statusBar` if implemented.
6. Support note — instruct support agents to ask for Telegram version + device when handling UI complaints.
7. Next steps — tease future improvements (animations, storybook controls) to set expectations.
8. Owners — list on-call engineer + designer for escalation during release window.

## 19. Follow-up checklist snapshot (rolling)
- [ ] Update `docs/changelog.md` with references to this playbook.
- [x] Update `docs/changelog.md` with references to this playbook.
- [ ] Schedule design review focusing on fullscreen header on 2025-11-10.
- [ ] Confirm Telegram bot review submission includes new screenshots.
- [ ] Archive this checklist once a new UI audit supersedes it.
