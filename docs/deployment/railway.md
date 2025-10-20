# Railway Deployment Guide

Этот гайд описывает, как развернуть Energy Planet (новый backend + webapp для мини-игры) на Railway с отдельными сервисами `backgame` и `frontgame`, а также завести новую базу данных и Redis.

> ⚠️ Railway требует подключённый GitHub‑репозиторий. После настройки каждый `git push` в выбранную ветку будет автоматически запускать деплой.

## 1. Подготовка репозитория

В репозитории уже добавлены файлы конфигурации `backend/railway.json` и `webapp/railway.json`. Они используют новый билд‑движок Railway **Railpack** и задают:

- builder `RAILPACK`,
- запуск (`npm run start` для backend, `npm run preview:prod` для frontend),
- health-check (`/health` для API, `/` для webapp),
- политику перезапуска.

Также добавлены адаптации конфигурации:

- `backend/src/config/index.ts` понимает стандартные Railway‑переменные (`DATABASE_URL`, `PGHOST`, `REDIS_URL` и т.д.),
- Redis‑клиент умеет работать с `redis://`/`rediss://` URL,
- `webapp/package.json` содержит скрипт `preview:prod`, который слушает `$PORT` (Railway выдаёт его автоматически).

## 2. Создание Railway‑проекта

1. Залогиньтесь в [Railway](https://railway.app/) и создайте новый проект (или используйте существующий).
2. Подключите репозиторий GitHub (`New > GitHub Repo`).
3. На шаге «Setup repository» Railway предложит создать один сервис — просто выберите репозиторий и переходите к настройке сервисов вручную (см. далее).

## 3. Добавляем сервисы

Для раздельных окружений создаём два сервисa:

### Backend (`backgame`)

1. `New > Service > Empty Service`.
2. В названии укажите, например, `backgame` (Railway позволит использовать произвольное имя, главное — не пересекаться с уже существующим `backend`).
3. В настройках сервиса:
   - `Source` → выберите подключённый GitHub‑репозиторий и ветку `main` (или нужную).
   - `Root Directory` → `backend`.
   - `Config-as-code` → `backend/railway.json`.
4. В разделе Variables добавьте/проверьте:
   - `NODE_ENV=production`
   - `API_PREFIX=/api/v1`
   - `RAILPACK_INSTALL_CMD=npm ci`
   - `RAILPACK_BUILD_CMD=npm run build`
   - значения из Postgres/Redis (см. ниже).

### Frontend (`frontgame`)

1. `New > Service > Empty Service`.
2. Имя, например, `frontgame`.
3. `Source` → тот же репозиторий и ветка.
4. `Root Directory` → `webapp`.
5. `Config-as-code` → `webapp/railway.json`.
6. В Variables установите `NODE_ENV=production`, `VITE_ENV=production`, `RAILPACK_INSTALL_CMD=npm ci`, `RAILPACK_BUILD_CMD=npm run build`. Настоящий API URL добавим позже, когда появится домен backend‑сервиса.

## 4. Подключаем Postgres и Redis

1. `New > Database > PostgreSQL` → Railway создаст отдельный сервис (например, `postgres-game`).
2. `New > Database > Redis` → создайте `redis-game`.
3. Зайдите в Postgres‑сервис, нажмите `Connect` и скопируйте переменные окружения (`PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `DATABASE_URL`). Через панель можете «Share» их с сервисом `backgame`.
4. То же самое для Redis (`REDIS_URL`, `REDISHOST`, `REDISPASSWORD`, `REDISPORT`).
5. В сервисе `backgame` проверьте, что появились переменные (Railway проставит их автоматически через Shared Variables). Никаких дополнительных переменных `DB_HOST`/`REDIS_HOST` больше не нужно — конфиг читает стандартные `PG*` и `REDIS_URL`.

> После первого деплоя не забудьте прогнать миграции (см. раздел «Миграции»).

## 5. Настройка переменных окружения

- **Backend (`backgame`):**
  - `TELEGRAM_BOT_TOKEN` — ваш продакшен‑бот.
  - `TELEGRAM_BOT_USERNAME`, `TELEGRAM_MINI_APP_URL` — по необходимости.
  - `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` — задайте безопасные значения.
  - `CONTENT_PATH` можно оставить по умолчанию (`/app/content`).
  - Если Redis должен работать по TLS — Railway `REDIS_URL` уже приходит с `rediss://`, ничего менять не надо.

- **Frontend (`frontgame`):**
  - `VITE_API_URL` — укажете, когда узнаете домен backend‑сервиса. Пример: `https://backgame.up.railway.app/api/v1`.
  - `VITE_CDN_URL`, `VITE_ENV`, `VITE_API_URL` — остальные переменные по желанию.

## 6. CI/CD (автодеплой)

Railway сам запускает деплой при каждом `git push` в выбранную ветку. Убедитесь, что:

- в настройках сервиса включён `Auto Deploy` для `main` (или другой ветки),
- опция `Run Build Again` стоит в `Always` (Railpack пересоберёт артефакты при каждом пуше),
- переменные `RAILPACK_INSTALL_CMD`/`RAILPACK_BUILD_CMD` выставлены (см. выше).

При необходимости ограничьте автодеплой feature-веток, добавив «Deploy on PR merge only».

## 7. Миграции

После первого релиза:

1. На Railway откройте `backgame` → `Shell`.
2. Выполните команды:

   ```bash
   npm run migrate:up
   npm run seed   # если нужно наполнить дефолтные данные
   ```

3. Для повторных релизов миграции будут уже применены, но при добавлении новых SQL‑файлов снова запускайте `npm run migrate:up`.

## 8. Сборка фронтенда

Railpack выполнит команды, указаные в переменных `RAILPACK_INSTALL_CMD` и `RAILPACK_BUILD_CMD` (см. шаги 3 и 5). После сборки `npm run preview:prod` запускает Vite Preview на `0.0.0.0:$PORT`.

Если нужен полностью статический хостинг (без Node-процесса), можно подключить Railway Static Sites и просто отдавать `dist/`. Текущая схема проще: работает из коробки.

## 9. Обновление Telegram Mini App

После каждого релиза убедитесь, что:

- новый фронтовый домен указан в BotFather (`/setdomain`),
- `VITE_API_URL` указывает на актуальный backend,
- при необходимости обновлены `TELEGRAM_MINI_APP_URL` и CDN.

## 10. Траблшутинг

- **Вылетает по health-check:** проверьте, что `PORT` не захардкожен (backend читает Railway `PORT`, frontend — стартует на `PORT` через `preview:prod`).
- **Нет доступа к БД / Redis:** убедитесь, что переменные с Postgres/Redis действительно «attached» к `backgame` (в Railway UI → Variables → `Shared with`).
- **Миграции не запускаются:** Railpack не знает о SQL-миграциях — запускайте `npm run migrate:up` вручную через Shell или настройте Deploy Hook (`Deployments > Hooks`).
- **Vite выдаёт CORS:** проверьте `VITE_API_URL` и CORS на backend (`config.cors.origin`). На Railway можно задать список разрешённых origins через переменную `CORS_ORIGIN` (`https://frontgame.up.railway.app`).

## 11. Автоматизация (по желанию)

- Добавьте GitHub Action, который перед деплоем прогоняет `npm run lint && npm run typecheck` для обоих пакетов.
- Подписывайте релизы тэгами и включите Railway «Deploy from tag» для более контролируемых выпусков.

Готово! После этих шагов у вас будут два отдельных Railway‑сервиса (`backgame`, `frontgame`), новая база данных, Redis, и автоматический деплой при каждом пуше.
