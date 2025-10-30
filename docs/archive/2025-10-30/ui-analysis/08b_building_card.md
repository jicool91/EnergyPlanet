# Buildings Panel – Building Card

- **Element ID**: `<BuildingCard ... />`
- **Source**: `webapp/src/components/BuildingCard.tsx`
- **Role**: Present building stats with purchase/upgrade CTAs, unlock animation, notifications.

## Checklist Findings
- **Feedback Loop**: Uses notifications, haptics, and sounds for success/error; aligns with Telegram guidance on multimodal feedback. citeturn0search0 **Severity: Low**
- **Error Handling**: Custom error toasts triggered on catch provide clarity. Ensure backend error message surfaced (currently generic). **Severity: Medium**
- **Lock State**: `isLocked` dims card; `unlock_level` displayed? (not currently). Add explicit message “Доступно с уровня X”. **Severity: Medium**
- **Performance**: Frequent re-renders due to per-card state `buttonStates`; acceptable but consider memoization for 100+ items.
- **Accessibility**: Buttons rely on `Button` component with focus ring. Provide `aria-describedby` linking to ROI info for screen readers.

## Interaction & API Coverage
- Purchase -> `onPurchase` with `purchasePlan.quantity`. Need to guard against zero quantity; already showing error toast.
- Upgrade -> `onUpgrade`. When backend returns `building_not_owned`, toast says “Ошибка при апгрейде”. Clarify message.
- Should disable buttons while `processing` per `useGameStore`. Already uses `processing` flag.

## Issues & Risks
1. **Missing Unlock Info**: Without textual hint, players may not know requirement. **Severity: Medium**
2. **ROI Rank Duplication**: `building.roiRank` vs `roi_rank`; ensure consistent property to avoid undefined. **Severity: Low**
3. **Sound Availability**: `useSoundEffect` might fail on Telegram due to autoplay restrictions; gracefully handle. **Severity: Low**

## Opportunities
- Add progress ring around building icon showing ROI rank visually.
- Provide CTA to view building details modal (income breakdown).
