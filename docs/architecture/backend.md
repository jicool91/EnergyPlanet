# Backend архитектура

## 1. Слои и соглашения
- **Вход**: Express app (`backend/src/index.ts`) → middleware (helmet/cors/compression/json) → request context (`middleware/requestContext.ts`) → rate limiting (`middleware/rateLimiter.ts`) → роуты `src/api/routes/**`.
- **Контроллеры**: тонкие адаптеры (`src/api/controllers`) — валидируют payload, вызывают сервисы, формируют ответы.
- **Сервисы** (`src/services/**`): бизнес-логика. Обязательные правила: все изменения данных внутри `transaction()` (см. `db/connection.ts`), репозитории не вызываются из контроллера напрямую.
- **Репозитории** (`src/repositories/**`): CRUD поверх PostgreSQL (`runQuery`, `PoolClient`).
- **Кэш/Redis**: `src/cache/**` (подключение, ключи, invalidation). Используется для TapAggregator, rate-limiters, leaderboard cache, chat limits, telegram init replay.
- **Миграции**: чистый SQL в `backend/migrations/*.sql`. Нумерация фиксированная (001 … 017).

## 2. Основные подсистемы
### 2.1 Аутентификация и сессии
- **Эндпоинты**: `/auth/tma`, `/auth/telegram`, `/auth/refresh` (`AuthController`).
- **Логика**: `AuthService`
  - Валидация initData (`utils/telegramAuth.ts`), поддержка нескольких бот-токенов и тестового JSON payload’а (`config.testing.bypassAuth`).
  - Создание пользователя (`UserRepository`), прогресса (`ProgressRepository.createDefaultProgress`), профиля (`ProfileRepository.ensureProfile`).
  - Refresh tokens: JWT с `family_id`, `version`. Ротация и аудит (`SessionRepository.rotateSessionToken`, `session_refresh_audit`).
  - Replay protection: `cache/telegramInitReplay.ts` хранит hash initData в Redis.
  - Метрики: `recordUserLoginMetric`, `recordAuthRequestMetric`, `recordSessionRotationMetric`.
- **Tick auth**: `authenticateTick` позволяет использовать авторизацию через Telegram init, если bearer отсутствует (встроено в `/tick`).

### 2.2 Gameplay (Tap/Tick/Upgrade/Session)
- **TapService**: проверяет лимиты (50 тапов/запрос, Redis-счётчики per-second/minute), считает энергию с учётом бустов/престижа/достижений, кладёт батч в Redis (`TapAggregator`, flush каждые 0.5s или после 50 тапов). Логи — `logEvent('tap_rate_limit', ...)`.
- **TapAggregator**: flush → transaction → `ProgressRepository.updateProgress`, `EventRepository.logEvent('tap_batch')`, `AchievementService.syncMetric`. Также пишет Prometheus метрики (batch latency, energy, XP).
- **TickService**: рассчитывает пассивный доход. Ключевые элементы:
  - `player_sessions` (`007_player_sessions.sql`) хранит `last_tick_at` и `pending_passive_seconds`.
  - Предел оффлайна = `config.session.maxOfflineHours`.
  - Итог → обновление `progress`/`player_sessions`, event `tick`, метрики latency/success/error (`metrics/tick.ts`).
- **SessionService**: `openSession` возвращает сводный JSON (user, progress, инвентарь, бусты, косметика, feature flags, offline gains). Автодарит `solar_panel` новичкам. `recordLogout` пишет `logout` event, обновляет `lastLogout`, пишет метрику длительности.
- **UpgradeService**: массовые покупки/апгрейды зданий. Опирается на `ContentService` (стоимость, лимиты), `InventoryRepository`, `calculatePurchaseXp`. Логирует `building_purchase`/`building_upgrade`.
- **Passive income**: `services/passiveIncome.ts` строит snapshot для Tick/Session.

### 2.3 Квесты/Достижения/Престиж
- **QuestService**: definitions (`backend/content/quests/quests.json`), таблица `quest_progress` (`010`). Автообновление раз в `questResetScheduler` (каждые 15 минут). `QuestService.claim` выдаёт энергию/XP/Stars (adjusts `progress` и `stars_balance`). Метрики `recordQuestClaimMetric`.
- **AchievementService**: definition tables (`008`). Методы: `syncMetric` (обновляет прогресс при событиях), `getOverview`, `claimNextTier` (увеличивает `achievementMultiplier`, может выдавать косметику). Косметика прописана в `ACHIEVEMENT_COSMETIC_REWARDS`.
- **PrestigeService**: threshold `1e12`, минимум 50 уровень. `performPrestige` сбрасывает инвентарь/бусты, увеличивает `prestigeMultiplier`, логирует `prestige_performed`. Данные → `ProgressRepository` (колонки из миграции `006`).

