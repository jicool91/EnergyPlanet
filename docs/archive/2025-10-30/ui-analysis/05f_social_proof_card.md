# Home Panel – Social Proof Card

- **Element ID**: `<SocialProofCard friendsCount={...} />`
- **Source**: `webapp/src/components/SocialProofCard.tsx`
- **Role**: Encourage leaderboard engagement via friends-online messaging.

## Checklist Findings
- **Data Integrity**: `friendsCount` currently generated via `Math.random()` in `HomePanel`, delivering misleading info. Replace with actual social data or hide card. **Severity: High**
- **Interaction**: `onViewLeaderboard` optional; `HomePanel` does not pass handler, making button inert. **Severity: High**
- **Copy & Emojis**: Localised in Russian; emojis acceptable but ensure fallback text if not rendered.
- **Accessibility**: Button uses `aria-label`. Need to confirm focus ring visible.
- **Telemetry**: No event fired on click; add to track social funnel.

## Interaction & API Coverage
- Expected to navigate to `leaderboard` tab: implement `onViewLeaderboard={() => onTabChange('leaderboard')}` from parent.
- Consider retrieving friend count from `/social/friends` endpoint (check backend). If not available, implement.

## Opportunities
- Display avatars of friends (max 3) to increase trust.
- Add CTA to invite friends if count zero instead of hiding card.
