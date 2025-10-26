# Level Up Overlay (`LevelUpScreen`)

- **Element ID**: `<LevelUpScreen isOpen={isLevelUpOpen} newLevel={player.level} onDismiss={...} />`
- **Source**: `webapp/src/components/LevelUpScreen.tsx`
- **Role**: Full-screen celebratory overlay that announces a new level, plays audio/visual feedback, and returns the player to the main gameplay surface.

## Purpose & Success Criteria
- Celebrate level milestones with high-energy motion, confetti, and audio so players feel rewarded.
- Communicate the new level number and next unlock clearly within the Telegram Mini App viewport.
- Allow players (including keyboard and screen reader users) to acknowledge the event and resume play without confusion.

## Implementation Summary
- `AnimatePresence` toggles the overlay when `isOpen` is true; entire structure is a `motion.div` with `fixed inset-0` backdrop. (`webapp/src/components/LevelUpScreen.tsx:62-141`)
- Invokes `Confetti` component for particle burst and multiple `motion.div` elements for animated glow, rotating ring, and number pulse.
- Uses `useSoundEffect()` to play the `'levelup'` tone on open, and auto-dismisses after `autoDismissDuration` (default 2000 ms) via `setTimeout`. (`LevelUpScreen.tsx:42-59`)
- Clicking anywhere on the overlay calls `onDismiss`, but there is no explicit keyboard or focus management.

## UX Compliance Checklist
- **Safe Area Handling**: `fixed inset-0` covers the viewport; works for celebratory overlays, but ensure underlying `MainScreen` pauses interactions while overlay active. **Severity: Low**
- **Accessibility**: The overlay lacks `role="dialog"`, `aria-modal="true"`, focus trap, or initial focus target. Screen readers will not announce the level-up state, and keyboard users receive no focus cue. **Severity: Critical**
- **Motion & Performance**: Continuous confetti and rotating gradients ignore `prefers-reduced-motion`; no guards to disable animation for sensitive users. Potential 60 fps impact on low-end devices. **Severity: High**
- **Audio Feedback**: Sound plays automatically without checking the player's sound settings or providing textual caption; may violate Telegram’s expectation to respect user toggles. **Severity: Medium**
- **Dismissal Logic**: Auto-dismiss after 2 s risks players missing messaging; timer cannot be paused when overlay not visible or when focus is lost. **Severity: Medium**
- **Telemetry**: No `logClientEvent` when the overlay shows/dismisses, limiting retention funnel analysis. **Severity: Low**

## Interaction & API Coverage
- Pure client-side component; no direct API calls. `onDismiss` should close the overlay and resume gameplay. Ensure parent blocks duplicate opens while animation running.
- Consider emitting analytics events (`level_up_show`, `level_up_dismiss`, `level_up_click_through`) with the new level number and session context.

## Issues & Risks
1. **Missing Dialog Semantics**: Add `role="dialog"`, `aria-modal`, focus management (e.g., autofocus on dismiss button) and trap navigation until dismissed. Without this, overlay fails accessibility audits. **Severity: Critical**
2. **Reduce-Motion Compliance**: Wrap confetti/animations behind `useReducedMotion` or the global settings toggle (`SettingsScreen`). Otherwise motion sensitivity complaints and potential Telegram review rejection. **Severity: High**
3. **Sound Preference Ignored**: `useSoundEffect` emits tones even if sound disabled; respect `useSettingsStore.soundEnabled` (or equivalent) before playing. **Severity: Medium**
4. **Premature Auto-Dismiss**: Two-second timeout may close before users read reward (“Доступны новые постройки”) or take screenshots; extend duration or gate on explicit confirmation. **Severity: Medium**

## Opportunities & Follow-Ups
- Provide explicit CTA («Открыть новые постройки») that routes to `BuildingsPanel` to reinforce upgrades.
- Add analytics and telemetry linking level-up to subsequent shop or prestige actions.
- Pause background tap loop and disable `MainScreen` interactions until overlay dismissed to prevent accidental taps registering through the overlay.
- Localise celebratory text and ensure typography scales for long translations.
