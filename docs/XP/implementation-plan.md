# XP Overhaul — Implementation Plan (обновлено 2025-11-16)

## 0. Структура задач (первые 15)
| № | Задача | Цель | Артефакты/статус |
| --- | --- | --- | --- |
| 1 | Финализировать формулу XP 1–100 | Выровнять прогрессию | ✅ `backend/src/utils/levelV2.ts`, таблица ниже |
| 2 | Формула XP за строительство | Привязать прогрессию к таймерам | ✅ `backend/src/utils/constructionXp.ts` |
| 3 | UX «Панель строителя» | Показать слот, очередь, CTA | ✅ макет в разделе 3.2 |
| 4 | Монетизация Builder Drone | Выручка и контроль темпа | ✅ экономический блок 3.3 |
| 5 | Перк-система каждые 10 уровней | Мотивация эндгейма | ✅ таблица 4 |
| 6 | Миграция прогресса | Пересчёт уровней и XP | ✅ алгоритм 5 |
| 7 | Новые таблицы БД | Хранение строек и строителей | ✅ `backend/migrations/021_xp_overhaul.sql` |
| 8 | Обновление архитектурной документации | Единый источник правды | ✅ раздел 6 |
| 9 | ConstructionService | API для постановки/завершения работ | ✅ `backend/src/services/ConstructionService.ts` |
|10 | BuilderService | Управление слотами/ускорениями | ✅ `backend/src/services/BuilderService.ts` |
|11 | UpgradeService V2 | Логика «покупка ⇒ job» | ✅ `backend/src/services/UpgradeServiceV2.ts` |
|12 | Расширенный Session API | Доставать строителей/очередь | ✅ контракты 7 |
|13 | constructionStore (FE) | Синхронизация таймеров | ✅ `webapp/src/store/constructionStore.ts` |
|14 | BuilderPanel компонент | UI слотов и очереди | ✅ `webapp/src/components/buildings/BuilderPanel.tsx` |
|15 | Progress Banner + Offline Card | Компактные уведомления | ✅ `webapp/src/components/ProgressBanner.tsx`, `OfflineSummaryCard.tsx` |

## 1. XP-кривая (детали)
Формула: `xp_for_level(level) = round(220 + 35 * level^1.6 + floor(level/10) * 900)`.

| L | XP за уровень | Совокупный XP |
| --- | --- | --- |
| 1 | 255 | 255 |
| 5 | 746 | 3 082 |
| 10 | 1 452 | 8 973 |
| 20 | 4 296 | 122 591 |
| 40 | 14 769 | 420 267 |
| 60 | 23 912 | 598 042 |
| 80 | 37 966 | 1 228 114 |
| 90 | 49 623 | 1 546 247 |
| 100 | 70 002 | 2 297 631 |

Реализация: `levelV2.ts` экспортирует `xpThresholdForLevelV2`, `cumulativeXpToLevel`, `xpCapForAction` и таблицы для аналитики.

## 2. XP за строительство
`constructionXp.ts` ⇢ `calculateConstructionXpReward(options)`, где:
- `tierXp` = {1:40, 2:90, 3:220, 4:550},
- `durationMinutes` ⇒ `sqrt(durationMinutes)` множитель,
- `buildingLevel` ⇒ `1 + 0.05 * level`,
- `qualityMultiplier` ∈ [0.8; 1.15].
Функция возвращает «сырые» XP + кап 20% уровня с учётом `xpCapForAction`.

## 3. UX / монетизация
### 3.1 Builder Panel (FE)
Компонент (`BuilderPanel.tsx`) показывает:
- карточки слотов (иконки, статус, CTA «Купить дрона»),
- активный таймер и очередь из 3 задач,
- кнопку ускорения (открывает Stars paywall).

### 3.2 UX-поток
1. Игрок покупает здание → `constructionStore.startJob` ставит в очередь.
2. Когда строительство завершено, `ProgressBanner` показывает «+XP и уровни», а BuilderPanel подсвечивает готовность.
3. OfflineSummaryCard объединяет XP/энергию/уровни, если игрок вернулся позже.

### 3.3 Builder Drone монетизация
- Базовый слот (0) бесплатен, нельзя продать.
- Слот 1: 1 500 Stars или $4.99 Builder Pack; trial 3 дня выдаётся автоматически после миграции. Состояния: `active`, `inactive`, `expired`.
- Опциональные событийные дроны (slot ≥2) доступны через boosts; ограничения вынесены в `BuilderService`.

## 4. Перки каждые 10 уровней
| Уровень | Перк A | Перк B | Перк C |
| --- | --- | --- | --- |
| 10 | Tap Surge (+10% tap income) | Passive Harmony (+1% passive income) | Efficient Crew (−5% времени строительства) |
| 20 | Mega Battery (+5% energy cap) | Smart Storage (+10% офлайн коэфф.) | Blueprint Cache (+5% XP Tier1‑2) |
| 30 | Advanced Grid (+5% passive mult.) | Turbo Drone (−10% очереди) | Architect Mind (+5% XP Tier3‑4) |
| ... | ... | ... | ... |
| 100 | Cosmic Planner (+15% престиж XP) | Quantum Crew (−15% времени T4) | Stellar Legacy (+3 Prestige Tokens) |
Перечень полный см. таблицу в этом файле.

## 5. Миграция прогресса
1. Рассчитать процент выполнения `old_xp / xp_for_level_old(level)`, перевести в новую шкалу через `cumulativeXpToLevel` и записать `xp_overflow` для остатка.
2. Игрокам ≥L100: выставить `level = 100`, `xp_overflow = остаток`, `prestige_progress = round(xp_overflow / 2_451_362 * 100)`.
3. Выдать компенсационные Stars (формула: `max(0, old_level - new_level) * 5`).
4. Активные здания → конвертировать в мгновенно завершённые construction jobs (status `completed` + `reward_claimed_at = now()`), чтобы энергия не потерялась.
5. Скрипт `backend/scripts/xp-overhaul-migration.ts` автоматизирует перерасчёт и логирует количество мигрированных пользователей и выданных Stars; запускать после применения миграции `021`.

## 6. Архитектурные изменения
- Новые таблицы `construction_jobs`, `builders`, поля в `progress` (см. migration 021).
- Новые репозитории + сервисы документированы в `docs/architecture/backend.md` (раздел «Construction Loop»).

## 7. Session/Tick API
`/session` возвращает:
```json
{
  "builders": [{"slot":0,"status":"active","speed_multiplier":1.0}],
  "construction_jobs": {
    "active": [...],
    "queued": [...]
  },
  "prestige_progress": {"percent":42,"xp_overflow":18234}
}
```
`/tick` дополняется обработкой завершённых работ (batch `completed_job_ids`).

---
Статус файла поддерживать по мере продвижения следующих этапов (фаза 2+).
