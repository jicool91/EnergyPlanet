# Локальная среда разработки

## 1. Предпосылки
- **Node.js ≥ 18** и **npm ≥ 9** (совпадает с `engines` в `backend/package.json` и `webapp/package.json`).
- **PostgreSQL 15** и **Redis 7** (можно не ставить вручную, если используете `docker-compose`).
- **pnpm/yarn не используются** — только npm.
- Для Telegram Mini App режима откройте фронтенд в `https://t.me/<bot>?startapp` или включите mock-режим (`TELEGRAM_BOT_TOKEN` не обязателен для dev, можно использовать тестовый payload в AuthService).

## 2. Переменные окружения
Создайте `.env` в корне (или экспортируйте переменные) — сервер берёт значения через `backend/src/config/index.ts`, клиент читает `VITE_*` переменные.

Пример `.env` для дев-сборки:
```
# Backend
PORT=3000
HOST=0.0.0.0
API_PREFIX=/api/v1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=energy_planet
DB_USER=energyplanet_app
DB_PASSWORD=dev_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev_jwt_secret
TELEGRAM_BOT_TOKEN=000000:TEST
TELEGRAM_BOT_USERNAME=energy_planet_dev_bot
TELEGRAM_MINI_APP_URL=https://t.me/energy_planet_dev_bot/app
ADMIN_TELEGRAM_IDS=123456789
PROMETHEUS_ENABLED=true
LOG_LEVEL=debug

# Frontend
VITE_API_URL=http://localhost:3000/api/v1
VITE_DISABLE_TELEMETRY=false
```
> Совет: если запускаете через docker-compose, переменные из `.env` автоматически попадут в контейнеры.

## 3. Быстрый старт через Docker Compose
```
# из корня репозитория
cp .env.example .env   # при наличии шаблона, иначе создайте вручную
npm install --prefix backend
npm install --prefix webapp

# запустить postgres+redis+ оба сервиса
docker compose up --build
```
Команда поднимет:
- `postgres` (порт 5432, прогоняет `backend/migrations/*.sql`);
- `redis` (порт 6379);
- `backend` (Node 18 + `npm run dev`);
- `webapp` (Vite dev-сервер на 5173).

## 4. Ручной запуск без Docker
```
# backend
cd backend
npm install
npm run build      # компилирует TS и копирует content/migrations в dist
npm run migrate    # применяет все миграции (использует dist/db/migrate)
npm run dev        # nodemon + ts-node src/index.ts

# webapp
cd ../webapp
npm install
npm run dev        # http://localhost:5173 (проксирует API по VITE_API_URL)
```
Дополнительно:
- `npm run seed:dev` — заполнить dev-данные.
- `npm run bootstrap:db` — создаёт пользователя/БД (см. `backend/scripts/bootstrap-db.ts`).

## 5. Telegram аутентификация
- В дев-режиме можно включить `TEST_MODE`/`BYPASS_TELEGRAM_AUTH` в `.env`, чтобы `AuthService` принимал JSON с user id (`src/services/AuthService.ts`, ветка `config.testing.bypassAuth`).
- Для реального потока создайте тестового бота, пропишите токен в `TELEGRAM_BOT_TOKEN` и откройте мини-приложение через `https://t.me/<bot>?startapp=debug` — фронт возьмёт initData из Telegram.

## 6. Работа с контентом
- Backend читает пакеты из `backend/content/**` (здания, квесты, сезоны, монетизация, флаги). В dev-режиме включён `config.content.reloadIntervalMin` (по умолчанию 60 минут). Для быстрого обновления перезапустите backend.
- Клиент использует токены безопасной зоны из `shared/tokens/safe-area.json`. При изменениях выполните `npm run dev` в `webapp/` для пересборки.

## 7. Хелперы и диагностика
- **Health check**: `curl http://localhost:3000/health` — проверяет PostgreSQL и Redis (`backend/src/index.ts`).
- **Prometheus**: включите `PROMETHEUS_ENABLED=true` и переходите на `http://localhost:3000/metrics` (basic auth задаётся в `.env`).
- **Логи**: backend пишет JSON в stdout и, при `LOG_ENABLE_FILE_TRANSPORTS=true`, в `backend/logs/`.
- **Reset Redis cache**: `redis-cli FLUSHDB` (или `npm run script -- cache:flush` если добавите скрипт).

Следуйте этому гайду вместе с `setup/testing-and-quality.md`, чтобы локальная среда оставалась воспроизводимой.
