# Building Balance Overview

_Updated: 2025-10-22_

## Formulas
- **Cost Growth** – `cost_n = base_cost * (cost_multiplier ^ count)`
- **Upgrade Cost** – `upgrade_cost_n = base_cost * 5 * (upgrade_cost_multiplier ^ level)`
- **Income** – `income = base_income * count * (1 + level * upgrade_income_bonus)`
- **Payback** – `payback_seconds = base_cost / base_income`

Эти формулы соответствуют best practice для idle-игр: экспоненциальный рост стоимости 8–16% и умеренный бонус за апгрейд, чтобы окупаемость со временем плавно растягиваласьciteturn0search9.

## Targets по тиру
| Tier | Base Cost | Base Income | Payback (сек) | Cost Multiplier | Upgrade Bonus |
|------|-----------|-------------|---------------|-----------------|---------------|
| 1    | 200–550   | 8–20        | ~25–30        | 1.08            | 0.18          |
| 2    | 3.2k–12.8k| 95–260      | ~34–50        | 1.11            | 0.22          |
| 3    | 72k–360k  | 1.1k–4.8k   | ~65–75        | 1.13            | 0.27          |
| 4    | 1.8M–9M   | 16k–70k     | ~90+          | 1.16            | 0.33          |

## API
`GET /api/v1/buildings`
- Возвращает список с `payback_seconds` и `roi_rank` (распределение по окупаемости, 1 — лучшая).
- Клиент использует `roi_rank` для подсветки выгодной постройки.

## TODO
- Добавить прогнозируемое влияние бустов на окупаемость.
- Экспонировать ROI по уровням/престижу для будущих сезонов.
