# Home Panel – Daily Reward Banner

- **Element ID**: `<DailyRewardBanner />`
- **Source**: `webapp/src/components/DailyRewardBanner.tsx`
- **Role**: Encourage daily return through countdown and claim CTA.

## Implementation Summary
- Pure client-side countdown to next midnight; `onClaim` optional callback (currently not passed from `HomePanel`).
- Animated gradient background + emoji bounce (skipped on low-performance devices).
- Claim button uses `focus-ring` and gradient styling.

## Checklist Findings
- **Functional Hook**: `HomePanel` does not pass `onClaim`; button currently does nothing, violating expectation. Need to wire to `/boost/claim` or appropriate endpoint. **Severity: High**
- **Countdown Accuracy**: Resets at midnight device time; no server sync. Users can change system time to exploit. Align with server time via `/session` data. **Severity: High**
- **Accessibility**: Emoji has label; timer text uses abbreviations but no `aria-live`. Add polite live region so screen readers hear countdown updates. citeturn0search3 **Severity: Medium**
- **Performance**: `setInterval` runs every 1s even when off-screen; consider pausing when banner hidden. **Severity: Low**
- **Telemetry**: No analytics event for claim or impressions.

## Interaction & API Coverage
- Expected flow: On click, call backend daily reward endpoint (not implemented). Investigate `boostService` for daily claims; align with `/boost/claim` or create `/rewards/claim`.
- Ensure button disables during request and handles 400 (already claimed). Provide toast feedback via `useNotification`.

## Opportunities
- Show next reward tier (e.g., streak bonuses) to motivate retention.
- Provide skeleton while waiting for server-supplied reward status.
