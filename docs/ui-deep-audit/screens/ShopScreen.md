# ShopScreen Deep Analysis (2025-11-15)

## Flow Snapshot
- Entry: `/shop` with query param `section` controlling categories (stars, boosts, cosmetics, buildings).
- KPI: monetize (star packs, boosts) + maintain time-on-shop.
- Data sources: `useGameStore` for balances, `ShopPanel`/`BuildingsPanel` for catalog data, `ScrollContainerContext` for sticky sections.

## Layer Map
- **Base** — `TabPageSurface` with accent hero, nav block, and stacked surfaces.
- **Primary** — gradient hero (balance + boost multiplier) and category tab grid.
- **Support** — `ShopPanel` or `BuildingsPanel`, freebies surface, "Скоро" list.
- **Overlays** — inherited from `ShopPanel` (purchase modal, success modal, etc.).

## Element-level findings
| Layer | Element | Observation | Issue & Impact | Fix | Code |
| --- | --- | --- | --- | --- | --- |
| Primary nav | Category tabs (`role="tab"` buttons) | Buttons expose `role="tab"` + `aria-controls` but keep default tab focus, so every tab stops keyboard navigation. No arrow key support. | Violates WAI-ARIA tablist pattern; keyboard users must tab through all cards and cannot switch tabs with arrows. | Implement roving `tabIndex`, handle ArrowLeft/Right, and confine focus to the active tab per ARIA Authoring Practices. | webapp/src/screens/ShopScreen.tsx |
| Primary hero | Copy blocks ("Tap to open", "Checkout") | Mixed English/Russian copy and static checkout info regardless of platform. | Breaks localization guidelines and confuses CN/EN markets; checkout info may be wrong on Android (no Face ID). | Move hero strings to i18n, detect available payment methods, and only surface relevant badges. | webapp/src/screens/ShopScreen.tsx |
| Support freebies | "Ежедневный подарок" card | Hard-coded text with always-enabled CTA; no cooldown, inventory, or claim feedback. | Users can spam the button without status, eroding trust and telemetry accuracy. | Wire to backend timer, add disabled & claimed states, display next availability countdown. | webapp/src/screens/ShopScreen.tsx |
| Support roadmap | "Скоро появится" list | Renders `[1,2].map` placeholders with generic copy forever. | Placeholder content in production reduces credibility and wastes scroll depth meant for monetizable SKUs. | Replace with dynamic backlog (feature flags) or remove section until real content is ready. | webapp/src/screens/ShopScreen.tsx |

## Interaction & Performance
- Query-param sync effect mutates history on every category change. It uses `replace`, but still runs on first render even when URL already correct—add guard to skip redundant `navigate` calls.
- `ShopPanel` + `BuildingsPanel` share scroll context but there is no sticky CTA for star packs; consider docking key actions to maintain conversion focus.

## Content & Localization
- Localize every CTA, including "Tap to open" and "Checkout" badges.
- Clarify multiplier meaning (`boostMultiplier`) with tooltip text or microcopy (e.g., "x1.6 действует ещё 2ч").
