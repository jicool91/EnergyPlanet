# Home Panel – Prestige Card

- **Element ID**: `<PrestigeCard />`
- **Source**: `webapp/src/components/PrestigeCard.tsx`
- **Role**: Communicates prestige progress and provides CTA to reset for multiplier gain.

## Checklist Findings
- **Progress Indicator**: Uses gradient bar but no animation; minimum width ensures visibility. Need `aria` attributes similar to XP card. **Severity: Medium**
- **Button State**: Disables when `isPrestigeAvailable` false, but label still “Не готово”; consider tooltip explaining requirement. **Severity: Low**
- **Copy**: Russian text consistent. `gainLabel` fallback references energy remaining; ensure `prestigeEnergyToNext` updated frequently.
- **Error Handling**: When `onPrestige` fails (backend 400 due to `prestige_not_ready`), UI only disables spinner; ensure `useNotification` shows error. Currently `performPrestige` in `gameStore` sets `sessionErrorMessage`? Need to verify. **Severity: High**
- **Telemetry**: Should log event when prestige triggered or blocked.

## Interaction & API Coverage
- Endpoint: `POST /prestige/perform` via `performPrestigeReset` (backend). Validate:
  - If request takes >10s, add timeout + UI message.
  - Confirm `isPrestigeLoading` toggles to prevent double taps.
  - Ensure energy/stats refresh after success (calls `refreshSession`? check store).

## Issues & Risks
1. **Missing Feedback on Error**: Add toast for backend rejections. **Severity: High**
2. **Accessibility**: Progress bar needs `role="progressbar"` and text for screen readers. **Severity: Medium**

## Opportunities
- Provide preview of multiplier increase (e.g., +1.2x) inline.
- Add link to explanation modal for new users.
