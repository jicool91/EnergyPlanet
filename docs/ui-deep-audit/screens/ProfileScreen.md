# ProfileScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/profile`. Loads full account info + settings before exposing avatars/admin toggles.
- KPI: retention, cosmetics attachment, admin tooling access.
- Data: `useGameStore` profile API, `ProfileSettingsScreen` internals.

## Layer Map
- **Base** — `TabPageSurface` header + single surface.
- **Primary** — `Surface` wrapping either skeleton, error notice, or `ProfileSettingsScreen`.
- **Support** — Tabs inside `ProfileSettingsScreen` (Profile vs Settings).
- **Overlays** — Settings dialogs triggered within nested components.

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Primary | Outer `Surface` | Marked `aria-live="polite"` and `aria-busy` while swapping large chunks. | Screen readers re-announce the entire profile UI whenever any nested control updates, creating noise. | Remove `aria-live` from the container; instead, attach live regions to targeted stats or skeletons. | webapp/src/screens/ProfileScreen.tsx |
| Support | Account nav buttons | `ProfileSettingsScreen` nav uses buttons with `aria-pressed` but not `role="tab"`/`tablist`. | VoiceOver doesn’t understand active panel context; keyboard users tab through both options. | Adopt ARIA tablist semantics + roving focus, or use segmented control component with labels. | webapp/src/components/ProfileSettingsScreen.tsx |
| Support | Section state | `section` state is local to component with no sync to URL or storage. | Returning users always land on default tab and can’t deep-link to settings. | Persist last-opened section (localStorage / query param) and expose `/profile?section=settings`. | webapp/src/components/ProfileSettingsScreen.tsx |
| Support | Close button / admin entry | `Button` labeled "Закрыть" appears only when `onClose` prop passed, but there’s no affordance in the standalone screen. | Users cannot exit or reach admin panel from this route, despite component supporting it. | Add contextual actions (admin link, logout) to the dedicated screen, not only modal variant. | webapp/src/screens/ProfileScreen.tsx |

## Interaction & Performance
- Profile fetch runs on every mount even if data cached; add stale-while-revalidate to avoid spinner flashes.
- Consider splitting profile vs settings into accordions to reduce vertical scroll on mobile.

## Content & Localization
- Header copy is static ("Профиль") and doesn’t mention username/level; personalize to reinforce achievement loop.
- Provide inline description for admin-only toggles instead of hiding them entirely—show locked state.
