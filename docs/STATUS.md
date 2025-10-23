# Energy Planet – Project Status
**Last Updated:** October 23, 2025 | **Phase:** UI Optimization + Backend Integration

---

## 🎯 Frontend UI/UX Improvement Roadmap

### Фаза 1: Design System ✅ **ЗАВЕРШЕНА**
- ✅ Tailwind config с design tokens (colors, spacing, shadows, typography)
- ✅ Все цвета нормализованы (cyan, lime, gold, red на основе palette)
- ✅ Spacing scale на 8px базе (sm/md/lg/xl/2xl)
- ✅ Typography иерархия (display, heading, body, caption, micro)
- ✅ Border radius стандартизирован (sm/md/lg/xl)
- ✅ Shadows система (sm/md/lg/xl)

**Результат:** Единая фундаментальная система дизайна | **Коммиты:** 2

---

### Фаза 2: Component Refactor ✅ **ЗАВЕРШЕНА** (23 октября 2025)
- ✅ 5 базовых компонентов созданы: Button, Card, Input, Badge, ModalBase
- ✅ 10 существующих компонентов переделаны с новыми компонентами
- ✅ ~330 строк дублирующегося кода удалено
- ✅ 100% TypeScript типизация
- ✅ TypeScript: PASS (0 errors)
- ✅ Build: PASS (938ms)

**Результат:** Компонентная библиотека готова к использованию | **Коммиты:** 10

---

### Фаза 3: Layout Optimization ✅ **100% COMPLETE** (13 из 13 микротасков)

#### ✅ Завершено:
- ✅ **Task 3.1** – Анализ MainScreen и планирование tap-first layout
- ✅ **Task 3.2** – HomePanel компонент создан (Big Tap Button, Stats Panel)
- ✅ **Task 3.3** – MainScreen переделан на tap-first layout (тап в центре)
- ✅ **Task 3.4** – TabBar компонент с scroll поддержкой (830ms build)
- ✅ **Task 3.5** – MainScreenHeader & TapSection компоненты (832ms build)
- ✅ **Task 3.6** – TabBar на глобальный уровень App.tsx (830ms build)
- ✅ **Task 3.7** – Lazy loading всех панелей с React.lazy + Suspense (918ms build, код splitting ✅)
- ✅ **Task 3.8** – Stats cards оптимизация (2-column grid, 904ms build)
- ✅ **Task 3.9** – Compact Level Bar с hover tooltip (918ms build, интегрирован в header)
- ✅ **Task 3.10** – XPProgressCard компонент (906ms build, рефакторинг HomePanel)
- ✅ **Task 3.11** – Quick Actions в header (shop + settings, интегрирован в App.tsx, 892ms build)
- ✅ **Task 3.12** – Optimize vertical scroll layout (убрал excessive padding, уменьшил gaps, 976ms build)
- ✅ **Task 3.13** – Scroll-to-top functionality (useScrollToTop hook, floating Back-to-Tap button, smooth scroll)

**Статус:** ✅ ГОТОВО! | **Результат:** Tap-first layout, global nav, lazy loading, optimized stats, level bar, XP card, quick actions header, mobile-optimized scroll, back-to-tap button | **Коммиты:** 11

---

### Фаза 4: Performance, Polish & Marketing UX 🟡 **67% COMPLETE** (8 из 12 микротасков)

#### ✅ Завершено:
- ✅ **Task 4.1** – Loading states для асинхронных операций (BuildingCard, ShopPanel spinner)
- ✅ **Task 4.2** – Error/Warning/Success toast компоненты (Alert с типами success/error/warning/info)
- ✅ **Task 4.3** – Skeleton loaders для всех панелей (animate-shimmer во всех skeltons)
- ✅ **Task 4.4** – Featured item визуализация в Shop (gold badge + lime border + highlightBadge prop)
- ✅ **Task 4.5** – Social proof элементы (Friends playing card в HomePanel)
- ✅ **Task 4.6** – Daily reward/Special offer баннер (с real-time countdown timer)
- ✅ **Task 4.7** – Leaderboard улучшения (медали 🥇🥈🥉, позиция с progress bar, разница энергии, highlight текущего игрока)
- ✅ **Task 4.8** – Level up анимации (rotating star ring, 8x sparkles, enhanced glow, text shadow animations)

