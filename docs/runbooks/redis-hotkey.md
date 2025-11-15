# Runbook: Redis hot key / перегрев rate-limit

## Симптомы
- Redis CPU/latency скачет, `redis-cli INFO commandstats` показывает огромные `INCR`/`EXPIRE`.
- В логах `tap_rate_limit_degraded` или `chat_rate_limit_fallback`.
- Тапы/чат отвечают 500/429 даже при нормальном трафике.

## Диагностика
1. `kubectl exec deploy/redis -n energy-planet -- redis-cli MONITOR` (коротко) → ищем ключи `tap:*`, `chat:*`, `telemetry:*`.
2. `redis-cli --stat` — high ops/sec? Сравните с baseline.
3. Проверьте Prometheus: `rate(energyplanet_tap_rate_limit_total[1m])`, `rate(energyplanet_telemetry_rate_limit_total[1m])` (если добавите метрику).
4. Логи backend (`tap_rate_limit_triggered`, `telemetry_rate_limit_exceeded`).

## Обходные действия
- **Временно ослабить лимиты**: выставите env `RATE_LIMIT_MAX_REQUESTS`, `GLOBAL_CHAT_RATE_MAX`, `TELEMETRY_RATE_LIMIT` выше через ConfigMap и перезапустите backend (снижает pressure).
- **Включить bypass**: можно выставить `CACHE_ENABLED=false`, но это отключит leaderboard cache и увеличит нагрузку на БД.
- **Шардировать**: если нагрузка постоянная, разнесите Redis (например, Managed Redis или кластер) и обновите `REDIS_URL`.

## Постоянное решение
1. **Оптимизировать ключи**
   - Tap rate-limit сейчас создаёт ключи `tap:{user}:sec:{epoch}` и `tap:{user}:min:{bucket}`. Рассмотрите Lua-скрипт/RedisBloom или sliding window.
   - Chat rate-limit: key per user. Можно объединить в sorted set.
2. **Таймауты** — убедитесь, что `expire` выставлен (TapService уже делает). Проверяйте, что TTL корректный (`redis-cli ttl tap:user:sec:...`).
3. **Мониторинг** — добавьте метрику `redis_hotkey_total` с именами ключей (через custom script) + алерт при >X hit rate.
4. **Вычитка** — `TapAggregator` может создавать hot key при бот-атаке. Добавьте защиту (подписчики, IP ban, captcha) на уровне Telegram.

## После инцидента
- Задокументируйте, какие ключи «горели».
- Обновите этот runbook, если добавили новые типы rate-limit.
