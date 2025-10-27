# Переход на `@tma.js/sdk-react`

## Статус на 27.10.2025

- `webapp` полностью переключён на `@tma.js/sdk` и `@tma.js/sdk-react`; зависимости `@twa-dev/*` удалены из `package.json`.
- Вся логика Telegram вынесена в `webapp/src/services/tma/`: `core`, `viewport`, `theme`, `mainButton`, `backButton`, `haptics`, `cloudStorage`, `initData`.
- Реактовые хуки (`useSafeArea`, `useTheme`, `useTelegramMainButton`, `useTelegramBackButton`, `useAuthBootstrap`) и игровые сторы используют адаптеры напрямую, без фиче-флагов.
- Точка входа `main.tsx` инициализирует SDK через `ensureTmaSdkReady`, синхронизирует CSS-переменные safe-area/viewport и подписывает UI-стор на обновления темы.

## Что поменялось по сравнению с legacy-слоем

| Область | Было (`services/telegram.ts`) | Стало (`services/tma/*`) |
| --- | --- | --- |
| Safe Area / Viewport | Ручные обработчики `contentSafeAreaChanged` и CSS-обновления | Сигналы `viewport.state` из SDK, автоматическое обновление `--tg-*` токенов |
| Тема | Слежение за `window.Telegram.WebApp.themeParams` | `themeParams.state.sub` + нормализация через `utils/telegramTheme` |
| Основная / Back кнопки | Прямой доступ к `WebApp.MainButton/BackButton` | Классы `mainButton` и `backButton` из `@tma.js/sdk` с fallback-логикой |
| Haptics | `HapticFeedback` через WebApp API | `hapticFeedback` из SDK, проверки `isSupported()` |
| Cloud Storage | Promise-обёртки вокруг WebApp API | `cloudStorage` из SDK, унификация ошибок |
| Init data | `webApp.initData` | `retrieveRawInitData()` |

## Итоговый чек-лист (выполнен)

- [x] Удалены `services/telegram.ts`, `@twa-dev/sdk`, `@twa-dev/types`.
- [x] Все импорты пересобраны на `services/tma/*`.
- [x] `useSafeArea`/CSS-токены получают данные из SDK; метрики viewport доступны на старте.
- [x] Основная/Back кнопки, хаптики, Cloud Storage подключены через TMA API.
- [x] `npm run lint`, `npm run typecheck`, `npm run build` проходят.
- [x] Smoke-тест по ключевым вкладкам/flows Telegram Mini App подтверждён.

## Рекомендации на будущее

- При добавлении новых возможностей Mini Apps в первую очередь проверять наличие готовых классов/хуков в `@tma.js/sdk` / `@tma.js/sdk-react`.
- Для тестов использовать `@tma.js/sdk-react/testing` — там есть симуляторы мини-приложения.
- Если потребуется SSR/Storybook, опираться на `mockTelegramEnv` из `@tma.js/sdk` вместо ручных моков.
