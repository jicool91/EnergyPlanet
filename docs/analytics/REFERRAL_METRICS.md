# Referral Metrics Queries

**Обновлено:** 2025-10-28  
**Назначение:** оперативные срезы по новым таблицам `referral_*` и событиям.

---

## Дневные активации и t1 retention приглашённых

```sql
WITH activations AS (
  SELECT
    date_trunc('day', activated_at)::date AS day,
    referrer_id,
    referred_id
  FROM referral_relations
  WHERE activated_at >= NOW() - INTERVAL '30 days'
),
day1_retention AS (
  SELECT
    a.referred_id,
    MIN(e.created_at) AS first_session
  FROM activations a
  JOIN events e ON e.user_id = a.referred_id
  GROUP BY 1
)
SELECT
  day,
  COUNT(*) AS activations,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM day1_retention r
      WHERE r.referred_id = activations.referred_id
        AND r.first_session <= activations.day + INTERVAL '1 day'
    )
  ) AS retained_d1
FROM activations
GROUP BY day
ORDER BY day DESC;
```

## Милстоуны и выдачи наград

```sql
SELECT
  date_trunc('day', granted_at)::date AS day,
  milestone_id,
  COUNT(*) AS rewards_granted,
  SUM( (reward_payload ->> 'reward'::text)::jsonb ->> 'stars' )::numeric AS stars_promised,
  SUM( (reward_payload ->> 'multiplier')::numeric ) AS multiplier_sum
FROM referral_rewards
WHERE granted_at >= NOW() - INTERVAL '30 days'
GROUP BY day, milestone_id
ORDER BY day DESC, milestone_id;
```

## Конверсия share → activation (телеметрия)

```sql
WITH shares AS (
  SELECT
    user_id,
    created_at
  FROM referral_events
  WHERE event_type = 'referral_share_click'
    AND created_at >= NOW() - INTERVAL '14 days'
),
activations AS (
  SELECT
    referrer_id AS user_id,
    activated_at
  FROM referral_relations
  WHERE activated_at >= NOW() - INTERVAL '14 days'
)
SELECT
  date_trunc('day', s.created_at)::date AS day,
  COUNT(*) AS share_clicks,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM activations a
      WHERE a.user_id = s.user_id
        AND a.activated_at BETWEEN s.created_at AND s.created_at + INTERVAL '2 days'
    )
  ) AS activations_after_share
FROM shares s
GROUP BY day
ORDER BY day DESC;
```

## Топ рефереров (7 дней)

```sql
SELECT
  u.username,
  u.first_name,
  COUNT(r.id) AS activations,
  SUM(COALESCE(r.reward_payload -> 'reward' ->> 'stars', '0')::numeric) AS stars_promised
FROM referral_relations rel
JOIN users u ON u.id = rel.referrer_id
LEFT JOIN referral_rewards r
  ON r.referrer_id = rel.referrer_id
 AND r.granted_at >= NOW() - INTERVAL '7 days'
WHERE rel.activated_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id
ORDER BY activations DESC, stars_promised DESC
LIMIT 20;
```

---

## Дальнейшие шаги

1. Вынести агрегации в Metabase Dashboard (Retention vs Invites, Share → Activation).  
2. Добавить фильтр по источнику (когда будут `utm`/каналы в payload).  
3. Снять baseline до запуска реферального события и сравнивать uplift через weekly snapshot.  
4. Подготовить export в `docs/analytics/exports/referrals_YYYY-MM-DD.csv` на еженедельной основе.

---

## Аудит deeplink-активаций через `start_param`

### Логи (Grafana Loki)

1. Откройте дашборд **Product › Backend Logs**.  
2. Включите фильтры:
   - `app = "backgame"`
   - (при необходимости) `environment = "production"`
3. Используйте LogQL-запрос:

   ```
   {app="backgame"} |= "referral_start_param_"
   ```

   Дополнительные варианты:

   - Только успешные активации:  
     ```
     {app="backgame"} |= "referral_start_param_activated"
     ```
   - Ошибки/игнорирование:  
     ```
     {app="backgame"} |= "referral_start_param_failed" or {app="backgame"} |= "referral_start_param_skipped"
     ```

