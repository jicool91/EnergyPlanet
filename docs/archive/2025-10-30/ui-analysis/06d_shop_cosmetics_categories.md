# Shop Panel – Cosmetics Category Chips

- **Element ID**: `categories.map(category => <Button ...>)`
- **Source**: `webapp/src/components/ShopPanel.tsx:233`
- **Role**: Filter cosmetics by category.

## Checklist Findings
- **Accessibility**: Buttons behave as filters; add `aria-pressed` to communicate selection. **Severity: Medium**
- **Loading Feedback**: When `isCosmeticsLoading` true, only disables buttons (except active). Provide skeleton/shimmer for grid. **Severity: Medium**
- **Empty State**: Displays message “Пока нет косметики...” – good. Ensure the message uses neutral tone.
- **State Reset**: When categories change (e.g., new data), effect ensures active category valid. Good.

## Interaction & API Coverage
- Filtered list derived client-side; ensure `buildShopViewModel` caches to avoid recomputation thrash.
- On error (`cosmeticsError`), message shown but button remains interactive; disable to avoid confusion.

## Issues & Risks
1. **No Analytics**: Track `cosmetics_category_select`.
2. **Focus Ring**: Button uses design system `Button` so accessible focus ring present.

## Opportunities
- Add icons previewing category type (e.g., planet skins).
- Introduce `All` category to allow browsing everything.
