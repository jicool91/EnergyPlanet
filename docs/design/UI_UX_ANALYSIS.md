# UI & UX Analysis — Energy Planet Telegram Mini App

Updated: 5 Nov 2025

## Executive Takeaways
- Energy Planet already leans on Telegram theme tokens and adaptive safe-area handling; the next шаг — углубить динамическую тему, ритм и отзывчивость с учётом Mini Apps 2.0, где приложения могут занимать полный экран и считывать движения устройства.citeturn2news12
- Цвета, типографика и семантические токены нужно синхронизировать с обновлённой палитрой Telegram v6.10, чтобы избежать артефактов при смене клиента или режима запуска.citeturn14search2
- Точность зон нажатия, фокусные состояния и контраст следует подтянуть до требований WCAG 2.5.5/2.5.8 и 1.4.3, не теряя фирменную динамику.citeturn2search3turn8search0
- Удержание 60 fps и предсказуемая обратная связь стали обязательны для конкуренции среди игр в Telegram; кодовой базе нужны телеметрия и троттлинг анимаций.citeturn7search0

## Research Highlights (Oct–Nov 2025)
- **Telegram platform shifts:** Mini Apps 2.0 дарят полноэкранный режим, жесты, гироскоп и ярлыки на домашний экран — интерфейс должен сразу учитывать планшеты, фолды и быстрый ре-энтри.citeturn2news12
- **Color system update:** Палитра v6.10 добавила токены `accent_text_color`, `subtitle_text_color`, `section_header_text_color`, запретив старые обходные решения.citeturn14search2
- **Touch ergonomics:** WCAG Target Size требует минимум 44 × 44 px для ключевых действий и 24 × 24 px для остальных, если нет достаточных отступов; придётся перепроверить иконки и тапы.citeturn2search3
- **Accessibility baselines:** Контраст текста должен быть ≥4.5 : 1 даже в тёмных градиентах; вторичные подписи стоит фиксировать через токены и QA.citeturn8search0
- **Performance expectations:** Для ощущения нативности интерфейсы должны держать 60 fps и укладываться в 16.7 мс на кадр.citeturn7search0

## Current Experience Snapshot (Repository Audit)
- Тема и безопасные зоны: `webapp/src/styles/tokens.css` и `webapp/src/index.css` правильно подтягивают Telegram-переменные и рассчитывают safe-area; `services/tma/viewport.ts` слушает как SDK (`viewport.state`), так и нативный `viewportChanged`/`safeAreaChanged`, обновляя алиасы `--layout-viewport-*`. Остаточные RGBA ещё встречаются в `ShopPanel` и второстепенных баннерах.
- Эксперименты: `experimentsStore` фиксирует вариант `palette_v1` (classic vs dual-accent), `TapScreen` декорирует CTA/панели под вариант и логирует exposure.
- Компоненты ввода: `webapp/src/components/Button.tsx` гарантирует высоты 40–56 px, но дочерние элементы (напр. `touch-target-sm`) и иконки в `StatsSummary`/`TapCircle` не всегда достигают 44 px по обеим осям.
- Анимации и эффекты: `TapCircle`, `TapParticles`, `ProgressBar`, `ModalBase`, `LevelUpScreen` учитывают `preferencesStore.reduceMotion`; добавлен гироскопический параллакс через `useGyroscope`, отключающийся при reduce motion. Требуется подключить оставшиеся Lottie и наградные экраны.
- Стор и телеметрия: `webapp/src/store/gameStore.ts` и `services/telemetry.ts` уже буферизуют события, что позволяет вводить UX-метрики (FPS, конверсия улучшений) без блокирующих запросов.
- Telegram SDK: `services/tma/theme.ts` и `utils/telegramTheme.ts` корректно подписываются на `themeParams` и `miniApp` события, но не учитывают новые ключи (например, `tertiary_bg_color`) и не пробрасывают изменение `colorScheme` в UI-слой.

## Strengths We Should Preserve
- **Platform-native theming:** The CSS variable pipeline already reacts to Telegram theme params; extending it to new tokens will be straightforward.
- **Game economy clarity:** Purchase insight cards and prestige flows communicate value props with succinct copy and labelled statistics.
- **Modular composition:** Cards, tab surfaces, and store panels are separated, easing targeted redesigns without breaking the main tap loop.

