# Stage D QA & Automation Checklist (2025-11-06)

## 1. Economy / Shop Empty & Error Scenarios
- [ ] Force empty leaderboard (`/api/v1/leaderboard` → `[]`) and capture screenshots (dark/light).
- [ ] Simulate shop product fetch failure (mock 500) and verify toast + retry CTA.
- [ ] Validate purchase flow happy path with mock invoice → purchase sequence (logs + modal).

## 2. Visual Regression Baseline
- [x] Record Playwright visual snapshots for Tap, Exchange (shop + builds tabs), Friends (leaderboard panel), Offline modal via `npm run test:visual`.
- [x] Cover dual-accent + light theme toggles through `/visual.html?view=…&theme=light` previews.
- [x] Store baselines under `docs/qa/baseline/2025-11-06` (`npm run baseline:visual`).

## 3. Contrast & Accessibility
- [x] Run `npm run test:contrast` (script now covers overlay panels).
- [ ] Verify focus traps (LevelUpScreen, AuthErrorModal) with keyboard-only navigation.
- [ ] Check `prefers-reduced-motion` variants (LevelUpScreen, PurchaseSuccessModal).

## 4. Telemetry & Logging
- [x] Confirm `leaderboard_panel_*`, `shop_view`, `star_pack_checkout_*` (plus new `render_latency` / `tap_success`) fire with stable component IDs (checked in Playwright QA logs).
- [x] Add QA dashboard widget for Stage D (latency, tap success, auth errors) in Grafana (`infra/grafana/dashboards/telegram-miniapp-product.json`).

## 5. Post-QA Handoff
- [ ] Update `docs/ui-design-review/2025-11-05-design-system-blueprint.md` Stage D section with results.
- [ ] Attach evidence (screens, logs) to Jira epic «Design System Unification».
- [ ] Greenlight Stage D → Stage E transition in release notes.
