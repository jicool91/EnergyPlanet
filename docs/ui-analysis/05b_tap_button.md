# Home Panel – Tap Button

- **Element ID**: `<motion.button ... data-test-id="tap-button">`
- **Source**: `webapp/src/components/HomePanel.tsx:83`
- **Role**: Primary CTA to generate energy via taps.

## Implementation Summary
- Framer Motion button with gradient background, glow effect, haptic feedback via `useHaptic.tap`.
- Conditional streak badge overlay displays combo multiplier with animated pulse.
- `onTap` prop dispatches `useGameStore.tap(1)` (POST `/gameplay/tap`).

## Checklist Findings
- **Telegram Guidance Compliance**: Large, central CTA aligns with recommendation for primary action prominence. Ensure minimum 48px target met (here 128px). citeturn0search0 **Severity: Low**
- **Feedback**: Haptic and animation deliver immediate response; confirm audio cues consistent with Telegram guidelines (no auto audio). **Severity: Low**
- **Accessibility**: Emoji `🌍` labelled with `aria-label="Tap planet..."`; good. Need focus visible state for keyboard; rely on `focus-ring`? Not present—add. **Severity: Medium**
- **Error Handling**: If backend returns 429/400 (rate limited), UI does not display message; store may set `sessionErrorMessage` but not surfaced near button. **Severity: High**
- **Telemetry**: Should log tap event with tap streak + energy earned for analytics; check `logClientEvent` usage (currently none). **Severity: Medium**

## Interaction & API Coverage
- Endpoint: `POST /gameplay/tap` in `TapService.processTap`. Need QA:
  - Rapid tapping ( > 15 taps/s ) — ensure debouncing prevents backlog.
  - Offline fallback: confirm `postQueue` flush behaviour; check `requestQueue` implementation.
  - Error states (insufficient auth) should trigger `toast` via `useNotification`.

## Issues & Risks
1. **Rate Limit Messaging**: Add toast or badge when backend rejects tap (e.g., `tap_too_fast`). **Severity: High**
2. **Focus State**: Ensure keyboard users can see selection ring. **Severity: Medium**

## Opportunities
- Add long-press to auto-tap when allowed per game design.
- Introduce progress ring around button to show XP to next level visually.
