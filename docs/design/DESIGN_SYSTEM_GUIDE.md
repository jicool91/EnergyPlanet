# Design System Guide — Energy Planet TMA

Updated: 5 Nov 2025

## Quick Start
- Keep this file open with `docs/design/UI_UX_ANALYSIS.md` when working on UI tickets.
- Source of truth for tokens lives in `webapp/src/styles/tokens.css`; Tailwind utilities mirror these values.
- Run `npm run lint` and `npm run typecheck` in `webapp/` after any design token or component change.
- Use `npm run test:contrast` before PRs that touch colors to validate AA ratios for core pairs.

## Pillars
1. **Platform-native theming:** respect Telegram theme parameters first, then overlay brand flair.
2. **Ergonomic, accessible controls:** every tap target ≥44 px with visible focus feedback.citeturn2search3turn8search0
3. **Immersive but performant motion:** guard 60 fps experiences and adapt to Mini Apps 2.0 full-screen capabilities.citeturn2news12turn7search0
4. **Clarity of progression:** economy data must be legible and contrast-compliant at a glance.

## Theming & Tokens
- **Inherit theme params:** On init, read `Telegram.WebApp.themeParams` and map directly to CSS variables (`accent_text_color`, `section_bg_color`, etc.).citeturn14search2
- **Update on runtime events:** подписывайтесь на `'themeChanged'` и `'viewportChanged'` через `services/tma/theme.ts` и `services/tma/viewport.ts`, чтобы мгновенно переливать цвета и safe-area без перезагрузки.citeturn15search0
- **Synchronise background:** вызывайте `Telegram.WebApp.setBackgroundColor` (обёртка в `services/tma/theme.ts`) при смене экранов, чтобы избежать белых вспышек на Android.citeturn15search0
- **Token authoring rules:**
  - Use semantic naming (`--color-surface-secondary`) instead of raw color descriptions.
  - Provide light-mode overrides where Telegram supplies alternate values.
  - Document every addition with usage notes inside `tokens.css`.
- **Gradient usage:** reserve holographic gradients for prestige/legendary states; keep primary CTAs in solid accent colors for contrast compliance.citeturn8search0
- **Dual-accent palette:** `--color-accent-cyan`, `--color-accent-magenta`, и `--gradient-ai`/`--gradient-soft` обеспечивают второй акцент для ROI/бустов — подключайте их через Tailwind (`bg-accent-cyan`, `bg-gradient-ai`).
- **Новые ключи платформы:** расширяйте `TELEGRAM_THEME_VARIABLES` (`utils/telegramTheme.ts`) под `tertiary_bg_color`, `text_color_contrast` и другие обновления v6.10.citeturn14search2

## Typography
- Default stack remains system UI fonts defined in `index.css`.
- Bind typographic tokens to component props (`Text`, `Heading`, `StatLabel`) rather than inline Tailwind classes to prevent drift.
- Enforce minimum body size at 14 px и учитывайте `preferencesStore.reduceMotion`, чтобы уменьшение анимаций не ломало верстку.citeturn16search0

## Layout & Spacing
- Use the 8 px base grid (`--spacing-*` tokens). Never hardcode arbitrary Tailwind spacing if a token exists.
- Respect safe-area variables from `index.css` when anchoring headers, nav bars, and floating CTAs to dodge notches and foldable creases.citeturn2news12
- Tabs and segmented controls should wrap gracefully at 320 px width; prefer horizontal scroll over shrinking hit areas.
- Для полноэкранного режима используйте `miniApp.requestFullscreen()` и высоты из `Telegram.WebApp.viewportHeight`, обновляя отступы через `index.css`.citeturn2news12

