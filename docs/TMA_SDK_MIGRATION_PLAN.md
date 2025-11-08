# План перехода на `@tma.js/sdk` и `@tma.js/sdk-react`

> Обновлено: 8 ноября 2025. Официальные рекомендации Telegram Mini Apps: https://docs.telegram-mini-apps.com/packages/tma-js-sdk и https://docs.telegram-mini-apps.com/packages/tma-js-sdk-react.

## 1. Цели
- Перейти с любых остатков `@telegram-apps/*` на поддерживаемые пакеты `@tma.js/*`.
- Сократить ручные обвязки вокруг Telegram WebApp API, подключив провайдер/сигналы из `@tma.js/sdk-react`.
- Сохранить fallback-режим без Telegram (браузер/CI).
- Обеспечить измеримый rollout (телеметрия + флаги + rollback).

## 2. Список потребителей сервисов `services/tma/*`
| Файл | Что использует | Целевой источник |
| --- | --- | --- |
| `webapp/src/main.tsx` | `core`, `viewport`, `theme` | `TmaSdkProvider` + React эффекты |
| `hooks/useSafeArea.ts` | `viewport` | кастомный `useViewportSignal` (через `useSignal(viewport.state, ...)`) |
| `hooks/useTheme.ts` | `theme` | `useSignal(themeParams.state, ...)` + `miniApp` |
| `hooks/useTelegramMainButton.ts` | `mainButton` | `useMemoizedMainButton` (обёртка над классом `MainButton`) |
| `hooks/useTelegramBackButton.ts` | `backButton` | `useSignal(backButton)` + собственный hook |
| `services/preferencesSync.ts` | `cloudStorage` | класс `CloudStorage` из `@tma.js/sdk` |
| `services/tma/motion.ts` | `viewport`, `swipeBehavior` | оставить, но получать экземпляры через провайдер |
| `services/tma/haptics.ts` | `hapticFeedback` | (опционально) объединить с `useHaptic` |

## 3. Предварительные шаги
1. Проверить версии: `npm ls @tma.js/sdk @tma.js/sdk-react` и обновиться до последних `^3.0.0`.
2. Убедиться, что `@telegram-apps/*` отсутствуют в package.json (или помечены к удалению).
3. Создать feature-flag `useTmaReactProviders` (zustand/uiStore) для мягкого включения.
4. Подготовить телеметрию: события `sdk_provider_init`, `sdk_provider_error`, `legacy_viewport_fallback_used`.

## 4. Фаза A — инфраструктура
1. **`TmaSdkProvider` компонент**:
   - Оборачивает `<App />` в `SDKProvider` и выполняет то, что сейчас делает `services/tma/core` (init, mount viewport/theme/miniApp, ready, expand, disable swipe).
   - Ловит ошибки init и логирует `sdk_provider_error`.
   - Повторно экспортирует через контекст ссылку на `miniApp`, `viewport`, `themeParams`, `swipeBehavior`, `mainButton`, т.к. `sdk-react` не даёт готовых хуков.
2. **`useSignal` адаптеры**:
   - `useViewportSignal` — `return useSignal(viewport.state, () => ({ safeArea: viewport.safeAreaInsets(), metrics: viewport.state.snapshot() }))`.
   - `useThemeParamsSignal` — слушает `themeParams.state`.
   - Аналогично для `backButton`, `mainButton`, `cloudStorage` (через классы `BackButton`, `MainButton`, `CloudStorage`).
3. **Fallback без Telegram**:
   - Если `isTMA()` бросает, возвращаем моковые объекты (как сейчас в services), чтобы тесты/Storybook не падали.

## 5. Фаза B — миграция хуков и сервисов
1. `useTheme` переводим на `useThemeParamsSignal`; старый сервис `services/tma/theme.ts` сокращается до вспомогательной логики CSS.
2. `useSafeArea` подписывается на `useViewportSignal`; `services/tma/viewport.ts` поэтапно упраздняем (оставляем только CSS-calcs и overrides из тестов).
3. `useTelegramMainButton` → `useMainButtonController` (использует класс `MainButton`, обновляет цвета + onClick, хранит loader state).
4. `useTelegramBackButton` переписываем на `useSignal(backButton)`, удаляем ручное `ensureTmaSdkReady`.
5. `preferencesSync`/`cloudStorage` — создаём `getCloudStorage()` из провайдера, чтобы не трогать глобал.
6. `motion.ts`, `haptics.ts` — инжектим зависимости через провайдер, логируем ошибки через общий helper.

## 6. Фаза C — main.tsx и сторы
1. Удаляем прямые вызовы `ensureTmaSdkReady`, `onTmaSafeAreaChange`, `onTmaThemeChange`; эти эффекты переезжают внутрь новых хуков (`useSafeAreaTelemetry`, `useThemeTelemetry`).
2. Обновляем `window.__tmaDebug`: команды должны дергать методы из провайдера (`miniApp.requestFullscreen()` и т.д.).
3. gameStore/uiStore получают данные только из hooks — никаких импортов `services/tma/*`.

## 7. Тесты и мок-слой
1. Playwright: обновить `setupStageMocks` — если `window.__safeAreaOverride` задан, `useViewportSignal` читает его перед подпиской (legacy fallback уже логирует `legacy_viewport_fallback_used`).
2. Добавлен `MockTmaProvider` (`webapp/src/providers/MockTmaProvider.tsx`) — используем в unit/Storybook для подмены SDK объектов.
3. E2E: добавить smoke-тест, что `sdk_provider_init` шлётся при запуске.

## 8. Rollout & rollback
1. Включаем флаг `useTmaReactProviders` в dev → staging → prod с мониторингом телеметрии.
2. Если ошибки растут, флаг выключаем, возвращаемся к legacy сервисам (они остаются до завершения rollout, но за фичефлагом).
3. После успешного rollout удаляем legacy код, чистим доки/гайды.

## 9. Документация
- Обновить `docs/INTEGRATION_GUIDE.md`, `COMPONENT_ARCHITECTURE.md`, `UI_IMPLEMENTATION_INDEX.md`, `AGENTS.md` (выполнено частично).
- Добавить раздел в `docs/ARCHITECTURE_STATUS_BAR_FULL_ANALYSIS.md` о провайдерах.
- Поддерживать `docs/TMA_SDK_MIGRATION_REVIEW.md` синхронно (фиксить устаревшие рекомендации).
