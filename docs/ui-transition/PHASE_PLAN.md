# План фаз миграции UI

## Фаза 1 — Подготовка окружения (≤ 1 день)
- Выполнить `npm ci` в `webapp/` и убедиться, что lock-файл не меняется (React 19.2, Vite 5, Tailwind 3.4.18, Zustand 5 остаются актуальными).
- Сравнить токены в `tailwind.config.js`, `src/index.css` с `docs/COLOR_SCHEMES.md`, добавить недостающие переменные и custom properties.
- Добавить feature flag `isNextUiEnabled` в `webapp/src/store/uiStore.ts` с persisted state, предусмотреть переключение через query-параметр для QA.
- Снять baseline-метрики: React Profiler (commit time), DevTools Performance (TTI/CLS) и скриншоты `MainScreen`, сохранить в `_evidence/phase1`.

**Артефакты:** запись в `QA_CHECKLIST.md` («Подготовка»), baseline-метрики и скриншоты в `docs/ui-transition/_evidence/phase1`.

## Фаза 2 — Каркас и навигация (1–1.5 дня)
- Создать `components/layout/AppLayout.tsx` с учётом safe-area (`env(safe-area-inset-*)`) и ограничением ширины `max-w-xl`, использовать `motion-safe` и `motion-reduce` классы Tailwind.[^telegram-viewport][^tailwind-best]
- Адаптировать `components/TabBar.tsx` в `layout/BottomNavigation.tsx`: пять вкладок, активное состояние, `aria-current="page"`, поддержку `KeyboardEvent`.
- В `App.tsx` внедрить `react-router-dom` с отдельными `Suspense`-границами на каждый экран (`Tap`, `Exchange`, `Friends`, `Earn`, `Airdrop`) и переключением через `startTransition`.[^react192]
- Создать заглушки экранов в `src/screens/` и обернуть их в `loadable` функции с `React.lazy`.
- Зафичефлагить новый layout, оставив legacy `MainScreen` доступным при выключенном флаге.

**Критерии:** переключение флага рендерит пустые экраны с корректной навигацией, метрики baseline ±5 % от старого UI.

## Фаза 3 — UI-кирпичики и токены (2 дня)
- Сформировать `src/styles/tokens.css`: цветовые переменные, радиусы, spacing, типографика. Подключить их в Tailwind через `theme.extend` и CSS variables.[^tailwind-tokens]
- Рефакторить `Button`, `Card`, `ModalBase`, `Badge`, `Toast`: состояния hover/active/disabled, focus-visible, вариации размеров, слоты иконок.
- Создать общие компоненты `ProgressBar`, `Text`, `SectionTitle`, используемые на Tap/Earn/Airdrop.
- Настроить глобальные анимации: для появления использовать `framer-motion` с `AnimatePresence`, добавить fallbacks при `prefers-reduced-motion`.
- Обновить документацию в `COMPONENT_MIGRATION_MAP.md` (колонка «Статус» + принятые компромиссы) и приложить скриншоты в `_evidence/phase3`.

**Критерии:** UI-компоненты покрывают все состояния из `UI_SCREENS.md`, линт/тайпчек/сборка проходят без ошибок.

## Фаза 4 — Tap Screen (2–3 дня)
- Разделить `MainScreen` на независимый `TapScreen`, вынести модули: `TapCircle`, `DailyTasksBar`, `StatsSummary`, `BoostHub`, `LeaderboardPreview`.
- Подключить React 19 hooks: использовать `useEffectEvent` для подписок на стор, `startTransition` при переключении вкладок, `Suspense` для lazy-панелей (`ShopPanel`, `BuildingsPanel`, `LeaderboardPanel`, `ProfileSettingsScreen`).[^react-best]
- Оптимизировать сторы: селекторы с `useShallow`, мемоизированные вычисления (`useMemo`, `useDeferredValue`) для больших списков.
- Перенести хаптик (`useHaptic`), нотификации (`useNotification`), телеметрию (`logClientEvent`) в переиспользуемые хуки с корректной очисткой.
- Провести smoke на устройствах iOS/Android, проверить safe-area, gestures и производительность в Telegram.

**Критерии:** Tap Screen соответствует `UI_SCREENS.md`, TTI и commit time не хуже baseline, бусты и Prestige работают без регрессий.

## Фаза 5 — Остальные экраны и финализация (3+ дня)
- Реализовать `ExchangeScreen`, `FriendsScreen`, `EarnScreen`, `AirdropScreen` по документации, переиспользуя компоненты из `components/common`.
- Соединить бизнес-логику: `ShopPanel` → покупки зданий, `Friends` → реферальные API, `Earn` → задания, `Airdrop` → события/сезоны. Добавить телеметрию переходов.
- Обновить deeplink-и CTA (баннеры, кнопки) так, чтобы они использовали `react-router-dom` вместо кастомной логики.
- Удалить legacy-блоки `MainScreen`, обновить сторы, тесты и `COMPONENT_MIGRATION_MAP.md`. Обновить QA чеклист и пометить пункты выполненными.
- Подготовить release notes, собрать скриншоты нового UI, включить feature flag по умолчанию после прохождения чеклиста.

**Деливереблы:** релизная ветка, обновлённый changelog, комплект скриншотов, заполненный `QA_CHECKLIST.md`.

[^react192]: React Team. “React 19.2.” *React.dev Blog*, October 1, 2025. https://react.dev/blog/2025/10/01/react-19-2.
[^react-best]: Jay Sarvaiya. “React 19 Best Practices: Write Clean, Modern, and Efficient React Code.” *DEV Community*, October 2025. https://dev.to/jay_sarvaiya_reactjs/react-19-best-practices-write-clean-modern-and-efficient-react-code-1beb.
[^tailwind-tokens]: Nadia Nicol. “Integrating Design Tokens with Tailwind CSS.” *Nicolabs Portfolio*, April 2025. https://portfolio.nicolabs.co.uk/integrating-design-tokens-with-tailwind-css/.
[^tailwind-best]: Steve Kinney. “Tailwind Best Practices.” *stevekinney.com*, 2025. https://stevekinney.com/courses/tailwind/tailwind-best-practices.
[^telegram-viewport]: Telegram. “Viewport.” *Telegram Mini Apps Docs*, October 2025. https://docs.telegram-mini-apps.com/platform/viewport.
[^telegram-rules]: Telegram. “Telegram Apps Center Rules.” *Telegraph*, May 16, 2024. https://telegra.ph/Telegram-Apps-Center-Rules-05-16.
