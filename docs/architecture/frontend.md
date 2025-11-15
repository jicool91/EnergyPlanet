# Frontend архитектура (webapp)

## 1. Технологии и сборка
- **React 19 + TypeScript** (`webapp/src`).
- **Vite 5** (`vite.config.ts`), dev-сервер на 5173.
- **Tailwind + кастомные токены** (`tailwind.config.js`, `shared/tokens/safe-area.json`).
- **Zustand** для стораджей (`src/store/*.ts`).
- **Playwright** для e2e/перф/визуальных тестов (`playwright.*.config.ts`).
- **Storybook 8 + Chromatic** для UI регрессий.

## 2. Файловая структура (ключевое)
| Каталог | Назначение |
|---------|------------|
| `src/providers` | Обвязка Telegram SDK (`TmaSdkProvider`, `MockTmaProvider`).
| `src/services` | API-клиенты (axios), доменные клиенты (quests, boosts, referrals, chat, telemetry, sessionManager), интеграции с `@tma.js/sdk` (viewport/theme/haptics/cloudStorage).
| `src/store` | Zustand-хранилища: `gameStore`, `authStore`, `chatStore`, `questStore`, `referralStore`, `preferencesStore`, `uiStore`, `experimentsStore`.
| `src/screens` | Основные экраны Mini App (Tap, Shop, Quest, Chat, Clan, Season, Admin, PvP, Profile, Friends, Airdrop).
| `src/components` | UI-кит (Surface, Buttons, TabPageSurface и т. д.).
| `src/tma` | Glue-код для метрик безопасной зоны и runtime snapshot (`renderMetrics.ts`, `runtimeState.ts`).
| `src/utils` | Логгер, форматтеры, Telegram theme tokens.

## 3. Интеграция с Telegram
- **TMA SDK и runtime**: `TmaSdkProvider` вызывает `ensureTmaSdkReady`, монтирует `miniApp`, `viewport`, `themeParams`, `swipeBehavior`, подключает CloudStorage и HapticFeedback. Snapshot хранится в `tma/runtimeState.ts`.
- **Viewport/Safe Area**: `services/tma/viewport.ts` следит за событиями от Telegram, рассчитывает CSS-переменные, отправляет телеметрию (`logClientEvent('safe_area_changed')`). Есть override/debug хуки (`window.__safeAreaOverride`).
- **Theme**: `services/tma/theme.ts` и `utils/telegramTheme.ts` пробрасывают цвета в CSS, учитывают fontScale (`miniApp.headerColor`).
- **CloudStorage**: `services/tma/cloudStorage.ts` с синхронизацией предпочтений (`services/preferencesSync.ts`).
- **Haptics**: `services/tma/haptics.ts` + `triggerHapticImpact` используется в game UI.

## 4. Состояние и бизнес-логика
- **authStore**: хранит access/refresh токены, синхронизирует между вкладками через BroadcastChannel `energyplanet-auth`. Обновлением управляет `sessionManager.ts` (self-check, proactive refresh, near-expiry предупреждения, локальная память если localStorage недоступен).
- **gameStore**: главный сторадж игрового прогресса. Фичи:
  - `initGame` → `/session` и `/profile`.
  - `tap(count)` → `/tap`, очереди `postQueue` + haptic feedback.
  - `upgrade` → `/upgrade`.
  - Passive income симуляции (buffers, timers) для сглаживания UI между тикками.
  - Лидерборды (`services/leaderboard`), профиль (`services/profile`), престиж, достижения.
- **chatStore**: polling + optimistic отправка через `/chat/global/messages` (см. `services/chat.ts`).
- **questStore`, `referralStore`, `referralRevenueStore`**: используют собственные API-адаптеры, держа кэш прогресса и метаданные (`referralStore` также комбинирует справочник наград).
- **uiStore**: тема, layout-safe-area метрики, global modals/snackbars.
- **experimentsStore**: читает feature flags (`/content/flags`), позволяет быстро переключать UI-ветки.

## 5. API client и запросы
- **axios** (`services/apiClient.ts`): автоматически ставит `Authorization` из `sessionManager`. В DEV fallback на `http://localhost:3000/api/v1`, в production — `https://backgame-production.up.railway.app/api/v1` или `window.__ENERGY_PLANET_API_URL__`.
- **requestQueue**: сериализует POSTы с экспоненциальным backoff (используется в tap/upgrade, чтобы избежать гонок).
- **Telemetry** (`services/telemetry.ts`): батчит события, отправляет в `/telemetry/client`, умеет бэкоффиться по RateLimit заголовкам.

## 6. UI/UX особенности
- **Safe-area tokens**: `SAFE_AREA_CSS_VARIABLES` и `shared/tokens/safe-area.json` позволяют UI адаптироваться под разные устройства Telegram (Android/iOS/Desktop). `renderMetrics` сохраняет снимки для отладки.
- **TabPageSurface и Surface**: основной каркас экранов — см. `TapScreen`, `SeasonScreen`, `ChatScreen`.
- **Визуальные тесты**: `tests/visual/*.spec.ts` + baseline в `docs/qa/baseline/*`.
- **Многоязычность**: строки пока на русском, поддержка перевода через константы.

## 7. Точки расширения
- Чтобы добавить новый экран:
  1. Создайте компонент в `src/screens` и экспортируйте через роутер/навигацию.
  2. При необходимости добавьте хранилище или сервис (axios wrapper) для API.
  3. Пропишите safe-area правила (используйте `TabPageSurface`).
  4. Добавьте story (Storybook) + Playwright тест.
- Чтобы добавить новый API вызов, создайте функцию в `src/services/<domain>.ts`, используйте `apiClient` и типизируйте ответ.

## 8. Жизненный цикл приложения
1. **Bootstrap**: `main.tsx` монтирует `App`, оборачивает в `TmaSdkProvider`, запускает `authStore.hydrate`.
2. **Auth bootstrap**: `sessionManager` проверяет localStorage + запускает self-check таймер, при истекающем refresh инициирует прокативание токена.
3. **Session init**: `gameStore.initGame` вызывает `/session`, получает оффлайн бонусы, синхронизирует inventory.
4. **UI loop**: нажатия → `tap` (batched), авто-транзакции upgrade/purchase → обновление стораджа/экранов.
5. **Telemetry loop**: события enqueued, flush каждые 5 секунд либо сразу при пустой очереди.

## 9. Связь с backend
| UI функциональность | API | Backend сервис |
|---------------------|-----|----------------|
| Tap/Tick | `/tap`, `/tick` | `TapService`, `TickService` |
| Магазин/Boosts | `/boost`, `/purchase/*`, `/cosmetics/*` | `BoostService`, `PurchaseService`, `CosmeticService` |
| Квесты, достижения | `/quests`, `/achievements` | `QuestService`, `AchievementService` |
| Престиж | `/prestige/status`, `/prestige/perform` | `PrestigeService` |
| Рефералы | `/referrals/*` | `ReferralService`, `ReferralRevenueService` |
| Чат | `/chat/global/messages` | `ChatService` |
| Сезон | `/season/*` | `SeasonController` |
| Админ метрики | `/admin/monetization/metrics`, `/admin/seasons/*` | `AdminService`, `MonetizationAnalyticsService` |

Этот документ служит картой для фронтенд-разработчиков: любой новый модуль должен вписываться в существующие слои (провайдеры → сервисы → zustand → компоненты) и переиспользовать инфраструктуру (apiClient, telemetry, tma glue).
