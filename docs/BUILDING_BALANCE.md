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
| 1    | 200–1.2k  | 8–32        | ~25–38        | 1.08–1.09       | 0.18–0.19     |
| 2    | 3.2k–19k  | 95–410      | ~34–47        | 1.11–1.12       | 0.22–0.23     |
| 3    | 72k–0.82M | 1.1k–6.2k   | ~65–132       | 1.13–1.14       | 0.27–0.28     |
| 4    | 1.8M–12M  | 16k–90k     | ~90+          | 1.16–1.17       | 0.33–0.35     |

Новые постройки: `biomass_generator`, `tidal_station`, `orbital_solar_array`, `antimatter_forge` закрывают пробелы между тирами и дают игроку выбор при прогрессе уровня.

## API
`GET /api/v1/buildings`
- Возвращает список с `payback_seconds` и `roi_rank` (распределение по окупаемости, 1 — лучшая).
- Клиент использует `roi_rank` для подсветки выгодной постройки.

## TODO
- Добавить прогнозируемое влияние бустов на окупаемость.
- Экспонировать ROI по уровням/престижу для будущих сезонов.
