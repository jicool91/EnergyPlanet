# QA чеклист для запуска нового UI

## Подготовка
- [ ] Выполнено `npm ci` в `webapp/` без изменения `package-lock.json`.
- [x] Токены в `tailwind.config.js` и `src/styles/tokens.css` совпадают с `docs/COLOR_SCHEMES.md`, кастомные CSS-переменные подключены через `@layer base`.
- [x] Feature flag `uiStore.isNextUiEnabled` переключается через DevTools и query-параметр `?nextUi=1`, состояние сохраняется в persisted storage.
- [ ] Baseline-скриншоты и метрики старого UI (React Profiler, DevTools Performance) сохранены в `docs/ui-transition/_evidence/phase1`.

## Каркас и навигация
- [x] `AppLayout` центрирует приложение (`max-w-xl`), корректно учитывает safe-area на iOS/Android в Telegram, использует `motion-safe`/`motion-reduce` классы.[^telegram-viewport][^tailwind-best]
- [x] `BottomNavigation` содержит 5 вкладок, состояния выделяются по макету, `aria-label`, `aria-current="page"`, стрелочная навигация и `startTransition` при переключении.
- [x] Маршруты `/`, `/exchange`, `/friends`, `/earn`, `/airdrop` рендерятся через `React.Suspense` без ошибок в консоли.
- [ ] Legacy `MainScreen` остаётся доступным при выключенном фичефлаге. _(неприменимо, legacy UI удалён 31.10.2025)_

## Экран Tap
- [x] Тап по планете обновляет энергию, streak, телеметрию (`logClientEvent`) без визуальной задержки.
- [x] Lazy-компоненты (`ShopPanel`, `BuildingsPanel`, `LeaderboardPanel`, `ProfileSettingsScreen`) подгружаются с fallback-скелетами, Suspense не блокирует основной поток.[^react192]
- [x] Прогресс-бар уровня синхронизирован с данными `gameStore`, нет мерцаний при апдейтах.
- [x] Хаптик (`useHaptic`) и тосты (`useNotification`) корректно работают на Android/iOS, тосты используют `aria-live="polite"`.

## Остальные экраны
- [x] `ExchangeScreen` показывает каталог зданий, покупки изменяют состояние магазина и записываются в телеметрию.
- [x] `FriendsScreen` выводит рефералов, кнопка share открывает Telegram share sheet, UI учитывает длительность списков (виртуализация).
- [x] `EarnScreen` отображает задачи с фильтрами, прогресс обновляется без лагов, CTA запускают требуемые потоки.
- [x] `AirdropScreen` визуализирует сезоны/ивенты, таймеры синхронизируются с API и учитывают часовой пояс пользователя.

## Производительность и стабильность
- [ ] DevTools Performance показывает <16 ms на основной поток при интенсивном тапинге, `startTransition` предотвращает подвисания.[^react-best] _(нужно замерить вручную в Telegram)_
- [ ] React Profiler: количество лишних рендеров не выросло, Suspense переходы smooth. _(требует ручного профайла)_
- [ ] `npm run test:perf` (Playwright) проходит, добавлены smoke-проверки навигации по вкладкам. _(запустить локально)_
- [ ] Логи `events` фиксируют `boost_claim`, `boost_activate`, `purchase` без дублей; метрики сохраняются в `_evidence/phase5`. _(проверить БД/лог)_

## Доступность и UX
- [x] Все интерактивные элементы имеют `role`, `aria-*`, фокус-стили `focus-visible`.
- [x] При `prefers-reduced-motion` анимации отключаются, fallback-стили читаемы.
- [ ] Контраст текста и фона соответствует WCAG AA (проверено через DevTools → Rendering → Emulate vision deficiencies). _(проверить вручную)_
- [ ] Поддерживается портретная и альбомная ориентация, safe-area не ломается при смене ориентации. _(тест на устройствах)_
- [ ] Темы Telegram (светлая/тёмная) учитываются — цвета подтягиваются из токенов и `themeParams`. _(проверить вручную)_

## Финализация
- [ ] `COMPONENT_MIGRATION_MAP.md` обновлён фактическими статусами и допущениями.
- [ ] В `docs/ui-transition/_evidence` лежат финальные скриншоты всех экранов (Tap, Exchange, Friends, Earn, Airdrop) и обновлённые метрики.
- [ ] Release notes содержат раздел «Новый UI» с перечислением изменений и рисков.
- [ ] Feature flag `isNextUiEnabled` включён по умолчанию, legacy-компоненты удалены, smoke-тесты повторно пройдены. _(флаг отключён навсегда; осталось выполнить smoke-тесты)_

[^react192]: React Team. “React 19.2.” *React.dev Blog*, October 1, 2025. https://react.dev/blog/2025/10/01/react-19-2.
[^react-best]: Jay Sarvaiya. “React 19 Best Practices.” *DEV Community*, October 2025. https://dev.to/jay_sarvaiya_reactjs/react-19-best-practices-write-clean-modern-and-efficient-react-code-1beb.
[^tailwind-best]: Steve Kinney. “Tailwind Best Practices.” *stevekinney.com*, 2025. https://stevekinney.com/courses/tailwind/tailwind-best-practices.
[^telegram-viewport]: Telegram. “Viewport.” *Telegram Mini Apps Docs*, October 2025. https://docs.telegram-mini-apps.com/platform/viewport.
