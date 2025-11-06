# Stage D QA & Automation Checklist (2025-11-06)

## 1. Economy / Shop Empty & Error Scenarios
- [x] Force empty leaderboard (`/api/v1/leaderboard` → `[]`) and capture screenshots (dark/light).
- [x] Simulate shop product fetch failure (mock 500) and verify toast + retry CTA.
- [x] Validate purchase flow happy path with mock invoice → purchase sequence (logs + modal).

## 2. Visual Regression Baseline
- [x] Record Playwright visual snapshots for Tap, Exchange (shop + builds tabs), Friends (leaderboard panel), Offline modal via `npm run test:visual`.
- [x] Cover dual-accent + light theme toggles through `/visual.html?view=…&theme=light` previews.
- [x] Store baselines under `docs/qa/baseline/2025-11-06` (`npm run baseline:visual`).

## 3. Contrast & Accessibility
- [x] Run `npm run test:contrast` (script now covers overlay panels).
- [x] Verify focus traps (LevelUpScreen, AuthErrorModal) with keyboard-only navigation.
- [x] Check `prefers-reduced-motion` variants (LevelUpScreen, PurchaseSuccessModal).

## 4. Telemetry & Logging
- [x] Confirm `leaderboard_panel_*`, `shop_view`, `star_pack_checkout_*` (plus new `render_latency` / `tap_success`) fire with stable component IDs (checked in Playwright QA logs).
- [x] Add QA dashboard widget for Stage D (latency, tap success, auth errors) in Grafana (`infra/grafana/dashboards/telegram-miniapp-product.json`).

## 5. Post-QA Handoff
- [x] Update `docs/ui-design-review/2025-11-05-design-system-blueprint.md` Stage D section with results.
- [x] Сохранить артефакты (скриншоты, логи) в `docs/qa/evidence/2025-11-06`.
- [x] Greenlight Stage D → Stage E transition в релиз-нотах.

## 6. Storybook / Chromatic
- [x] Запустить `npm run test:storybook` (Chromatic) и добавить Storybook pipeline в CI.