### 2.4 Контент и лидерборды
- **ContentService**: читает YAML/JSON из `backend/content`. Типы: buildings, cosmetics, quests, feature flags, star packs, referrals, seasons. Поддерживает reload, конвертирует в структуры для сервисов.
- **LeaderboardService**: кеширует топ-лист в Redis (ключи `cacheKeys.leaderboardTop(limit)`), умеет доставать запись игрока, если тот не в кеше. Источник данных — `leaderboard_global` view (`001`).
- **SeasonService**: работает с `season_progress`, `season_rewards`, `season_events` (`017`). Публичные эндпоинты `/season/current`, `/season/leaderboard`, `/season/progress`, `/season/claim-leaderboard-reward`.

### 2.5 Монетизация и рефералы
- **PurchaseService**: invoice + mock purchases. Таблица `purchases` (`001`). После успешной покупки начисляет Stars, вызывает `referralRevenueService.handlePurchaseReward`. Метрики: `purchase_invoice`, `purchase_completed`, `user_lifetime_value`, `conversion_events`.
- **CosmeticService**: синхронизирует каталоги (`content/cosmetics`), auto-unlock free/level cosmetic, покупка за Stars (`adjustStarsBalance`), экипировка (`ProfileRepository.updateEquipment`).
- **BoostService**: конфигурация через feature flags (`content/flags`). Типы: ad/daily/premium, cooldownы учитываются через Redis `getLastBoostClaim`. `BoostController` отдаёт hub и обрабатывает claim.
- **ReferralService**: код, активация, награды, косметика, milestones (`011` + `content/referrals.json`). Ограничения на ежедневные активации/награды, события логируются. Есть событие revenue share (`referralRevenueService`).
- **ReferralRevenueService**: таблицы `referral_revenue_events`/`totals` (`014`), начисляет Stars referrer’у за покупки приглашённых (с учётом дневных/месячных cap'ов), логирует и кеш инвалидации профиля.

### 2.6 Социальные функции
- **ChatService**: глобальный чат (`global_chat_messages`, миграции `015` + `016`). Cursor encoding (base64url). Rate-limit через Redis. DTO возвращают автора (прогресс + косметика). Метрики пока не собраны, но есть события `logEvent('chat_message')`.
- **Leaderboard, профиль, друзья**: `socialRoutes` обслуживает `/leaderboard`, `/profile/:id`, `/friends` (TODO). Профили используют кеш `cacheKeys.profile(userId)`.

### 2.7 Телеметрия и админ
- **TelemetryController**: принимает `event`, фильтрует payload (safe area, viewport, render latency, tap success). Все значения валидируются (`sanitizeLabel`, `extractSafeAreaSnapshot`). Ставит метрики в `metrics/telemetry.ts` и писать event в `events` таблицу.
- **AdminService**: проверка миграций (чтение `backend/migrations`), health-check (DB/Redis), season snapshot, управление session family (ревокации), `monetizationAnalyticsService` (агрегация событий `events`).

## 3. Фоновые процессы
- **QuestResetScheduler**: каждые 15 минут делает UPDATE `quest_progress`, сбрасывая baseline и статусы.
- **SessionAuditPruner**: каждые 60 минут удаляет старые записи `session_refresh_audit`, используя `config.security.refreshAuditRetentionDays`.
- **TapAggregator**: setInterval 500ms, flush pending пользователей.

## 4. Кэш и Redis
| Назначение | Ключ | TTL |
|-----------|------|-----|
| Tap buffer | `tap:{userId}` + set `tap:pending` | 5s + lock 1s |
| Tap rate-limit | `tap:{userId}:sec:{epoch}` / `tap:{userId}:min:{epoch}` | 2s / 120s |
| Leaderboard cache | `energyplanet:{env}:leaderboard:top:{limit}` | `config.cache.ttl.leaderboard` (30s) |
| Profile cache | `energyplanet:{env}:profile:{userId}` | `config.cache.ttl.profile` (15s) |
| Telegram init replay | `tma:init:{hash}` | `TELEGRAM_AUTHDATA_MAX_AGE_SEC` |
| Global chat rate | `chat:global:rate:{user}` | `GLOBAL_CHAT_RATE_WINDOW_SEC` |

## 5. Метрики и логи
- См. `backend/src/metrics/` для полного списка. Обязательно инкрементируйте соответствующие counters/histograms при добавлении новой логики.
- Логи: Pino, requestId в AsyncLocalStorage, локально `pino-pretty`, прод — JSON.

## 6. Добавление новой фичи
1. **Миграция** → SQL файл `backend/migrations/0xx_feature.sql`, зарегистрировать в `AdminService.getMigrationStatus` автоматически.
2. **Repo & сервис** → новый файл в `src/repositories` / `src/services`, подключить в контроллер/роут.
3. **Метрики** → определить в `metrics/*`, экспортировать помощники.
4. **Документация** → обновить `architecture/data-model.md`, добавить описание работы в нужный раздел.

Этот документ держите рядом при ревью — он описывает контракт между слоями и основные инварианты.
