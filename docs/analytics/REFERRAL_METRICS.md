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
