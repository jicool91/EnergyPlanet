# ChatScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/chat`, toggles between global and clan scopes.
- KPI: daily active senders, stickiness, clan adoption.
- Data: `useChatStore` polling every 5 s, `useGameStore` for profile, `useUIStore` for nav visibility.

## Layer Map
- **Base** — `TabPageSurface` substitute built with manual `Panel` tabs and `Surface` container.
- **Primary** — message log, infinite scroll, load-older CTA.
- **Support** — scope tabs, empty states, composer.
- **Overlays** — queued-new-message pill, notifications.

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Tabs | Scope buttons (`global` / `clan`) | Custom buttons inside `Panel`, no `role="tab"`, `aria-controls`, or hotkeys. | Screen readers don’t announce relationship between tabs and chat panel, violating ARIA tab pattern. | Add semantic tablist, label containers, and keyboard shortcuts (Ctrl+Tab) for quick switching. | webapp/src/screens/ChatScreen.tsx |
| Message list | `<ul>` mapping all `messages` | No virtualization or windowing; renders entire history (up to 500 entries). | Perf degrades on long sessions and DOM bloat increases layout cost on every poll. | Use `react-window`/virtualizer or limit DOM to viewport-sized slice while preserving scroll anchors. | webapp/src/screens/ChatScreen.tsx |
| Composer | `<textarea>` + send button | Textarea has placeholder only, no `<label>`, no character counter even though `MAX_CHAT_LENGTH=500`. | Fails WCAG form labeling, users hit silent limit and lose trust. | Add visible label (or aria-label tied to instructions) and live counter (`aria-live="polite"`). | webapp/src/screens/ChatScreen.tsx |
| New message pill | Floating Button | Pill appears when `queuedNewCount > 0` but doesn’t announce itself via `aria-live`. | Assistive tech users never know about unseen messages. | Add live region describing new message count and ensure button receives focus when it appears. | webapp/src/screens/ChatScreen.tsx |

## Interaction & Performance
- Polling continues offscreen; throttle with visibility API or websockets.
- Scroll anchoring stores `scrollHeight` manually; consider `ResizeObserver` to avoid jank when images/emoji load.

## Content & Localization
- Clan tab just shows `ClanComingSoon`; describe timeline or CTA to sign up for beta instead of dead-end.
- Provide system message that describes chat rules/rate limits, not just errors after send.