#### ⏳ TODO:
- [ ] Task 4.9 – Micro-interactions для кнопок (hover/tap scale эффекты)
- [ ] Task 4.10 – Image loading оптимизация (lazy loading, WebP)
- [ ] Task 4.11 – Progress indicators (animated progress bars с градиентами)
- [ ] Task 4.12 – Haptic feedback для всех действий (success/error patterns)

**Результат:** Polish UI, marketing элементы, better UX | **Коммиты:** 8

---

### Фаза 5: Monetization UX ⏳ **NEXT** (2-3 дня)
- [ ] Task 5.1 – Stars индикатор в Header (⭐ + число)
- [ ] Task 5.2 – Quick Top-Up кнопка (🛍️)
- [ ] Task 5.3 – Shop Header улучшение (заголовок, featured section)
- [ ] Task 5.4 – Recommended/Best Value badges
- [ ] Task 5.5 – Bundle визуализация Star Packs
- [ ] Task 5.6 – Price comparison для Star Packs

**Результат:** Явная монетизация, выделена на главной, улучшена конверсия

---

## 📊 Overall Progress

| Фаза | Статус | Микротаски | Коммиты | Дата |
|------|--------|----------|--------|------|
| 1 | ✅ DONE | 12/12 | 2 | Oct 19 |
| 2 | ✅ DONE | 14/14 | 10 | Oct 23 |
| 3 | ✅ DONE | 13/13 | 11 | Oct 24 |
| 4 | 🟡 67% | 8/12 | 8 | Oct 24 |
| 5 | ⏳ NEXT | 0/6 | 0 | Oct 26+ |
| **TOTAL** | **🟢 75%** | **47/63** | **31** | **In Progress** |

---

## Backend Status – October 21, 2025

## ✅ Готово
- **Сессии**: `/api/v1/session` возвращает прогресс, бусты, косметику, инвентарь и фич-флаги; оффлайн-доход начисляется автоматически.
- **Косметика**: `/api/v1/cosmetics`, `/cosmetics/purchase`, `/cosmetics/equip` (mock Stars) + автодовыдача free/level предметов.
- **Бусты**: `/api/v1/boost/claim` (ad/daily/premium), кулдауны и логирование (`events`).
- **Mock Stars**: `/api/v1/purchase/invoice` → `/api/v1/purchase`, заглушка `/purchase/webhook`; idempotent запись в `purchases`.
- **Тесты**: `backend/src/__tests__/monetization.e2e.test.ts` покрывает основные монетизационные маршруты.
- **Инфра ручки**: `/api/v1/admin/migrations/status` (счётчик применённых/ожидающих миграций) и `/api/v1/admin/health/full` (DB/Redis/migrations) для он-колла.
- **Core Loop**: Redis-буфер тапов + воркер (`tap_batch_processed`), таблица `tap_events`, лог `offline_income_grant`, автодовыдача первой `solar_panel` после онбординга.
- **Frontend polish**: streak-комбо, пассивный HUD, оффлайн-модалка и очередь POST-запросов.
- **Safe Area UI Fix** (commit f992f25): исправлена проблема исчезающего footer при переключении на длинные вкладки; правильный grid layout + overflow constraints в CSS.
- **Frontend Shop**: магазин косметики с табами, отображением цен в Stars, ручным обновлением и fallback-состояниями.
- **Star Packs**: контент `monetization/star_packs.json`, бэкенд ручка `/api/v1/purchase/packs`, фронтовая витрина и mock-покупка через инвойс.
- **Boost Hub**: `GET /api/v1/boost` возвращает активные бусты/кулдауны, фронт показывает таймеры и активации; `/tap` учитывает множитель бустов, `tap_batch_processed` логирует `base_energy` и `boost_multiplier`.
- **Buildings UI**: вкладка «Постройки» в клиенте (на `/session` приходят `inventory`), можно покупать/апгрейдить; бэкенд `UpgradeService` в ответах возвращает актуальные доходы/стоимость. `/buildings` отдаёт каталог с окупаемостью, `roi_rank`, а контент пополнен новыми зданиями (биомасса, приливы, орбитальные, антиматерия).
- **Telemetry**: `/api/v1/telemetry/client` + клиентский `logClientEvent` для ошибок оффлайн-дохода и покупок.
- **DB Performance**: композитный индекс `idx_progress_energy_rank` для лидерборда и `idx_events_user_type_created_at` для быстрого поиска последних `boost_claim`.
- **Redis Cache**: профили игроков кешируются на 15 секунд с инвалидацией после апдейтов (сессия, бусты, косметика); TTL для лидерборда вынесен в конфиг.