## Key Gaps & Risks
- **Token drift:** Остаточные RGBA в витрине (`ShopPanel`) и событиях всё ещё расходятся с новой цветовой схемой Telegram.citeturn14search2
- **Touch compliance:** Иконки и сегментные контролы легко падают ниже 44 px, что нарушает WCAG 2.5.5.citeturn2search3
- **Contrast debt:** Вторичные тексты часто опускаются ниже 4.5 : 1; без автоматической проверки легко нарушить WCAG 1.4.3.citeturn8search0
- **Full-screen readiness:** Обновлённые `index.css` и сервис `tma/viewport` реагируют на `viewportChanged` и дают алиасы для `--layout-viewport-*`, но остаётся проверить все экраны на планшетах и довести планшетную типографику.citeturn2news12
- **Motion pacing:** Частицы и Lottie не управляются метриками; без учёта 16.7 мс на кадр будет лаг.citeturn7search0

## Opportunity Themes & Recommendations
1. **Telegram token alignment**
   - Map every design token to platform equivalents (`accent_text_color`, `subtitle_text_color`, etc.) and retire bespoke gold gradients except where брендовая айдентика требует.citeturn14search2turn15search0
   - Introduce automated snapshot tests that assert token usage inside Tailwind classes to prevent regressions.
2. **Ergonomic inputs**
   - Оберните интерактивные элементы в `TouchTarget`/`IconButton` с минимумом 44 px по обеим осям и дополнительными отступами.citeturn3search4
   - Extend `focus-ring` utility to include visible outlines for keyboard and switch-control users.
3. **Full-screen & motion support**
   - Обновите layout-примитивы, чтобы учитывать `web_app_expand`, `web_app_request_fullscreen` и `viewportHeight`.citeturn2news12
   - Ограничьте интенсивные эффекты метриками FPS с деградацией на слабых устройствах.citeturn7search0
4. **Contrast & readability**
- Добавьте линтер/визуальные тесты, валящие сборку при контрасте <4.5 : 1; предусмотрите светлые fallback'и. Скриншотные прогоны идут через `npm run test:visual` (Playwright + `visual.html`).citeturn4search3
   - Provide fallback palettes for prestige and warning states that stay ≥4.5 : 1 under both theme extremes.
5. **Feedback & telemetry**
   - Connect haptic feedback to milestone events (level-ups, boost completions) and register analytics for tap cadence, upgrade conversion, and tutorial completion to validate UX improvements.

## Карта действий в репозитории
- `webapp/src/styles/tokens.css`: заменить устаревшие алиасы (`--color-lime`, `--color-orange`) на новые Telegram-токены, добавить fallback для светлой темы.
- `webapp/src/components/Button.tsx`, `Card.tsx`, `TapCircle.tsx`: внедрить `TouchTarget` HOC, проверить padding, расширить `aria`-атрибуты.
- `webapp/src/components/tap/StatsSummary.tsx`, `ShopPanel.tsx`: переписать вторичные тексты на `text-caption` с усиленным контрастом и добавить доступные ярлыки.
- `webapp/src/services/tma/theme.ts`, `utils/telegramTheme.ts`: подписаться на `viewportChanged`, пробрасывать `colorScheme`, обновить типы под новые ключи платформы.
- `webapp/src/hooks/useHaptic.ts`, `store/preferencesStore.ts`: связать `reduceMotion` и `hapticEnabled` с визуальными эффектами и предусмотренными тестами.
- Тесты/линты: добавить Storybook или VRT-прогон с проверкой контраста и размера hit area.

## Near-Term Experiments (4–6 weeks)
| Sprint | Focus | Success Signal |
| --- | --- | --- |
| 1 | Token realignment + global contrast audit | 0 lint failures across dark/light snapshots; manual QA passes on both Telegram mobile clients |
| 2 | Ergonomic touch wrappers + keyboard navigation paths | <2% tap misses in hallway test; all primary flows accessible via hardware keyboard |
| 3 | Full-screen responsive layout pilot on `TapScreen` | Positive A/B feedback on immersive mode; no layout breaks on tablets or foldables |
| 4 | Animation budget + FPS logging MVP | 95% of sessions maintain ≥58 fps on mid-tier Android devices |

## Metrics to Watch
- Daily tap streak retention % across viewport modes (standard vs. full screen).
- Upgrade conversion rate after insight card resurfacing.
- Accessibility bug count per release (target: ≤1 open issue).
- Session frame pacing (p95 frame time under 20 ms).
- Визуальные регрессии (`npm run test:visual`) — следим за diffs по ключевым экранам (офлайн-модалка, dual-accent CTA).

## Source Appendix
- Telegram Mini App design tokens update — TON Docs, Sep 2025.citeturn14search2
- WCAG 2.5.5/2.5.8 Target Size — W3C Working Draft, 5 Oct 2023.citeturn2search3
- WCAG 1.4.3 Contrast Minimum — W3C Understanding Doc.citeturn8search0
- Telegram Mini Apps 2.0 платформенный апдейт — The Verge, 18 Nov 2024.citeturn2news12
- Animation performance & 60 fps — MDN Web Docs, 23 Jun 2025.citeturn7search0
