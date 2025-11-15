# FriendsScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/friends`. Mixes referral program, revenue insights, invites, and leaderboard.
- KPI: invites sent, referral conversions, boost sales from leaderboard CTA.
- Data: `useGameStore` (leaderboard/profile), `useReferralStore`, `useReferralRevenueStore`.

## Layer Map
- **Base** — `TabPageSurface` with hero surface (shop CTA) and stacked cards.
- **Primary** — `FriendsList`, `ReferralRevenueCard`.
- **Support** — `LeaderboardPanel` surface, error fallbacks.
- **Overlays** — Share sheet / Telegram link triggered from invite logic.

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Primary | `FriendsList` error state | Button copy says "Попробовать ещё раз" but `onClick` calls `onInvite` (share link) instead of reload. | Users stuck in error loop; CTA launches share sheet even though data failed. | Add dedicated retry handler that re-calls referral summary and keep invite CTA separate. | webapp/src/components/friends/FriendsList.tsx |
| Primary | Invite CTA | Button never checks `dailyInvitesLimit`; share flow fires even when quota exhausted. | Creates false promise + potential spam errors server-side. | Disable CTA & surface message when `dailyInvitesUsed >= dailyInvitesLimit`. | webapp/src/components/friends/FriendsList.tsx |
| Support | "Посмотреть друзей в рейтинге" button | `handleViewLeaderboard` navigates to `/friends` (current route), so CTA is a no-op. | Users expect a dedicated leaderboard view but nothing changes, hurting trust. | Either deep-link to leaderboard tab or scroll/focus the leaderboard panel when the CTA fires. | webapp/src/screens/FriendsScreen.tsx |
| Support | `ReferralRevenueCard` placeholder | Skeleton uses `animate-pulse` but lacks `aria-busy`/`role="status"`. | Screen readers don’t know content is loading, violating WCAG feedback guidelines. | Add `aria-busy`, descriptive status text, and consistent skeleton height. | webapp/src/components/friends/ReferralRevenueCard.tsx |

## Interaction & Performance
- Screen fires four parallel fetches on mount; coordinate via suspense or at least show unified loading state to avoid sequential snaps.
- Leaderboard surface is heavy; consider deferring until the user scrolls near it or when `FriendsList` interactions complete.

## Content & Localization
- Hero CTA "В магазин бустов" competes with referral CTA; rename to "Смотреть бусты друзей" or move to leaderboard surface.
- Add explanation of referral revenue rate (e.g., "получаете 15% в Stars"), not just raw numbers.