## 🔄 В работе / В планах
- **Telegram Stars (боевое)**: проверка подписи webhook, хранение `telegram_payment_id`, награждение товарами.
- **Rewarded Ads**: интеграция Yandex.Direct + буст от просмотра рекламы.
- **Фронтенд**: витрина Star-паков, бусты, косметика, отображение `pay_url` из инвойса.
- **DevOps**: Dockerfile, CI/CD, staging.

## 📎 Подсказки по локальной проверке
1. **Cosmetics**
   ```bash
   curl -H "Authorization: Bearer <token>" https://type-arc-derby-analyzed.trycloudflare.com/api/v1/cosmetics
   ```
   Затем покупка/экипировка с тем же токеном.
2. **Stars mock**
   ```bash
   # Инвойс
   curl -X POST .../purchase/invoice -d '{"purchase_id":"mock-1","item_id":"stars_pack_small","price_stars":100}'
   # Завершение
   curl -X POST .../purchase -d '{"purchase_id":"mock-1","item_id":"stars_pack_small","price_stars":100}'
   ```
3. **Boost**
   ```bash
   curl -X POST .../boost/claim -d '{"boost_type":"daily_boost"}'
   ```

## 📅 Следующие шаги
1. Реализовать реальный Telegram Stars webhook: валидация `X-Telegram-Bot-Api-Secret-Token`, расшифровка payload, выдача наград.
2. Подготовить выдачу наград (энергия, бусты, косметика) на базе данных `purchases`.
3. Доработать UI для отображения `pay_url`, подтверждения Stars и витрины бустов.
4. Спланировать rewarded-ads флоу и хранилище токенов.
5. Чекнуть баланс Tier1–3 на staging, обновить гайдики для саппорта.

## ⚙️ Railway окружение (prod & staging)
- `DATABASE_URL` – основная PostgreSQL (используется пулом и миграторами).
- `REDIS_URL` – Redis для тап-буфера, rate-limit и очередей.
- `TELEGRAM_BOT_TOKEN` – перечисление токенов через запятую; первый используется по умолчанию.
- `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` – параметры токенов.
- `MOCK_PAYMENTS` – `true` на staging для Stars-мока; `false` в prod.
- `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS` – пер-тройки rate-limit (Railway UI → Variables → Service Variables).
- `YANDEX_AD_BLOCK_ID`, `YANDEX_AD_TOKEN_SECRET` – секреты rewarded ads (секция Railway → Secrets).
- `ADMIN_TELEGRAM_IDS`, `SUPER_ADMIN_TELEGRAM_ID` – права в админке.
- `LOG_LEVEL`, `LOG_FORMAT`, `LOG_FILE_PATH` – поведение логгера; логи отправляются в Railway logs.

_Где хранить_: Railway → "Variables" (переменные окружения), Railway → "Secrets" (креды) + локальные `.env` на разработку (`backend/.env`, `webapp/.env`).

## 🔍 Трассировка логов (Auth / Migrations / Redis)
- **Auth flow**: `logs/app.log` или Railway logs → фильтр `Telegram authentication failed` / `User authenticated`; payload содержит `reason`, `initDataLength`, обрезанный `botToken`, `telegramUserId`.
- **Миграции**: `GET /api/v1/admin/migrations/status` → проверка `applied/pending/lastAppliedAt`; дополнительные провалы видны как WARN `schema_migrations table missing`.
- **Redis**: `GET /api/v1/admin/health/full` → блок `checks.redis`; подробные ошибки → логи с тегом `Redis`.

## 🧪 Ручные сценарии авторизации
1. **Валидное initData** – Telegram devtools → `window.Telegram.WebApp.initData` из актуальной сессии → ожидать 200 и заполнение стора.
2. **Просроченное initData** – изменить `auth_date` на >24ч назад → ожидать 401 и модалку с подсказкой перезапустить мини-приложение.
3. **Повреждённое initData** – удалить `hash` или ухудшить JSON → ожидать 400/401 и лог `reason: invalid_telegram_hash`.
4. **BYPASS** – локально установить `BYPASS_TELEGRAM_AUTH=true`, передать JSON `{"id":123}` → проверить, что fallback-профиль создаётся и лог `Bypass auth` отображается.

_Автор: автообновление CLI, дата 21.10.2025_
