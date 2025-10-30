# Boost Hub (`BoostHub`)

- **Source**: `webapp/src/components/BoostHub.tsx`
- **Role**: Surface daily/ad/premium boosts with timers and claim actions.

## Checklist Findings
- **Data Refresh**: Loads on mount and offers manual refresh button. Should auto-refresh when timers expire (currently derived from `setInterval` state). Consider background polling via `useEffect`. **Severity: Medium**
- **Timer Accuracy**: `cooldownRemaining` uses `Date.now()` in map; but `setInterval` updates `now` each second. Works but relies on client clock—sync to server time returned in `BoostHubResponse.server_time`. Currently unused. **Severity: High**
- **Accessibility**: Buttons have descriptive labels but dynamic text. Provide `aria-live` for timer updates? Might be noisy; maybe `aria-live="polite"` on countdown. **Severity: Low**
- **Error Handling**: `boostHubError` displayed via `Card`; add CTA to retry.
- **Performance**: `setInterval` per second even when inactive—OK but maybe throttle when not visible.

## Interaction & API Coverage
- Claim button posts `/boost/claim` with `boost_type`. Backend may return 400 (`boost_type_required`, `boost_cooldown_active`). UI currently surfaces error via `throw` (caught by parent?). `handleClaimBoost` rethrows; but `BoostHub` doesn't catch, so error bubbles to console. Need toast and state revert. **Severity: High**
- When cooldown active, button disabled and label shows countdown; ensure translation fits button width.
- Should log `boost_claim_attempt`, `boost_claim_success/fail`.

## Issues & Risks
1. **Server Time Ignored**: Without using `server_time`, timers drift. **Severity: High**
2. **Uncaught Errors**: No `try/catch` around `handleClaimBoost`; errors propagate. Use `useNotification`. **Severity: High**
3. **Premium Requirement Copy**: Provide message for non-premium users when `requires_premium`. **Severity: Medium**

## Opportunities
- Add `Watch ad` CTA for ad boost (hook to Telegram `showAd` when available).
- Provide summary badge in tab header when boost available.
