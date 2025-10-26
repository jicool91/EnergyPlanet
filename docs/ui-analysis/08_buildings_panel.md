# Buildings Panel (`BuildingsPanel`)

- **Source**: `webapp/src/components/BuildingsPanel.tsx`
- **Role**: Manage building purchases/upgrades, highlight ROI options.

## Checklist Findings
- **Data Loading**: Loads catalog on mount via `useCatalogStore.loadBuildingCatalog`. Should refetch when player level changes significantly; consider `useEffect` dependency on `playerLevel`. **Severity: Medium**
- **Virtualization**: Uses `Virtuoso` but does not pass `customScrollParent` from `ScrollContainerContext`, so virtualization may attach to window and ignore safe area. **Severity: High**
- **Purchase Options**: Buttons for `×1/×10/×100/MAX` implemented as simple `<button>`; missing ARIA attributes for toggle. **Severity: Medium**
- **Error Display**: `buildingsError` message includes “Переload” typo; button triggers `loadBuildingCatalog()` but label in English/Russian mix. Fix copy. **Severity: Low**
- **Empty State**: Good fallback when no buildings.

## Interaction & API Coverage
- `handlePurchase` -> `useGameStore.purchaseBuilding` -> `/gameplay/upgrade` with action `purchase`. Backend returns 400 for `not_enough_energy`, `building_locked`, etc. UI rethrows error which surfaces via global toast? Check `purchaseBuilding` (should use `describeError`). Ensure per-card error message to inform user. **Severity: High**
- `handleUpgrade` similar; ensure spinner while request pending (`isProcessingBuildingId`).
- Buttons not disabled when insufficient energy until backend responds; consider pre-check using `purchasePlan`.

## Issues & Risks
1. **Virtualization Bug**: Provide `customScrollParent={scrollParent}` to Virtuoso. **Severity: High**
2. **Error Messaging**: Provide user-facing notifications when backend returns 400. **Severity: High**
3. **Toggle Accessibility**: Add `aria-pressed` for purchase option chips. **Severity: Medium**

## Opportunities
- Surface ROI rank badges inline with building cards.
- Add quick actions (buy best ROI) based on `purchasePlans`.
- Track analytics on purchase attempts vs success.
