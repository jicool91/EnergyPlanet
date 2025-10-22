# Backend Status – October 21, 2025

## ✅ Готово
- **Сессии**: `/api/v1/session` возвращает прогресс, бусты, косметику, инвентарь и фич-флаги; оффлайн-доход начисляется автоматически.
- **Косметика**: `/api/v1/cosmetics`, `/cosmetics/purchase`, `/cosmetics/equip` (mock Stars) + автодовыдача free/level предметов.
- **Бусты**: `/api/v1/boost/claim` (ad/daily/premium), кулдауны и логирование (`events`).
- **Mock Stars**: `/api/v1/purchase/invoice` → `/api/v1/purchase`, заглушка `/purchase/webhook`; idempotent запись в `purchases`.
- **Тесты**: `backend/src/__tests__/monetization.e2e.test.ts` покрывает основные монетизационные маршруты.
- **Инфра ручки**: `/api/v1/admin/migrations/status` (счётчик применённых/ожидающих миграций) и `/api/v1/admin/health/full` (DB/Redis/migrations) для он-колла.
- **Core Loop**: Redis-буфер тапов + воркер (`tap_batch_processed`), таблица `tap_events`, лог `offline_income_grant`, автодовыдача первой `solar_panel` после онбординга.
- **Frontend polish**: streak-комбо, пассивный HUD, оффлайн-модалка и очередь POST-запросов.
- **Frontend Shop**: магазин косметики с табами, отображением цен в Stars, ручным обновлением и fallback-состояниями.
- **Star Packs**: контент `monetization/star_packs.json`, бэкенд ручка `/api/v1/purchase/packs`, фронтовая витрина и mock-покупка через инвойс.
- **Telemetry**: `/api/v1/telemetry/client` + клиентский `logClientEvent` для ошибок оффлайн-дохода и покупок.

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
