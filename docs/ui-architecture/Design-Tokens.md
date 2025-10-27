# Design Tokens & Theming

**Source of truth:** `webapp/src/styles/design-tokens.css`
**Consumers:** Tailwind utilities (`webapp/tailwind.config.js`), component CSS classes, inline styles
**Updated:** 2025-10-27

---

## 1. Token Inventory (CSS Custom Properties)

| Category | Token | Value / Notes | Usage |
|----------|-------|---------------|-------|
| **Spacing** | `--spacing-xs` `--spacing-sm` `--spacing-md` `--spacing-lg` `--spacing-xl` `--spacing-2xl` | 4px baseline, currently consumed indirectly via Tailwind defaults (`gap-4` ≈ 16px). | Target: expose as Tailwind `gap-xs`, `px-lg`, etc. (see Quick Start step 1).
| **Colors – brand** | `--color-cyan`, `--color-gold`, `--color-lime`, `--color-orange` | Applied through `Card`, `Button`, gradients. | Maintain for marketing bursts and CTA emphasis.
| **Colors – theme aware** | `--color-surface-*`, `--color-text-*`, `--color-border-*` | Derived from Telegram theme params; update via `telegramTheme` helpers. | Ensure new components use these vars instead of hard-coded hex.
| **Typography** | `--font-display`, `--font-heading`, `--font-body`, `--font-caption`, `--font-micro` | Matched with helper classes (`text-heading`, `text-caption`). | Keep consistent with design spec; consider migrating to CSS `@font-palette-values` if needed.
| **Shadows & glows** | `--shadow-sm`, `--shadow-lg`, `--shadow-glow-card`, etc. | Provide depth cues for cards and modals. | Align new layout surfaces to reuse these tokens.
| **Safe area** | `--safe-area-*`, `--tg-safe-area-*`, `--tg-content-safe-area-*` | Populated from Telegram viewport events (`useSafeArea`). | Critical for notch/inset support per Telegram UX guidance.

Add new tokens in `design-tokens.css` first, then expose them in Tailwind and components.

---

## 2. Tailwind Bridge

- Current config extends colors, spacing (safe-area aliases), font sizes, shadows (`webapp/tailwind.config.js`).
- Action item: map spacing and sizing tokens to Tailwind utilities so components stop relying on default numeric utilities. Example snippet (see Quick Start step 1) shows how to proxy CSS vars through Tailwind.
- Consider adding semantic size utilities for cards:

```js
// tailwind.config.js
const cardSizes = {
  'card-sm': 'var(--card-size-sm, 88px)',
  'card-md': 'var(--card-size-md, 120px)',
};

extend: {
  width: cardSizes,
  height: cardSizes,
}
```

Set `--card-size-*` via CSS variables or inline style objects if dynamic.

---

## 3. Telegram Mini App Theming Guidelines

- **Safe areas:** Follow Telegram recommendation to use `viewportChanged` and `safe_area_changed` events to react to dynamic heights and folding devices. Our `useSafeArea` hook already subscribes—ensure future layout components consume it before applying fixed padding.
- **Color scheme:** Telegram advises matching the WebApp `themeParams`, providing contrast ratios >= 4.5 for body text. When introducing new surfaces, source colors from the existing `--color-surface-*` tokens to keep compliance.
- **Motion budget:** The official UX guidelines recommend keeping tab transitions under ~400 ms and avoiding blocking animations. Our `ScreenTransition` values (0.3–0.4 s) are within spec; audit new animations before shipping.

(References: docs.telegram-mini-apps.com/platform/theming, docs.telegram-mini-apps.com/platform/safe-areas.)

---

## 4. Token Governance Checklist

- [ ] Add/update token in `design-tokens.css` with documentation comment.
- [ ] Surface token in Tailwind config (if needed) and run `npm run build`.
- [ ] Update relevant component stories / usage (Card, Button, surfaces).
- [ ] Document changes here and in `README.md` changelog.
- [ ] Cross-check light/dark rendering inside Telegram shell on iOS + Android.

Keep this list in PR templates when touching tokens.
