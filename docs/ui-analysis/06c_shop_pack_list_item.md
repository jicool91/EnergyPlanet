# Shop Panel – Star Pack List Items

- **Element ID**: `starPacks.filter(...).map(pack => <Card ...>)`
- **Source**: `webapp/src/components/ShopPanel.tsx:188`
- **Role**: Display remaining star packs with purchase CTA.

## Checklist Findings
- **List Layout**: Uses simple `map` without virtualization; acceptable due to small dataset.
- **State Indicators**: `isBestValue` adds badge; ensure `bestValuePack` logic well-defined (check `buildShopViewModel`). Provide tooltip explaining label. **Severity: Low**
- **Accessibility**: Each card is `<Card>` (div). For screen readers, add heading containing pack title using `<h3>` as done? yes. Include sr-only price for clarity.
- **Loading State**: When `isStarPacksLoading` and existing packs > 0, spinner not shown; consider subtle overlay.

## Interaction & API Coverage
- Purchase button uses same `handlePurchaseStarPack`. On error, console only. Add UI feedback.
- Need to enforce telemetry event for pack selection.
- Evaluate scenario: `bonus_stars` undefined => label hides; ensure copy handles.

## Issues & Risks
1. **Error Messaging**: Without toast, repeated 400 errors (e.g., due to backend validation) leave users confused. **Severity: High**
2. **Internationalisation**: Price label uses `toLocaleString('ru-RU')`; ensure fallback for other locales. **Severity: Medium**

## Opportunities
- Add `compare` link to highlight difference vs featured pack.
- Introduce `Gift` option hooking to Telegram share invoice.
