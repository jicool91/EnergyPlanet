# Метрики, дашборды и алерты

## 1. Экспонирование метрик
- **Endpoint**: `GET /metrics` (включается при `PROMETHEUS_ENABLED=true`). Basic auth задаётся `PROM_AUTH_USER/PASS`.
- **Prefix**: `energyplanet_*` (см. `backend/src/metrics/index.ts`).

## 2. Категории
### Gameplay (`metrics/gameplay.ts`)
- `energyplanet_tap_requests_total`, `energyplanet_taps_requested_total` — объём ручных входов.
- `energyplanet_tap_rate_limit_total` (`label window=second|minute`).
- `energyplanet_tap_batches_total`, `energyplanet_tap_batch_latency_ms`, `energyplanet_tap_batch_energy_total`.
- `energyplanet_building_purchases_total`, `energyplanet_building_upgrades_total` + энергия/XP.
- `energyplanet_sessions_opened_total`, `energyplanet_sessions_closed_total`, `energyplanet_session_duration_seconds` (через business metrics).
- `energyplanet_offline_energy_total`, `energyplanet_offline_duration_seconds`.
- `energyplanet_quests_claimed_total`, `energyplanet_quest_reward_*`.
- `energyplanet_prestige_total`, `energyplanet_prestige_energy_since_reset_total`.
- `energyplanet_achievement_*`, `energyplanet_cosmetics_*`.
- `energyplanet_referral_*`, `energyplanet_referral_reward_*`.

### Business (`metrics/business.ts`)
- `energyplanet_user_logins_total` (`is_new_user`, `replay_status`).
- `energyplanet_session_rotations_total`, `energyplanet_auth_requests_total` (совместно с auth metrics).
- `energyplanet_purchase_invoices_total`, `energyplanet_purchase_conflicts_total`, `energyplanet_purchase_completed_total`, `energyplanet_purchase_revenue_stars_total`, `energyplanet_purchase_failures_total`.
- `energyplanet_boost_claims_total` (`boost_type`, `outcome`).
- `energyplanet_stars_credit_total`, `energyplanet_referral_revenue_stars_total`.
- `energyplanet_conversion_events_total` (`event_type`, `cohort_day`), `energyplanet_user_lifetime_value_stars_total` (`user_segment`).
- `energyplanet_active_users_current`, `energyplanet_daily_active_users` (gauge — заполните при подключении realtime счетчика).

### Auth (`metrics/auth.ts`)
- `energyplanet_auth_requests_total` (endpoint/status/outcome).
- `energyplanet_auth_refresh_audit_total` (reason, revocation_reason).
- `energyplanet_auth_session_family_revoked_total` (trigger).

### Tick (`metrics/tick.ts`)
- `energyplanet_tick_latency_seconds_*` (histograms), `energyplanet_tick_success_total`, `energyplanet_tick_errors_total`, `energyplanet_tick_unauthorized_total`.

### Telemetry (`metrics/telemetry.ts`)
- `energyplanet_render_latency_ms` (labels screen/theme/device_class).
- `energyplanet_client_tap_success_*`.
- `energyplanet_safe_area_*`, `energyplanet_viewport_*`, `energyplanet_viewport_actions_total`.

## 3. Логи (Pino)
- `backend/logs/app.log`, `error.log` если `LOG_ENABLE_FILE_TRANSPORTS=true`.
- requestId проставляется `middleware/requestContext` (X-Request-Id).

## 4. Prometheus/Alertmanager
- Конфиг: `infra/prometheus/prometheus.yml` (scrape 15s, basic auth, `PROMETHEUS_SCRAPE_TARGET`).
- Alerts (`infra/prometheus/alerts.yml`):
  - `TickLatencyHigh` — p95 latency > 200ms в течение 5 минут.
  - `TickUnauthorizedSpike` — `increase(energyplanet_tick_unauthorized_total[5m]) > 50`.
  - `AuthErrorRateHigh` — ошибка auth > 20% при >5 req/s (5 минут).
  - `PurchaseConflictSpike` — >5 конфликтов за 10 минут.
  - `BoostCooldownFlood` — >30 отказов по cooldown за 10 минут.

## 5. Grafana
- Дашборды: `infra/grafana/dashboards/telegram-miniapp-product.json` (продуктовые KPI), `telegram-miniapp-system.json` (инфраструктура).
- Provisioning: `infra/grafana/provisioning/*`. Добавьте datasource (Prometheus) и alert contact points.

## 6. Клиентская телеметрия
- `logClientEvent` (`services/telemetry.ts`) — батчит, отправляет severity info/warn/error.
- События: `render_latency`, `tap_success`, `safe_area_changed`, `viewport_metrics_changed`, `viewport_action`, `ui_safe_area_delta` и любые кастомные (`event` строка, `context` объект).
- Rate-limit: `/telemetry/client` ограничен 20 req / 10s (`telemetryRateLimiter`). При превышении сервер отвечает 429 + `retry_after`.

## 7. Эксплуатационные дашборды (рекомендации)
- **Gameplay health**: taps (req/sec), tap latency, tick latency, offline rewards, quest claims, prestige.
- **Economy**: purchases (invoices vs success), boost claims, Stars credit.
- **Auth**: login successes, refresh errors, session revocations.
- **Chat**: количество сообщений, rate-limit.
- **Client UX**: render latency p95, safe-area дергания.

## 8. TODO / улучшения
- Подключить Alertmanager к Slack/Telegram.
- Добавить tracing (OpenTelemetry) для Tap/Tick/Session.
- Интегрировать Grafana public snapshot для product/marketing.

Обновляйте этот документ при добавлении новых метрик/алертов или изменении dashboards.
