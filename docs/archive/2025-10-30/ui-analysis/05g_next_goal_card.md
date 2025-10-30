# Home Panel – Next Goal Card

- **Element ID**: Conditional `<Card>` rendering `purchaseInsight`
- **Source**: `webapp/src/components/HomePanel.tsx:120`
- **Role**: Recommend next building purchase with ROI context.

## Checklist Findings
- **Data Source**: Derived from `purchaseInsight` memo in `MainScreen` using building catalog + ROI ranks. Works offline without server call. Ensure catalog up-to-date via `/buildings`. **Severity: Low**
- **Clarity**: Displays cost, remaining energy, payback hours; good. Add tooltip for ROI rank explanation.
- **Interaction**: Card is informational only; consider adding `button` to open `BuildingsPanel` filtered to item. **Severity: Medium**
- **Error State**: When data missing, card hidden—OK. But when `remaining > 0`, no CTA to top-up energy (e.g., go to boost). Add suggestion.
- **Accessibility**: Card uses text only; ensure icons or emphasised text to draw attention.

## Interaction & API Coverage
- Should link to `BuildingsPanel` item (maybe `scrollIntoView`). Investigate hooking to `onTabChange('builds')` with context.
- If ROI data stale (lack `loadBuildingCatalog` refresh), card may mislead. Consider TTL + manual refresh.

## Opportunities
- Add analytics to track whether suggestions convert into purchases.
- Highlight when recommended item already owned to encourage upgrades.
