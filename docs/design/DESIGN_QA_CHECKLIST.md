# Design QA Checklist — Pre-Commit

Updated: 2 Nov 2025  
Scope: run through every section before merging UI-facing work.

## 1. Environment Sanity
- [ ] Latest `main` merged; migrations applied if backend props changed.
- [ ] Telegram Mini App running in iOS + Android test clients (not just the web preview).citeturn2news12
- [ ] `npm run lint`, `npm run typecheck`, and unit tests green.

## 2. Visual Fidelity
- [ ] All colors sourced from tokens or Telegram theme params; no hardcoded hex values except temporary experimental flags.citeturn14search2turn15search0
- [ ] Primary/secondary surfaces respect light & dark themes without clipping or gradients that reduce contrast.citeturn8search0
- [ ] Typography uses token sizes (`--font-*`) and line heights; no Tailwind one-offs.
- [ ] Safe areas respected in portrait/landscape, including foldables (test via Telegram desktop emulator).citeturn2news12

## 3. Interaction & Feedback
- [ ] All buttons/toggles provide ≥44 px hit areas and visible focus states.citeturn2search3turn8search0
- [ ] Critical actions (level-up, prestige, rare drops) trigger haptics + toast/snackbar acknowledgement.
- [ ] Loading states appear for async flows over 300 мс; skeletons mirror final layout.
- [ ] `BackButton` и `MainButton` Telegram корректно настроены (цвета, текст, состояние disabled).citeturn17search0

## 4. Accessibility
- [ ] Contrast ≥4.5 : 1 for text and essential iconography (verify with tooling).citeturn8search0
- [ ] VoiceOver/TalkBack can reach every actionable control in logical order.
- [ ] `prefers-reduced-motion` honoured (particle bursts, screen shake disabled).citeturn16search0
- [ ] Copy reviewed for clarity across RU/EN locales.
- [ ] Модалы (`AchievementsModal`, `OfflineSummaryModal`) содержат `aria-labelledby`/`aria-describedby` и блокируют фоновый скролл.

## 5. Performance
- [ ] Gameplay loop maintains ≥58 fps on mid-tier Android (Galaxy A54 benchmark) with logging captured.citeturn7search0
- [ ] No blocking main-thread tasks > 50 ms during tap spam or shop browsing.
- [ ] Network requests batched where possible; retries handled gracefully.
- [ ] Телеметрия (`logClientEvent`) записывает FPS/UX события без 429 ошибок (проверить логи devtools).

## 6. Documentation & Handoff
- [ ] Update relevant sections in `UI_UX_ANALYSIS.md`, this checklist, or component docs if behavior changed.
- [ ] Attach before/after screenshots or screen recordings in the PR.
- [ ] Note remaining UX debt or open questions for follow-up sprints.

## 7. Platform Parity
- [ ] Тема Telegram меняется без перезагрузки (проверить `themeChanged` → CSS-переменные).citeturn15search0
- [ ] Фуллскрин-режим (`viewport.expand`) корректно включает новые safe-area отступы и не ломает верхний хедер.citeturn2news12
- [ ] `Telegram.WebApp.setBackgroundColor` вызывается при смене сцен без мерцаний.citeturn15search0
