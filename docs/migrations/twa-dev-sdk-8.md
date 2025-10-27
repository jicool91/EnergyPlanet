# Миграция `@twa-dev/sdk` 7.10.1 → 8.0.x

## Что изменилось в SDK и веб-API

- Релизы 8.0.0–8.0.2 синхронизированы с майским обновлением Telegram Mini Apps 2.0: появились новые события (`activated`, `deactivated`, `contentSafeAreaChanged`, `fullscreenChanged`), методы (`requestFullscreen`, `lockOrientation`, `addToHomeScreen`) и расширенные `safeAreaInset`/`contentSafeAreaInset` поля в объекте `Telegram.WebApp`.
- Telegram обновил официальный скрипт `telegram-web-app.js` до версии `?56` — в нём исправлены safe area и fullscreen поведение на iOS и Android.
- `@twa-dev/sdk` 8.0.x подтягивает свежие типы (`@twa-dev/types@8`) и гарантированно совместим с React 19 (см. релиз `v8.0.2`).

## Как затронет наш код

Мы в кодовой базе не используем готовые React-компоненты SDK, но активно работаем с `window.Telegram.WebApp` в `webapp/src/services/telegram.ts`. Обновление важно по двум причинам:

1. **Типы:** при переходе на TypeScript 5.6+ и React 19 мы получим корректные декларации новых событий и методов. Это избавит от кастомных `type`-совместимостей и `@ts-expect-error` при вызове `requestFullscreen` и `contentSafeAreaInset`.
2. **Поведение:** текущие проблемы с верхним отступом напрямую связаны с устаревшим скриптом `telegram-web-app.js`. Обновление до `?56` фиксирует переносимые значения `contentSafeAreaInset.top`.

## План действий

1. Обновить зависимости:
   ```bash
   npm install @twa-dev/sdk@^8.0.2 @twa-dev/types@^8.0.2
   ```
2. Обновить скрипт в `webapp/index.html`:
   ```diff
-    <script src="https://telegram.org/js/telegram-web-app.js"></script>
+    <script src="https://telegram.org/js/telegram-web-app.js?56"></script>
   ```
3. В `services/telegram.ts` использовать новые названия событий SDK (camelCase) и добавить обработчики `contentSafeAreaChanged` / `fullscreenChanged` — часть работы уже сделана, проверить реализации после обновления типов.
4. Ввести минимальную обёртку из SDK вместо прямого чтения `window.Telegram` (используем динамический `import('@twa-dev/sdk')`, чтобы избежать `window`-ошибок при сборке) — это даёт типобезопасный доступ и гарантирует инициализацию перед использованием. Потребуется адаптировать функции `getWebApp()` и `getMainButton()`.
5. Прогнать smoke-тесты на iOS/Android: убедиться, что safe area и fullscreen запускаются одинаково при открытии через разные кнопки (стандартную и кастомную `Play`).
6. Задокументировать новые возможности в UI-доках (например, как реагируем на `fullscreenChanged` и где брать `--tg-fullscreen`).

## Чек-лист

- [x] Обновлены `package.json` / `package-lock.json`.
- [x] Вёрсия скрипта Telegram в `index.html` = `?56`.
- [x] `services/telegram.ts` использует camelCase события и экспортирует новые хелперы (`requestFullscreen` / `exitFullscreen`, `onTelegramFullscreenChange`).
- [ ] На устройствах safe-area корректна, fullscreen включается для обеих кнопок запуска (нужна ручная проверка на iOS/Android).
