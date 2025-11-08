# TMA SDK Runtime Overview

_Дата обновления: 8 ноября 2025_

Эта заметка описывает финальную архитектуру интеграции Telegram Mini Apps после перехода на `@tma.js/sdk` + `@tma.js/sdk-react`.

## 1. Точка входа
- `webapp/src/providers/TmaSdkProvider.tsx` оборачивает `<App />`, инициализирует `@tma.js/sdk`, расширяет viewport, отключает вертикальный свайп, синхронизирует тему/ safe-area/ viewport.
- Провайдер пишет телеметрию `sdk_provider_init` и `sdk_provider_error`, регистрирует `window.__tmaDebug` команды (`requestFullscreen`, `exitFullscreen`) и hotkey `/debug_safe_area`.
- Текущее состояние SDK прокидывается через контекст (`useTmaRuntime`) и параллельно сохраняется в `tma/runtimeState.ts`, чтобы сервисы вне React могли дергать те же экземпляры.

## 2. Хуки и сигналы
- Safe area / viewport: `hooks/useViewportSignal.ts` использует `useSignal(viewport.state, ...)`; `useSafeArea` читает снапшоты, обновляет телеметрию и отдаёт финальные отступы.
- Тема: `hooks/useThemeSignal.ts` подписывается на `themeParams.state`; `useTheme` хранит только производную `colorScheme` и пишет `theme_hook_update`.
- Main/Back buttons: пользовательские хуки (`useTelegramMainButton`, `useTelegramBackButton`) берут `mainButton`/`backButton` из `useTmaRuntime`, настраивают цвета/loader и fallback.

## 3. Сервисы `services/tma/*`
Все сервисы (mainButton, backButton, haptics, cloudStorage, motion, invoice, initData) сначала пытаются взять объект из `getTmaRuntimeSnapshot()`. Если провайдер ещё не запущен (например, в тестах), вызывается `ensureTmaSdkReady()` и используется глобальный экземпляр SDK. Так мы избегаем двойной инициализации и держим состояние централизованным.

## 4. Телеметрия
- `sdk_provider_init` / `sdk_provider_error` — статус запуска.
- `legacy_viewport_fallback_used` — когда Playwright/Storybook overrides (`window.__safeAreaOverride`, `__viewportMetricsOverride`) задействованы.
- `safe_area_hook_sample`, `theme_hook_update`, `viewport_action` — для мониторинга runtime событий.

## 5. Тесты
- Playwright: `tests/utils/stageMocks.ts` может включить Mock-провайдер (флаг `useMockProvider`). Safe-area / viewport overrides продолжают работать и теперь отмечаются в телеметрии.
- Юнит/Storybook: используем `providers/MockTmaProvider.tsx`, чтобы подменить объекты SDK.

## 6. Документация
- Основные гайды (`AGENTS.md`, `INTEGRATION_GUIDE.md`, `COMPONENT_ARCHITECTURE.md`, `UI_IMPLEMENTATION_INDEX.md`) теперь прямо ссылаются на официальный стек `@tma.js/*`.
- Исторический анализ (`docs/TMA_SDK_MIGRATION_REVIEW.md`) содержит пометку, что решения по `@telegram-apps/*` оставлены только для контекста.

Если добавляется новый функционал Telegram Mini Apps, его следует регистрировать в `TmaSdkProvider` и передавать через `useTmaRuntime`, чтобы сохранить единый источник истины.
