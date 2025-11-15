# Runbook: API outage / 5xx шторм

## 1. Симптомы
- `/health` возвращает `status=degraded` или 5xx.
- Prometheus алерты: `TickLatencyHigh`, `AuthErrorRateHigh`, `PurchaseConflictSpike`.
- Логи Jenkins/Telegram сообщают о падении API.

## 2. Диагностика (5–10 минут)
1. **Проверить health**: `curl -i https://api.energyplanet.game/health` — смотрим `services.database`/`services.redis`.
2. **Логи backend**: `kubectl logs deployment/backend -n energy-planet --tail=200` — ищем `error` / `postgres_*` / `redis_*`.
3. **Метрики**: Grafana «telegram-miniapp-system» или PromQL:
   - `rate(energyplanet_tick_errors_total[5m])`.
   - `rate(energyplanet_auth_requests_total{outcome=
"error"}[5m])`.
   - `energyplanet_auth_requests_total{status="500"}`.
4. **PostgreSQL**: `kubectl exec -it postgres-0 -n energy-planet -- psql -U energyplanet_app -d energy_planet -c 'select now();'`. Если зависает — проблема с БД/сетью.
5. **Redis**: `kubectl exec deploy/redis -n energy-planet -- redis-cli PING`.
6. **Недавние деплои**: `kubectl rollout history deployment/backend`.

## 3. Классификация
- **DB недоступна** — `/health` показывает `database: false`.
- **Redis недоступен** — `/health` `redis: false`, в логах `redis_error`.
- **Ошибки приложения** — `status=ok`, но 5xx на конкретных эндпоинтах.

## 4. Восстановление
### 4.1 DB/Redis недоступны
1. Проверить PVC/PV/узлы.
2. Перезапустить pod: `kubectl delete pod postgres-0 -n energy-planet` или `redis`.
3. Если проблема в кредах (например, rotated password) — обновить secret и перезапустить backend.
4. После восстановления убедиться, что backend подключился (логи `postgres_connection_ready` / `redis_connection_ready`).

### 4.2 Сбой приложения
1. Откатить deployment: `kubectl rollout undo deployment/backend -n energy-planet`.
2. Если проблема в новой миграции — рассмотрите `npm run migrate:down` (только если миграция обратима) или восстановление из бэкапа.
3. При подозрении на горячий контент — вернуть предыдущий ConfigMap `game-content`.
4. Проверить использование CPU/RAM (HPA мог масштабировать pods, но throttling всё равно возможен). Снимите профили, если нужно.

## 5. После инцидента
- Создать postmortem (что случилось, когда, как решали).
- Добавить недостающие метрики/алерты.
- Обновить `deployment/environments.md`, если процесс отката изменился.
