# Settings Screen (`SettingsScreen`)

- **Source**: `webapp/src/components/settings/SettingsScreen.tsx`
- **Role**: Manage account info, audio/haptics, notifications, display, accessibility, and logout.

## Checklist Findings
- **Modal Context**: Rendered as tab; `onClose` toggles back to home. Ensure focus trapping when opened modally. **Severity: Medium**
- **Accessibility**: Uses emoji icons and custom toggles. Need to confirm `Toggle` exposes `role="switch"` with `aria-checked`. Add keyboard instructions. **Severity: High** (if missing)
- **Localization**: Copy Russian with some English (e.g., “Energy Planet v1.0.0”). Acceptable but consider resource file for translations.
- **External Links**: Privacy/terms `href="#privacy"` placeholders; result in no navigation (404). Replace with actual URLs or disable until ready. **Severity: High**
- **Logout Flow**: Confirm `logoutSession(false)` handles errors; warning toast displayed. Good double-confirmation, but resets haptic intensity to `light()` even if disabled (should guard). **Severity: Low**
- **Reduce Motion**: Setting toggles store but ensure global effect (tie to CSS).

## Interaction & API Coverage
- Preference store local (likely persisted). Add telemetry when toggles change.
- Logout should call backend session endpoint; verify `logoutSession` uses correct API and handles 401 gracefully.
- Reset to defaults resets store; confirm modals update UI immediately.

## Issues & Risks
1. **Toggle Semantics**: Validate `Toggle` component for ARIA compliance; adjust if necessary. **Severity: High**
2. **Dead Links**: Privacy/terms anchors non-functional; triggers user frustration. **Severity: High**
3. **Theme Selection**: `SelectButton` lacks radio semantics; convert to `role="radiogroup"`. **Severity: Medium**

## Opportunities
- Expose debugging info (app build hash) for support.
- Provide support contact button linking to Telegram chat.
