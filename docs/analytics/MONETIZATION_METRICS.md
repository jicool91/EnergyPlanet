# Monetization Metrics Workflow

**Обновлено:** 2025-10-28  
**Назначение:** фиксировать baseline и динамику ключевых метрик после Stage 1–2 без развёртывания отдельной аналитической системы.

## Ключевые показатели
- `shop_visit_rate` — доля игроков, открывших магазин, от количества показов вкладки `Shop`.
- `quest_claim_success_rate` — отношение успешных выдач наград к количеству стартов квестов.
- `daily_boost_upsell_ctr` — конверсия просмотра upsell после daily boost в клик.

Все значения считаются по дням на основе таблицы `events`.

## Быстрый отчёт (JSON / CSV)

```bash
# JSON по последним 14 дням
cd backend
npm run report:monetization

# CSV по последним 30 дням в docs/analytics/exports
cd backend
npm run report:monetization -- --days=30 --out=../docs/analytics/exports/monetization_$(date +%Y-%m-%d).csv
```

### Аргументы
- `--days=<number>` — глубина окна (1–60, по умолчанию 14).
- `--out=<path>` — путь до CSV. Если не указан, выводит JSON в stdout (подходит для pasting в Notion/Jira).

Скрипт использует существующую БД (`DATABASE_URL`) — дополнительных сервисов не требуется.  
Экспортированные CSV кладём в `docs/analytics/exports/` и коммитим как baseline/weekly snapshot (diff в git покажет тренд).

## SQL для ручной выборки

> Используем напрямую в psql/Metabase при отсутствии готового отчёта. Все запросы предполагают таймзону UTC.

**Дневные метрики (14 дней)** — можно адаптировать окно, изменив `interval`.

```sql
WITH filtered_events AS (
  SELECT
    (created_at AT TIME ZONE 'UTC')::date AS day,
    event_type,
    event_data
  FROM events
  WHERE created_at >= NOW() - INTERVAL '14 days'
)
SELECT
  day,
  COUNT(*) FILTER (
    WHERE event_type = 'tab_impression'
      AND COALESCE(event_data ->> 'tab', '') = 'shop'
  ) AS shop_tab_impressions,
  COUNT(*) FILTER (WHERE event_type = 'shop_view') AS shop_views,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'shop_view')::numeric /
    NULLIF(
      COUNT(*) FILTER (
        WHERE event_type = 'tab_impression'
          AND COALESCE(event_data ->> 'tab', '') = 'shop'
      ),
      0
    ),
    3
  ) AS shop_visit_rate,
  COUNT(*) FILTER (WHERE event_type = 'quest_claim_start') AS quest_claim_starts,
  COUNT(*) FILTER (WHERE event_type = 'quest_claim_success') AS quest_claim_success,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'quest_claim_success')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'quest_claim_start'), 0),
    3
  ) AS quest_claim_success_rate,
  COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_view') AS daily_boost_upsell_views,
  COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_click') AS daily_boost_upsell_clicks,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_click')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_view'), 0),
    3
  ) AS daily_boost_upsell_ctr
FROM filtered_events
GROUP BY day
ORDER BY day DESC;
```

**7‑дневный срез** — быстрый summary для апдейтов.

```sql
SELECT
  DATE_TRUNC('day', NOW())::date - INTERVAL '7 days' AS window_start,
  DATE_TRUNC('day', NOW())::date - INTERVAL '1 day' AS window_end,
  COUNT(*) FILTER (
    WHERE event_type = 'tab_impression'
      AND COALESCE(event_data ->> 'tab', '') = 'shop'
  ) AS shop_tab_impressions,
  COUNT(*) FILTER (WHERE event_type = 'shop_view') AS shop_views,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'shop_view')::numeric /
    NULLIF(
      COUNT(*) FILTER (
        WHERE event_type = 'tab_impression'
          AND COALESCE(event_data ->> 'tab', '') = 'shop'
      ),
      0
    ),
    3
  ) AS shop_visit_rate,
  COUNT(*) FILTER (WHERE event_type = 'quest_claim_start') AS quest_claim_starts,
  COUNT(*) FILTER (WHERE event_type = 'quest_claim_success') AS quest_claim_success,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'quest_claim_success')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'quest_claim_start'), 0),
    3
  ) AS quest_claim_success_rate,
  COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_view') AS daily_boost_upsell_views,
  COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_click') AS daily_boost_upsell_clicks,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_click')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'daily_boost_upsell_view'), 0),
    3
  ) AS daily_boost_upsell_ctr
FROM events
WHERE created_at >= NOW() - INTERVAL '7 days';
```

## Админский экран
Backend отдаёт агрегаты через `GET /api/v1/admin/monetization/metrics`.  
Формат ответа:

```json
{
  "generatedAt": "2025-10-28T09:00:00.000Z",
  "windowStart": "2025-10-15T00:00:00.000Z",
  "windowEnd": "2025-10-28T09:00:00.000Z",
  "days": 14,
  "daily": [
    {
      "date": "2025-10-27",
      "shopTabImpressions": 180,
      "shopViews": 72,
      "shopVisitRate": 0.4,
      "questClaimStarts": 95,
      "questClaimSuccess": 88,
      "questClaimSuccessRate": 0.926,
      "dailyBoostUpsellViews": 42,
      "dailyBoostUpsellClicks": 8,
      "dailyBoostUpsellCtr": 0.19
    }
  ]
}
```

Этот эндпоинт потребляется админским UI внутри существующей мини-аппы (см. `webapp/src/screens/AdminMonetizationScreen.tsx`).

## Регламент съёмки метрик
1. **Baseline:** сразу после релиза Stage 1–2 собираем CSV за последние 14 дней и сохраняем как `monetization_baseline.csv`.
2. **Еженедельно:** запускаем скрипт, добавляем файл `monetization_YYYY-MM-DD.csv`, прикладываем комментарий в Jira/Notion.
3. **После крупных релизов:** снимаем срез до релиза и через 3–7 дней после, чтобы оценить uplift.
4. **Аналитик/продакт:** при необходимости импортируют CSV в Sheets/Notion для визуализации, либо используют админский экран в игре.

## Дальнейшие шаги
- Добавить ночной cron в backend (node-cron/Agenda) для записи аггрегатов в таблицу `daily_metrics` — упростит запросы и позволит строить long-term графики.
- Когда появится аналитик, эти данные можно реплицировать в Metabase/Redash без дополнительных изменений в коде.
