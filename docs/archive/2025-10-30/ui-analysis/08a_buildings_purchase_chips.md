# Buildings Panel – Purchase Option Chips

- **Element ID**: `PURCHASE_OPTIONS.map(option => <button ...>)`
- **Source**: `webapp/src/components/BuildingsPanel.tsx:66`
- **Role**: Let players choose bulk quantity for purchases.

## Checklist Findings
- **Accessibility**: Buttons lack `role="radio"` or `aria-pressed`. Implement single-select pattern (`role="radiogroup"`). **Severity: High**
- **Visual Feedback**: Active state uses colour change; ensure contrast for colour-blind users by adding icon or underline. **Severity: Medium**
- **Copy**: `Pereload` typo in error message triggered by failing load; fix to `Перезагрузить`. **Severity: Low**
- **State Persistence**: `selectedPurchaseId` stored in state; persists across tab switches? (component lazy mounts per tab; likely resets). Consider storing in store to keep selection.

## Interaction & API Coverage
- On selection, downstream `purchasePlans` recalculated to determine available quantity. Works.
- When `MAX` results in quantity zero, UI still marks as selected; highlight message "Недостаточно энергии".

## Opportunities
- Provide tooltip describing each option (“Покупает 10 построек если хватает энергии”).
- Add analytics `build_purchase_option_select`.
