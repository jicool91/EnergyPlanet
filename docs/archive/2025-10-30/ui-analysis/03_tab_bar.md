# Bottom Tab Bar (`TabBar`)

- **Element ID**: `<TabBar tabs={...} active={activeTab} onChange={onTabChange} />`
- **Source**: `webapp/src/screens/MainScreen.tsx:209`, component `webapp/src/components/TabBar.tsx`
- **Role**: Persistent navigation between main app sections inside Telegram Mini App viewport.

## Implementation Snapshot
- `fixed` footer with safe-area padding derived from `useSafeArea()`.
- Scrollable horizontal container with `snap` behaviour for overflow tab labels.
- Buttons provide `role="tab"`, `aria-selected`, `aria-controls`, and icons.

## Checklist Findings
- **Safe Area**: Padding includes left/right/bottom insets, satisfying Telegram guideline to avoid clipped controls over the navigation bar. citeturn0search0turn0search3 **Severity: Low**
- **Accessibility**: ARIA roles are set, but `role="tablist"` is on `<footer>`; this is correct, yet `button` lacks `tabindex={isActive ? 0 : -1}` for keyboard navigation. **Severity: Medium**
- **Theming**: Uses CSS vars referencing the design system; confirm these map to Telegram theme tokens to maintain contrast in dark mode. **Severity: Low**
- **Micro-interactions**: No haptic feedback on tab change; guidelines recommend subtle feedback for primary navigation. citeturn0search0 **Severity: Low**
- **Analytics**: No explicit telemetry when tab changes; helpful for understanding tab engagement.

## Interaction & API Coverage
- `onChange` calls `onTabChange` w/out guard; repeated taps on active tab cause redundant renders. Consider early return when `tab.id === active`. **Severity: Low**
- Need to confirm tab icons/text remain legible under Telegram's Accessibility Large Text setting (test plan item).

## Issues & Risks
1. **Keyboard Navigation**: Without manual `tabIndex`, arrow-key navigation may skip inactive tabs. Add roving tabindex pattern. **Severity: Medium**
2. **Focus Ring Styling**: `focus-ring` class relies on CSS custom property – verify it meets WCAG 2.1 guidelines (3:1 contrast) per Telegram recommendations. **Severity: Low**

## Opportunities
- Emit telemetry event `nav_tab_change` with tab ID.
- Provide long-press tooltip for icons-only view when width is constrained.
