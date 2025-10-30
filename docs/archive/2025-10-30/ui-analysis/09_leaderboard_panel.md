# Leaderboard Panel (`LeaderboardPanel`)

- **Source**: `webapp/src/components/LeaderboardPanel.tsx`
- **Role**: Showcase top players, highlight user rank, encourage competitive play.

## Checklist Findings
- **Loading/Error States**: Uses `LeaderboardSkeleton` and descriptive error card. Good alignment with Telegram guidance on graceful failure. citeturn0search0 **Severity: Low**
- **Data Limits**: Slices to top 100. Ensure backend provides sorted list; otherwise UI may mislead.
- **Accessibility**: Table uses semantic `<table>`. For mobile (`sm:hidden`) ensure accessible alternative (cards). Check responsive branch for mobile (not shown in snippet) – verify exists; if not, add to avoid horizontal scroll on small screens. **Severity: Medium**
- **Localization**: Copy Russian; medal labels English (e.g., `'First place'`). Localize. **Severity: Medium**
- **Animation**: Current user row animates background; ensure reduced motion respected (no check). Add `prefers-reduced-motion`. **Severity: Low**

## Interaction & API Coverage
- Data from `useGameStore.loadLeaderboard` -> backend `/leaderboard`. On error, `leaderboardError` shown. Ensure manual refresh CTA available (currently none). Add button.
- `rowsWithDiff` calculates energy diff but not displayed on mobile. Provide consistent messaging.
- Telemetry: log when user scrolls leaderboard or taps copy.

## Issues & Risks
1. **Mobile Layout**: Need stacked card layout for `<sm` to avoid overflow. **Severity: Medium**
2. **Live Refresh**: No polling; consider refreshing every 30-60s or manual refresh.

## Opportunities
- Add share button (copy ranking) to boost virality.
- Provide filter for clan leaderboard.
