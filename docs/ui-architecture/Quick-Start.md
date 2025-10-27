# Quick Start (3–4 hour implementation track)

**Objective:** Align the live UI with our design system by eliminating duplicated spacing logic, introducing shared page surfaces, and validating Telegram Mini App requirements.

**Prerequisites:** Familiarity with React + Tailwind, Zustand stores, Telegram Mini App runtime, and Framer Motion.

---

## Step 1 – Bridge spacing tokens into Tailwind (≈45 min)

1. Open `webapp/tailwind.config.js`.
2. Add semantic spacing keys that proxy the existing CSS tokens (`webapp/src/styles/design-tokens.css`). Tailwind 3.4 allows direct CSS variable references.

```ts
// webapp/tailwind.config.js
const spacingTokens = {
  xs: 'var(--spacing-xs)',
  'xs-plus': 'var(--spacing-xs-plus)',
  sm: 'var(--spacing-sm)',
  'sm-plus': 'var(--spacing-sm-plus)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
};

export default {
  // …
  theme: {
    extend: {
      spacing: {
        ...spacingTokens,
        'safe-left': 'var(--safe-area-left, 0px)',
        'safe-right': 'var(--safe-area-right, 0px)',
        'safe-top': 'var(--safe-area-top, 0px)',
        'safe-bottom': 'var(--safe-area-bottom, 0px)',
      },
    },
  },
};
```

3. Replace a representative screen section (start with `ShopPanel`) by swapping classes:
   - `gap-4` → `gap-md`
   - `px-4` → `px-lg`
   - `py-2` → `py-sm`

   Keep a running list of replacements to share in the PR description.
4. Run `npm run build` to ensure Tailwind picks up the new utilities.

> Tailwind treats arbitrary strings like `px-[var(--spacing-md)]`, but aligning to named utilities keeps purge working and mirrors our design tokens.

---

## Step 2 – Introduce `TabPageSurface` layout primitive (≈60 min)

Non-home tabs duplicate padding, safe-area math, and scrolling styles. Wrap them once.

```tsx
// webapp/src/components/layout/TabPageSurface.tsx
import clsx from 'clsx';
import { forwardRef } from 'react';
import { useSafeArea } from '@/hooks';

interface TabPageSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  insetTop?: number; // defaults to MainScreen HEADER_RESERVE_PX
}

export const TabPageSurface = forwardRef<HTMLDivElement, TabPageSurfaceProps>(
  ({ className, insetTop = 56, style, children, ...rest }, ref) => {
    const { safeArea } = useSafeArea();
    const topPadding = Math.max(0, safeArea.content.top) + insetTop;

    return (
      <div
        ref={ref}
        style={{ paddingTop: `${topPadding}px`, ...style }}
        className={clsx('px-lg pb-lg flex-1 flex flex-col gap-lg', className)}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
```

**Rollout plan:**

- Update `MainScreen.tsx` to render `<TabPageSurface>` around the non-home content instead of manually applying `px-4` / inline padding.
- Remove redundant padding in `ShopPanel`, `BoostHub`, `LeaderboardPanel`, `ProfilePanel`, and `SettingsScreen` once the wrapper is in place.
- Ensure virtualization parents (e.g., `BuildingsPanel`) continue to receive the `ScrollContainerContext` node; do not break `react-virtuoso`’s `scrollParent` injection.

Run through each tab after the change to confirm scroll behaviour, safe-area spacing, and transitions remain smooth.

---

## Step 3 – Keyboard & screen reader spot check (≈45 min)

Telegram Mini App UX guidelines require accessible focus management. Validate the key flows:

1. **Shop Tabs:** Navigate with arrow keys, `Home/End`, and `Enter` (already wired). Ensure focus outlines remain visible after the spacing refactor.
2. **Settings Toggles:** Confirm `Tab` order, toggle activation via `Space/Enter`, and visible focus ring (`focus-ring` class).
3. **Back-to-tap FAB:** After tab switch, press `Tab` to ensure the floating button becomes focusable and returns users to `Home` with `Enter`.
4. Capture issues in the accessibility backlog table (`README.md` section 3). Fix regressions immediately if critical.

Reference: Telegram Mini App UI Guidelines – Safe Areas & Focus Management (docs.telegram-mini-apps.com/platform/safe-areas). Apply any missing requirements (e.g. dynamic viewport handling) while touching the code.

---

## Step 3½ – Fullscreen & Safe Areas in SDK 8 (≈15 min)

- Subscribe to `onTelegramFullscreenChange` from `services/telegram` to react to the new `fullscreenChanged`/`fullscreenFailed` events exposed in `@twa-dev/sdk@8`. The helper keeps `document.documentElement` in sync via `data-tg-fullscreen` and the `--tg-fullscreen` CSS var.
- Use `requestTelegramFullscreen` / `exitTelegramFullscreen` for dedicated fullscreen flows (e.g. intro carousel); fall back gracefully if Telegram returns `UNSUPPORTED`.
- Safe areas now update via `contentSafeAreaChanged`, so prefer the CSS tokens (`--tg-content-safe-area-*`) over custom resize logic whenever possible.

---

## Step 4 – Regression checklist (≈30 min)

- [ ] `npm run lint && npm run typecheck`
- [ ] `npm run build`
- [ ] Manual smoke on iOS Safari + Android Chrome within Telegram
- [ ] Verify animations stay within 300–400 ms budget (`ScreenTransition`, `Button` haptics)
- [ ] Update `README.md` changelog and mark checklist items complete

Total elapsed: ~3 hours. Extend scope only after the baseline refactor lands.