## Interaction Components
- **Buttons:** Standardise around `<Button>` variants; ensure padding yields ≥44 px height. Use accent fills for primary, subdued surfaces for secondary.
- **Icon Buttons:** Wrap icons with the `TouchTarget` helper (add if missing) to enforce minimum touch dimensions.citeturn2search3
- **Cards:** Leverage `Card` elevation levels. Use `outlined` variant sparingly in dark mode to maintain contrast.citeturn8search0
- **Feedback:** Pair animations with haptics (`useHaptic`) for level-ups and rare drops; keep fallback vibration optional for accessibility.
- **Async states:** Show skeletons or shimmer loaders under 300 ms, progress spinners after that. Keep status text accessible with live regions.
- **Forms:** `components/Input.tsx` и `ModalBase` должны отдавать `aria-describedby` и использовать `text-caption` + `--color-error` для ошибок; избегайте `placeholder` как единственного источника метки.

## Motion & Performance
- Mini Apps must feel native: preload critical sprites, cap request animation loops, and audit long tasks to meet 60 fps targets.citeturn7search0
- When enabling immersive mode, reflow layout using `viewportExpand()` APIs and re-compute safe-area offsets to prevent input overlap.citeturn2news12
- Add telemetry for frame duration and dropped frames so we can regression-test animations.
- Honour `prefers-reduced-motion` by disabling particle bursts and replacing them with subtle fades.citeturn16search0
- Wire the in-app `preferencesStore.reduceMotion` flag into `TapCircle`, `TapParticles`, `ProgressBar` and any new animation hooks — fallback to subtle opacity fades when true.
- При необходимости наклонов используйте `useGyroscope` (`services/tma/motion`) — гироскоп включаем даже при full-screen; не забывайте отключать его при `reduceMotion` или отсутствии поддержки.citeturn1search1turn6view0
- Ленивая загрузка: тяжёлые анимации из `components/animations` подключайте через `React.lazy`, а звуки — по событию, чтобы не блокировать первый тап.

## Accessibility Checklist
- Contrast: text/background pairs must hit ≥4.5 : 1 (AA). Automate checks with `npm run test:contrast` (axe-lite script against the token pairs) + Storybook snapshots.citeturn8search0
- Keyboard/Switch: ensure `focus-ring` utility yields visible outlines and that tab order matches logical flow.
- Touch targets: audit `sm` button variants and ensure padding enforces ≥44 px both directions.citeturn2search3
- Copy: localise Russian/English strings via i18n tables; avoid fixed-width copy in buttons.
- Motion: respect reduced-motion preferences; provide toggle if the experience relies heavily on effects.citeturn16search0

## Implementation Workflow
1. Draft UI in Figma using token names.
2. Introduce or update tokens in `tokens.css`; add matching Tailwind plugin config if needed.
3. Implement components, using hooks (`useTheme`, `useSafeArea`) instead of `window.Telegram` references.
4. Validate in Telegram test clients (iOS & Android) plus web preview to ensure theme parity.
5. Run `npm run lint`, `typecheck`, and manual accessibility spot checks before opening PR.
6. Во вложениях к PR добавляйте скриншоты тёмной/светлой темы, короткий клип immersive-режима и результаты проверки контраста.

## Module Reference
- `webapp/src/styles/tokens.css`: держите единую палитру и обновляйте комментарии при добавлении токена.
- `webapp/src/index.css`: управляет safe-area и fallback-темами; изменения тестируйте на iOS/Android.
- `webapp/src/services/tma/theme.ts`, `viewport.ts`: единственная точка входа к Telegram SDK; не обращайтесь к `window.Telegram` напрямую в компонентах.
- `webapp/src/components/Button.tsx`, `Card.tsx`, `tap/TapCircle.tsx`: эталонные реализации высот, фокусов и анимаций — при доработке копируйте паттерны сюда.
- `webapp/src/hooks/useHaptic.ts` + `store/preferencesStore.ts`: хранение пользовательских настроек и включение/выключение эффектов; расширяйте при добавлении новых паттернов.
- `webapp/src/services/telemetry.ts`: буферизация UX-событий; добавляйте события для новых фич, чтобы мерить влияние на экономику и retention.
