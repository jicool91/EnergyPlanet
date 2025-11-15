# Системная архитектура

## 1. Компоненты
| Слой | Технологии | Исходники | Ответственность |
|------|------------|-----------|-----------------|
| Клиент (Telegram Mini App) | React 19, Vite, Zustand, `@tma.js/sdk`, Tailwind токены | `webapp/` | UI, интеграция с Telegram runtime (темы, безопасные зоны, CloudStorage, hаптика), локальная логика игры (тапы, квесты, чат), отправка телеметрии. |
| API | Node.js 18, Express 4, TypeScript | `backend/src/index.ts`, `src/api/**`, `src/services/**` | Аутентификация, сессии, игровая экономика (tap/tick/upgrade), квесты, достижения, престиж, чат, косметика, покупки, сезоны, рефералы, телеметрия, админ.
| Данные | PostgreSQL 15, Redis 7 | `backend/migrations/*.sql`, `backend/src/repositories/**`, `backend/src/cache/**` | Персистентные таблицы (users/progress/inventory/quests/referrals/achievements/etc.), очереди и rate-limit в Redis, кеши лидерборда/профиля, anti-replay init-data registry.
| Контент | JSON/YAML | `backend/content/**`, `content/**`, `shared/tokens/` | Конфигурация зданий, сезонов, квестов, фич-флагов, монетизации, реферальных правил, UI safe-area токенов.
| Инфраструктура | Docker, Jenkins, Kubernetes, Prometheus, Grafana, Cloudflare CDN | `docker-compose.yml`, `Jenkinsfile`, `k8s/`, `infra/` | Локальный стенд, CI/CD, прод-namespace `energy-planet`, мониторинг, алертинг, CDN для ассетов.

## 2. Потоки данных
1. **Авторизация** — клиент получает `initData` от Telegram → `AuthController` валидирует подпись (`backend/src/utils/telegramAuth.ts`), создаёт запись в `users`/`sessions`, выдаёт JWT и включает replay-protection в Redis (`cache/telegramInitReplay.ts`).
2. **Игровой цикл** — `POST /tap` буферизуется `TapAggregator` (Redis), `POST /tick` вычисляет пассивный доход и обновляет `progress`, `SessionService.openSession` выдаёт оффлайн-награды и гарантирует стартовый инвентарь.
3. **Контент и экономика** — `ContentService` загружает YAML/JSON (здания, квесты, сезоны, star_packs, referrals). Фич-флаги (`backend/content/flags/*.json`) включают/отключают подсистемы без деплоя.
4. **Реалтайм/чат** — глобальный чат хранится в `global_chat_messages`, курсоры кодируются `ChatService`, rate-limit реализован через Redis ключ `chat:global:rate:{user}`. Клиентский `chatStore` использует optimistic UI и polling `since`.
5. **Мониторинг** — backend публикует Prometheus-метрики (`metrics/*`), клиент отправляет события в `/telemetry/client`, а алерты определены в `infra/prometheus/alerts.yml`. Grafana дашборды (`infra/grafana/dashboards/*.json`) покрывают продуктив и платформу.
6. **CI/CD** — Jenkins (`Jenkinsfile`) тестирует оба пакета, билдит Docker, пушит в Registry и выкатывает на Kubernetes (`k8s/deploy.yaml` + `k8s/configmap.yaml` + `k8s/secrets.yaml`). Перед деплоем запускается job миграций.

## 3. Внешние интеграции
- **Telegram Mini App**: SDK `@tma.js/sdk`, viewport/theme/haptics, CloudStorage, BroadcastChannel для сессий.
- **Telegram Stars**: invoice (`PurchaseController.invoice`), webhook заглушка, поддержка mock-покупок в dev.
- **Yandex Ads / rewarded ads**: конфигурация в `backend/content/flags/default.json` и `.env` (`YANDEX_AD_BLOCK_ID`).
- **Monitoring stack**: Prometheus (scrape `PROMETHEUS_SCRAPE_TARGET`), Grafana, Alertmanager (см. `infra/prometheus`).

## 4. Безопасность
- **Replay protection**: Redis hash initData (TTL = `TELEGRAM_AUTHDATA_MAX_AGE_SEC`).
- **Rate limiting**: `rateLimiter` middleware + специализированные лимитеры для tap/tick/upgrade/purchase/telemetry/auth.
- **Session hardening**: refresh token семейства (`sessions.family_id`, `session_refresh_audit`, службы Revocation).
- **Anti-cheat**: эвенты `events.is_suspicious`, правила в `content/flags`, TapService логирует подозрительные батчи.
- **Idempotency**: `purchases.purchase_id` (UUID клиентa), `global_chat_messages.client_message_id`.

## 5. Диаграмма (текст)
```
[Telegram App]
   └── initData ──> [webapp (React/TMA)] ── JWT ──> [backend (Express)] ── SQL ──> [PostgreSQL]
            |                                        └─ cache/rate-limit ──> [Redis]
            └── viewport/theme/haptics <── @tma.js/sdk ──┘

backend ── /metrics ──> Prometheus ──> Grafana/Alertmanager
backend ── Jenkins ──> Docker Registry ──> Kubernetes namespace `energy-planet`
```

Эта схема даёт верхнеуровневый контекст. Детали по слоям см. в специализированных документах `backend.md`, `frontend.md`, `data-model.md`, `content-pipeline.md`.
