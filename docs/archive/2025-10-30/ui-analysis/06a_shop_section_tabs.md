# Shop Panel – Section Tabs

- **Element ID**: `SECTION_TABS.map` rendering `<Button>` toggles
- **Source**: `webapp/src/components/ShopPanel.tsx:79`
- **Role**: Switch between Star packs and Cosmetics subviews.

## Checklist Findings
- **Accessibility**: Buttons function as tabs but lack `role="tab"` and `aria-selected`. Convert to actual tab semantics for screen readers per Telegram guidelines. citeturn0search0 **Severity: High**
- **Focus Management**: No roving focus; keyboard users must tab through each button and inner content. Implement `aria-controls` referencing container IDs.
- **Feedback**: Variant toggles visual style; add redundancy (icon) for colourblind accessibility.
- **Telemetry**: No event on section change; log `shop_section_change`.

## Interaction & API Coverage
- Changing tabs does not cancel in-flight fetches; consider abort controllers to avoid race conditions.
- When switching to cosmetics before data loads, spinner not shown (since `isCosmeticsLoading` but grid may be empty). Add skeleton.

## Issues & Risks
1. **Semantic Mismatch**: Without ARIA, visually hidden content may not announce. **Severity: High**
2. **State Leakage**: `activeCategory` may remain stale when returning to star packs; ensure resets not required.

## Opportunities
- Use Telegram segmented control style for familiarity.
