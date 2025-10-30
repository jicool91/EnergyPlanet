# Home Panel – XP Progress Card

- **Element ID**: `<XPProgressCard />`
- **Source**: `webapp/src/components/XPProgressCard.tsx`
- **Role**: Communicates progression toward next level and suggested actions.

## Checklist Findings
- **Visual Hierarchy**: Clear header + percentage. Animated progress bar respects reduced motion via `useReducedMotion` and intersection observer; good alignment with Telegram motion guidelines. citeturn0search0 **Severity: Low**
- **Performance**: Intersection observer disconnects properly; ensure fallback on unsupported browsers (older Android WebView). Currently just leaves `isVisible` default true—acceptable. **Severity: Low**
- **Accessibility**: Bar lacks `role="progressbar"` with `aria-valuenow` etc. Add to satisfy assistive technology requirements. **Severity: High**
- **Copy**: Helper text uses Russian; consistent. For huge XP remaining message, convert hours to human-friendly string using i18n.
- **Data Integrity**: Accepts `xpTotal` as sum of `xpIntoLevel + xpToNextLevel`; ensure parent passes consistent values (already computed).

## Interaction & API Coverage
- Static card; consider linking to `BuildingsPanel` when level ready.

## Issues & Risks
1. **Missing ARIA**: Without `role="progressbar"`, screen readers miss progress info. **Severity: High**
2. **Colour Accessibility**: Gradient bar on grey background may fail contrast; validate ratio >= 3:1. **Severity: Medium**

## Opportunities
- Add tooltip or info icon explaining XP gain sources.
- Trigger telemetry `xp_card_visible` when 75% threshold reached.
