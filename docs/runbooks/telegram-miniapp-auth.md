# Telegram Mini App — Runbook по аутентификации

## Цели

1. Гарантировать, что `/auth/tma` и `/auth/refresh` работают штатно: токены ротируются, «семьи» сессий автоматически ревокуются, лимиты не душат легитимных пользователей.
2. Быстро диагностировать инциденты (ревокация refresh-токенов, повторные 401/429, всплески rate-limit).
3. Знать, какие переменные окружения и показатели нужно контролировать.

## Обязательные переменные окружения (Railway → service `backgame`)

| Ключ | Назначение | Рекомендованное значение |
| --- | --- | --- |
| `TELEGRAM_AUTHDATA_MAX_AGE_SEC` | TTL initData, в секундах | `86400` |
| `TELEGRAM_ALLOWED_ORIGINS` | Белый список origin для Mini App | `https://t.me[, ваши домены]` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Окно rate-limit для `/auth/*` | `60000` |
| `AUTH_RATE_LIMIT_MAX` | Допустимые запросы за окно | `8` |
| `SESSION_REFRESH_AUDIT_TTL_DAYS` | Срок хранения `session_refresh_audit` | `30` |

> Проверить/обновить: `railway variables --service backgame --kv`

## Логирование & метрики

### Что пишем в логи

- `telegram_auth_data_near_expiry` — initData старше 20 ч. План действий: запланировать у пользователя повторный вход.
- `auth_data_expired_renew` — клиенту нужно перезапустить Mini App.
- `session_family_revoked` — автоматическое снятие семьи (причины `refresh_*`).
- `auth_rate_limit_triggered` — IP упёрся в лимит. Сверить с Grafana.

### Прометеевские метрики (`/metrics`)

| Метрика | Описание |
| --- | --- |
| `energyplanet_auth_requests_total{endpoint,status,outcome}` | Количество запросов к `/auth/{tma,refresh,telegram}`; outcome=`rate_limited` указывает на 429 |
| `energyplanet_auth_refresh_audit_total{reason,revocation_reason}` | Счётчик причин в `session_refresh_audit` |
| `energyplanet_auth_session_family_revoked_total{trigger}` | Сколько семей ревокнули автоматически/вручную |

Проверка вручную:

```bash
curl -s https://backgame-production.up.railway.app/metrics \
  -u "${PROM_AUTH_USER}:${PROM_AUTH_PASS}" \
  | grep energyplanet_auth
```

Если нет трафика → метрики не появляются (Prometheus создаёт серию после первого события).

### Grafana/Alertmanager (рекомендуемо)

1. Дашборд: stacked area по `energyplanet_auth_requests_total` (разбивка success/error/rate_limited).
2. Дашборд: `energyplanet_auth_refresh_audit_total` сгруппировать по `reason`.
3. Алерт: `rate_limited` > 15 % за 5 минут (лейбл `endpoint='tma'| 'refresh'`).
4. Алерт: `energyplanet_auth_session_family_revoked_total{trigger!='manual_revoke'}` растёт > 5 раз за 10 минут.

## Операции с «семьями» сессий

### Посмотреть список

```bash
curl -H "Authorization: Bearer <admin access token>" \
  https://backgame-production.up.railway.app/api/v1/admin/auth/session-families?limit=50
```

Ответ содержит `familyId`, `activeSessions`, `lastUsedAt`, `lastIp` и т.д.

### Ревокация семьи вручную

```bash
curl -X POST \
  -H "Authorization: Bearer <admin access token>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"support_manual_revoke"}' \
  https://backgame-production.up.railway.app/api/v1/admin/auth/session-families/<FAMILY_ID>/revoke
```

Эффект:

1. Все активные refresh-токены семьи помечаются revoked.
2. В `session_refresh_audit` появляется запись `reason=manual_revoke` + `revocation_reason=<reason>`.
3. В `events` создаётся `session_family_revoked`.
4. Пользователю придётся заново пройти `/auth/tma`.

## Типовые инциденты и действия

| Ситуация | Диагностика | Решение |
| --- | --- | --- |
| Пользователи жалуются на «требуется повторная авторизация» | Смотреть `auth_rate_limit_triggered` + Grafana (rate_limited) | Проверить `AUTH_RATE_LIMIT_MAX`, IP-агрегаторы; при необходимости поднять лимит и уведомить пользователей |
| В логах `auth_data_expired_renew` | Обычно пользователь держал Mini App > 24 ч | Подсказать перезапустить Mini App (Telegram выдаст свежую подпись) |
| Много `session_family_revoked` с trigger `refresh_not_found` | Вероятно, старые refresh-токены от другого устройства | Проинформировать пользователя, что нужно залогиниться заново. Следить за количеством событий |
| Grafana показывает рост `user_mismatch` | Возможна попытка повторного использования токена | Связаться с пользователем, при повторении — ревокация семьи вручную |

## Переменные в фронте

- Хранение `refreshExpiresAt` в `localStorage` (`refresh_expires_at_ms`) — если время истекло, Session Manager сам делает `forceReauth`.
- При 429 фронт уважает `Retry-After`, использует экспоненциальный бэк-офф и логирует `auth_refresh_rate_limited`.
- При `auth_data_expired_renew` выводится сообщение «Срок действия авторизации истёк. Закройте мини‑приложение и откройте заново».

## Быстрый чек-лист перед релизом

1. `npm run migrate:up` применил `013_session_family_revocation`.
2. `railway variables --service backgame --kv` показывает актуальные значения из таблицы выше.
3. smoke-тест `/auth/tma` + `/auth/refresh` (Postman/CURL, подставить initData и refresh).
4. `curl /metrics` содержит счётчики `energyplanet_auth_*`.
5. В Grafana 👀 дашборд обновляется, алерты задействованы (если используется).

Готово — теперь любые отклонения по аутентификации можно диагностировать за минуты.
