# Stage D QA & Automation Checklist (2025-11-06)

## 1. Economy / Shop Empty & Error Scenarios
- [ ] Force empty leaderboard (`/api/v1/leaderboard` → `[]`) and capture screenshots (dark/light).
- [ ] Simulate shop product fetch failure (mock 500) and verify toast + retry CTA.
- [ ] Validate purchase flow happy path with mock invoice → purchase sequence (logs + modal).

## 2. Visual Regression Baseline
- [ ] Record Percy/Chromatic snapshots for Tap, Exchange (shop + builds tabs), Friends (leaderboard panel), Offline modal.
- [ ] Cover dual-accent + light theme toggles via `npm run preview -- --theme light`.
- [ ] Store baselines under `docs/qa/baseline/2025-11-06`.

## 3. Contrast & Accessibility
- [ ] Run `npm run test:contrast` (update script to include new `Panel` variants).
- [ ] Verify focus traps (LevelUpScreen, AuthErrorModal) with keyboard-only navigation.
- [ ] Check `prefers-reduced-motion` variants (LevelUpScreen, PurchaseSuccessModal).

## 4. Telemetry & Logging
- [ ] Confirm `leaderboard_panel_*`, `shop_view`, `star_pack_checkout_*` fire with new component IDs.
- [ ] Add QA dashboard widget for Stage D (latency, tap success) before Prod rollout.

## 5. Post-QA Handoff
- [ ] Update `docs/ui-design-review/2025-11-05-design-system-blueprint.md` Stage D section with results.
- [ ] Attach evidence (screens, logs) to Jira epic «Design System Unification».
- [ ] Greenlight Stage D → Stage E transition in release notes.
