# Shop Panel – Featured Star Pack Card

- **Element ID**: `<Card highlighted ...>` for `featuredPack`
- **Source**: `webapp/src/components/ShopPanel.tsx:136`
- **Role**: Spotlight best-value star pack.

## Checklist Findings
- **Visual Emphasis**: Gradient halo + badge draw attention. Ensure contrast remains ≥ 3:1 per Telegram UI guidance. citeturn0search0 **Severity: Low**
- **Price Per Star**: Calculated using total stars; good. Provide rounding to avoid long decimals (already `toFixed(1)`).
- **Imagery**: Uses `OptimizedImage` if `icon_url` available. Need skeleton while loading.
- **Button State**: `Button` uses `isProcessingStarPackId`; ensures disable while purchase pending.
- **Copy**: Titles Russian? Some may come from content; ensure fallback from content pack.

## Interaction & API Coverage
- CTA triggers `purchaseStarPack` -> API chain (`/purchase/invoice`, `/purchase`). Validate error cases:
  - 400 `invalid_purchase_payload` when server receives missing metadata.
  - 500 when purchase service fails.
  Add user-facing toast and revert spinner; currently only console error.
- Should show success toast/haptic (present). Add confetti? optional.

## Issues & Risks
1. **Error Feedback Missing**: On fetch or purchase error, user sees no message aside from global `starPacksError`. Add toast with reason. **Severity: High**
2. **Accessibility**: Multi-column card complex; ensure heading uses `<h3>` unique (already). `Badge` text uppercase; confirm legible.

## Opportunities
- Display retention message (“+10% passive income boost for 1h after purchase”) if available.
- Add telemetry: `star_pack_featured_click`, `star_pack_featured_purchase_success`.