4. Сохраните фильтр как Loki Panel/Alert, чтобы отслеживать всплески и ошибки deeplink-флоу.

### Быстрая проверка через CLI

```bash
railway variables --service backgame --json \
  | jq -r '.DATABASE_URL' \
  | xargs -I{} railway run --service backgame -- psql "{}" -c "
    SELECT activated_at,
           referrer_id,
           referred_id,
           metadata ->> 'code' AS code
    FROM referral_relations
    WHERE activated_at >= NOW() - INTERVAL '24 hours'
    ORDER BY activated_at DESC;
  "
```

- В логах `referral_start_param_activated` берём `userId` и проверяем, что `referred_id` совпадает.  
- Если в логах встречается `referral_start_param_failed`, ищем причину по `reason` и проверяем, что нет записи в `referral_relations`.

### Сопоставление активаций и логов (SQL)

```sql
WITH deeplink_logs AS (
  SELECT
    (log ->> 'userId')::uuid AS referred_id,
    (log ->> 'referralCode') AS code,
    (log ->> 'timestamp')::timestamptz AS logged_at
  FROM jsonb_array_elements(
    -- предварительно выгруженный JSON из Loki-логов
    :loki_payload
  ) AS log
  WHERE log ->> 'message' = 'referral_start_param_activated'
)
SELECT
  d.logged_at,
  r.activated_at,
  r.referrer_id,
  r.referred_id,
  r.metadata ->> 'code' AS code
FROM deeplink_logs d
LEFT JOIN referral_relations r
  ON r.referred_id = d.referred_id
ORDER BY d.logged_at DESC;
```

> При отсутствии прямой выгрузки Loki можно вручную сверять `userId`/`referralCode` из логов и SQL-запроса к `referral_relations`.

### Мониторинг

- Создайте алерт в Loki: количество `referral_start_param_failed` > 0 за 15 минут.  
- Добавьте карточку в Grafana с `count_over_time({app="backgame"} |= "referral_start_param_activated"[5m])`, чтобы видеть поток активаций из deeplink.

---

## Реферальный доход (Stars)

### Агрегаты по выплаченным бонусам

```sql
SELECT
  date_trunc('day', granted_at)::date AS day,
  SUM(share_amount) AS stars_granted,
  COUNT(*) AS payouts
FROM referral_revenue_events
WHERE granted_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
```

### Топ рефереров по доходу

```sql
SELECT
  u.username,
  u.first_name,
  SUM(t.total_share_amount) AS total_stars,
  COUNT(DISTINCT t.referral_relation_id) AS referred_count
FROM referral_revenue_totals t
JOIN users u ON u.id = t.referrer_id
ORDER BY total_stars DESC
LIMIT 20;
```

### Проверка ограничений (дневной и месячный кап)

```sql
WITH earnings AS (
  SELECT
    referrer_id,
    SUM(share_amount) FILTER (WHERE granted_at >= date_trunc('day', NOW())) AS stars_today,
    SUM(share_amount) FILTER (WHERE granted_at >= date_trunc('month', NOW())) AS stars_month
  FROM referral_revenue_events
  WHERE granted_at >= date_trunc('month', NOW())
  GROUP BY referrer_id
)
SELECT
  e.referrer_id,
  e.stars_today,
  e.stars_month
FROM earnings e
WHERE e.stars_today >= 0.9 * :daily_cap
   OR e.stars_month >= 0.9 * :monthly_cap
ORDER BY stars_today DESC;
```

### Журнал выплат по конкретному рефереру

```sql
SELECT
  granted_at,
  share_amount,
  purchase_amount,
  purchase_id,
  referred_id,
  metadata ->> 'purchase_type' AS purchase_type
FROM referral_revenue_events
WHERE referrer_id = :referrer_id
ORDER BY granted_at DESC
LIMIT 100;
```
