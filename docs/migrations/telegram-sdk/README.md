# Миграция с `@twa-dev/sdk` на `@tma.js/sdk-react`

## Текущий статус (27.10.2025)

- В `webapp/package.json` установлен `@twa-dev/sdk@^8.0.2`, доступ к Mini Apps инкапсулирован в `webapp/src/services/telegram.ts` (одна большая обёртка над `window.Telegram.WebApp`).
- React-компоненты напрямую используют функции из этой обёртки, а провайдера для Telegram окружения нет.
- Проект уже на React 19 + Zustand 5, поэтому зависимость от `@twa-dev/sdk` — единственный «устаревший» слой.

## Цель

Перейти на официальный набор `@tma.js/sdk-react`, чтобы:

1. Получать обновления Mini Apps без ручной поддержки обёрток.
2. Использовать готовые React-хуки (`useMiniApp`, `useLaunchParams`, `useBackButton`, `useClosingBehavior` и т.д.).
3. Нормализовать тесты и SSR (в `tma.js` есть моки и симуляторы окружения).
4. Отказаться от прямых обращений к `window.Telegram.WebApp`.

## План миграции

### Шаг 0. Подготовка

- Убедиться, что `VITE_DISABLE_TELEMETRY` в `.env` явно выставлено, чтобы отличить тестовые события после миграции.
- Зафиксировать текущие точки доступа к сервису Telegram (`rg "from '../services/telegram'" webapp/src`).

### Шаг 1. Добавляем зависимости

```bash
npm install @tma.js/sdk-react
npm uninstall @twa-dev/sdk @twa-dev/types
```

> Выполняем в отдельной ветке. После установки появится peer-зависимость от `@tma.js/sdk`. Она подтянется автоматически.

### Шаг 2. Включаем провайдер

1. В `webapp/src/main.tsx` оборачиваем `<App />` в `SDKProvider`:
   ```tsx
   import { SDKProvider } from '@tma.js/sdk-react';
   import { createSDK } from '@/services/tma/sdkFactory';

   ReactDOM.createRoot(...).render(
     <React.StrictMode>
       <SDKProvider sdk={createSDK()}>
         <App />
       </SDKProvider>
     </React.StrictMode>
   );
   ```
2. `createSDK()` — утилита, где настраиваем `initOptions`, моки и обработку ошибок (см. `services/tma/sdkFactory.ts`, создадим на шаге 3).

### Шаг 3. Строим адаптерный слой

- Создаём папку `webapp/src/services/tma/` и файлы:
  - `sdkFactory.ts` — экспортирует `createSDK()`, внутри `initMiniApp({ async: true })`, `withLaunchParams()`, обработка fallback (например, когда приложение открывают вне Telegram).
  - `hooks.ts` — реэкспортируем хуки (`useMiniApp`, `useThemeParams`, `useViewport`) для компонентов.
  - `telegramBridge.ts` — временный слой совместимости:
    ```ts
    import { useMiniApp, useThemeParams, ... } from './hooks';

    export function useTelegramMainButton() {
      const miniApp = useMiniApp();
      return miniApp?.mainButton;
    }
    ```
  - В этом файле реализуем те же функции, что были в `services/telegram.ts`, но через `tma.js` (например, `miniApp.ready()`, `miniApp.expand()`).

### Шаг 4. Поэтапная замена вызовов

1. **Новые компоненты**: используют только адаптер из `services/tma/telegramBridge`. Старый файл `services/telegram.ts` оставляем пока как legacy.
2. **Постепенно заменяем импорты** (`rg "from '../services/telegram'"`). Для каждой вкладки:
   - импортируем соответствующий хук из `services/tma/telegramBridge`;
   - переписываем логику (например, `triggerHapticImpact` → `useHapticFeedback()`).
3. После миграции всех вызовов удаляем `services/telegram.ts` и чистим импорты.

### Шаг 5. Удаляем legacy-зависимости и тестируем

- Убедиться, что в `webapp/package.json` нет `@twa-dev/*`.
- Погонять smoke-тест: запуск через Telegram + мини-приложение в WebView. Особое внимание на события `safeAreaChanged`, `backButton`, `cloudStorage`.
- Проверить телеметрию: новые события (`miniApp.ready`, ошибки) должны отправляться уже из `tma.js`.

## Учёт рисков

| Риск | Как снижаем |
| --- | --- |
| Потеря функциональности (новые API) | Каждую фичу сверяем с документацией `@tma.js/sdk-react` (есть аналогичные методы). Если чего-то нет — оставляем временные polyfill’ы в `telegramBridge.ts`. |
| Проблемы в старых компонентах | Мигрируем по вкладкам, после каждого шага проверяем Suspense (в Zustand уже используем `useShallow`). |
| SSR / тесты | Если появятся проблемы, используем `@tma.js/sdk-react/testing` — там уже есть моки Mini Apps. |

## Метрики готовности

- [ ] В `main.tsx` используется `SDKProvider` из `@tma.js/sdk-react`.
- [ ] Все компоненты импортируют хуки из `services/tma/telegramBridge.ts` (нет прямых вызовов `window.Telegram`).
- [ ] `services/telegram.ts` удалён.
- [ ] `npm run lint`, `typecheck`, `build` проходят.
- [ ] Smoke на устройстве: вкладки «Boost Hub», «Рейтинг», «Профиль» корректно работают; `backButton`, `share`, `cloudStorage` ведут себя как раньше.

После выполнения чек-листа фиксируем миграцию в `docs/migrations/react-19.md` и удаляем legacy-обёртки.
