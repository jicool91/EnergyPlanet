# Shop Panel (`ShopPanel`)

- **Source**: `webapp/src/components/ShopPanel.tsx`
- **Role**: Monetisation hub for Star packs and cosmetics.

## Implementation Summary
- Section tabs for `star_packs` and `cosmetics`.
- Fetches data via `useCatalogStore.loadStarPacks/loadCosmetics` hitting `/purchase/packs` and `/cosmetics`.
- Purchase flow posts `/purchase/invoice` then `/purchase` (mock flow).
- Uses `ShopSkeleton`, `Card`, `Badge`, and `OptimizedImage`.

## Checklist Findings
- **Data Loading**: `useEffect` triggers fetch on mount. No retry/backoff on failure beyond manual refresh button. **Severity: Medium**
- **UX Compliance**: Buttons sized > 44px; safe area padding managed. Need to ensure long lists remain scrollable (virtually?). **Severity: Low**
- **Accessibility**: Section tabs use `Button` component lacking `aria-pressed`. Should convert to toggle buttons or add `role="tablist"` for sections. **Severity: Medium**
- **Localization**: Copy mostly Russian; ensure currency formatting handles decimals for USD. **Severity: Low**
- **Error Display**: Errors shown via `Card` but remain until next reload; provide close action.

## Interaction & API Coverage
- **Star Pack Purchase**:
  - Hits `/purchase/invoice` then `/purchase`. Backend expects numeric `price_stars`; UI uses total stars (stars + bonus). Confirm backend accepts value exceeding base price (should). 
  - No handling for 400 (e.g., `invalid_purchase_payload`), except generic toast; `loadStarPacks` sets `starPacksError` but not displayed inside flow. Add specific messaging (e.g., "Покупка временно недоступна").
- **Cosmetics Purchase**:
  - `completeCosmeticPurchase` -> `POST /purchase` (?) need to inspect service `cosmetics.ts`. Confirm endpoints exist.
  - `equipCosmetic` uses `/cosmetics/equip`. Provide spinner/failure messaging.
- **Refresh Button**: `loadStarPacks(true)` + `loadCosmetics(true)` concurrently; no loading indicator aside from icon spin.

## Issues & Risks
1. **Purchase Double Post**: Without dedupe, button remains active until promise resolves. `isProcessingStarPackId` handles but ensure backend idempotency (unique `purchase_id`). **Severity: Medium**
2. **Telemetry Gap**: No client logging (should call `logClientEvent` on success/failure). **Severity: Medium**
3. **Cosmetics Category Default**: `activeCategory` resets to first; when categories empty, state stuck and may crash if `undefined`. Already guarded but confirm. **Severity: Low**

## Opportunities
- Add price-per-star badges across packs for comparison.
- Integrate Telegram `showInvoice` for real payments when ready.
- Provide marketing copy per section (A/B test).
