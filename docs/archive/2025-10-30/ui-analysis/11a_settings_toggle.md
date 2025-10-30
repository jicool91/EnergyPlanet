# Settings – Toggle Component

- **Element ID**: `<Toggle enabled={...} onChange={...} />`
- **Source**: `webapp/src/components/settings/Toggle.tsx`
- **Role**: Custom switch for prefs (sound, haptics, notifications, etc.).

## Checklist Findings
- **Accessibility**: Missing `role="switch"` and `aria-checked`. No keyboard handling (Enter/Space). Must add to comply with Telegram accessibility best practices. citeturn0search0 **Severity: Critical**
- **Haptics**: Always triggers `light()` even when toggling off or when haptics disabled globally. Respect global preference. **Severity: Medium**
- **Disabled State**: `disabled` prop dims control; good. Provide tooltip to explain why disabled (e.g., push notifications require notifications).
- **Animation**: Framer Motion layout animation good; ensure reduce-motion setting disables.

## Interaction & API Coverage
- Should support keyboard toggling via `onKeyDown`. Without it, desktop web becomes inaccessible.
- Add analytics for toggle state changes.

## Opportunities
- Add `aria-label` prop to describe toggle purpose.
- Provide `aria-describedby` to link to helper text.
