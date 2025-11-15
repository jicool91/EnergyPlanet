# Energy Planet — документация проекта

> Telegram Mini App «Energy Planet» — это кликер/идл-менеджер, работающий внутри Telegram. Репозиторий объединяет сервер (Node.js/Express + PostgreSQL/Redis), клиент (React 19 + Vite) и инфраструктурные артефакты (Docker, Kubernetes, Jenkins, Prometheus/Grafana, контентные пакеты).

## Как читать документацию
- **Перед стартом разработки**: откройте `setup/local-development.md` (локальная среда) и `setup/testing-and-quality.md` (линтинг, тесты, QA).
- **Чтобы понять архитектуру**: читайте `architecture/system.md` как обзор, затем углубляйтесь в `architecture/backend.md`, `architecture/frontend.md`, `architecture/data-model.md` и `architecture/content-pipeline.md`.
- **Про релизы и эксплуатацию**: смотрите `deployment/environments.md`, `deployment/ci-cd.md`, раздел runbooks и `process/release-management.md`.
- **Метрики и алерты**: `analytics/metrics-and-alerting.md` плюс дашборды в `infra/grafana`.
- **Обучение**: `training/new-engineer-onboarding.md` и `roadmap/2025.md` для контекста, куда движется продукт.

## Слои системы (коротко)
1. **Клиент** (`webapp/`)
   - React 19 + Zustand, интеграция с `@tma.js/sdk`, Telemetry/CloudStorage/Viewport glue, Playwright/Chromatic QA.
2. **Сервер** (`backend/`)
   - Express, маршруты в `src/api/routes`, сервисы (Tap/Tick/Session/Prestige/Quests/Referrals/Chat/Monetization/etc.), PostgreSQL (`migrations/00x_*.sql`), Redis кеш/таски (`src/cache`, `src/services/TapAggregator.ts`).
3. **Контент** (`backend/content/`, `content/`, `shared/`)
   - YAML/JSON конфигурация зданий, сезонов, флагов, квестов, монетизации, токены безопасной зоны для UI.
4. **Инфраструктура** (`docker-compose.yml`, `k8s/`, `infra/`, `Jenkinsfile`)
   - Локальный docker-compose, CI/CD через Jenkins, деплой в namespace `energy-planet`, наблюдаемость Prometheus + Grafana, алерты.

## Критические зависимости
- Node.js ≥ 18, npm ≥ 9 (совпадает с `backend/package.json` и `webapp/package.json`).
- PostgreSQL 15 + Redis 7 (см. `docker-compose.yml`).
- Переменные окружения из `.env`/`backend/src/config/index.ts` (JWT_SECRET, DB_*, REDIS_*, TELEGRAM_* и т. д.).
- Telegram Mini App runtime (`@tma.js/sdk`) для продакшн-сборок клиента.

## Минимальный чеклист перед коммитом
1. `npm run lint && npm run test` в `backend/`.
2. `npm run lint && npm run typecheck && npm run test:qa` в `webapp/` (или хотя бы lint+typecheck при UI-изменениях).
3. Обновить/описать контентные правки в `architecture/content-pipeline.md` и, при необходимости, в `docs/roadmap/2025.md`.
4. Записать важные эксплуатационные изменения в `deployment/*` или соответствующий runbook.

## Контакты и зоны ответственности
- **Gameplay backend**: сервисы в `backend/src/services` (Tap/Tick/Upgrade/Quest/Prestige/Achievement) — владелец BE-гильдия.
- **Monetization & Referrals**: `PurchaseService`, `ReferralService`, `ReferralRevenueService`, метрики в `metrics/business.ts` — монетизационная команда.
- **Client platform**: `webapp/src/providers`, `webapp/src/services/tma/*`, Zustand-хранилища — фронтенд-гильдия.
- **Ops**: Jenkins + Kubernetes + Prometheus (`Jenkinsfile`, `k8s/`, `infra/`) — DevOps.

Любые изменения, требующие кросс-командной синхронизации (новые таблицы, публичные API, изменения в Telegram интеграции), обязательно документируйте здесь же в соответствующих секциях.
