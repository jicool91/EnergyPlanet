# Formula Audit — 2025-10-24

## Summary
- Все ключевые формулы синхронизированы с GDD после правок задач 1.1–1.2.
- Дополнительно отмечены места округления (round/ceil/floor), чтобы избежать расхождений в документации.

## Подробности

| Формула | Реализация | Соответствие GDD |
|---------|------------|------------------|
| XP порог уровня `round(100 * level^1.5)` | `backend/src/utils/level.ts:9` | ✅ — используется `Math.round` с защитой от level<1 |
| XP из энергии `floor(energy / 10)` | `backend/src/utils/tap.ts:7` | ✅ |
| Tap multiplier `1 + level * 0.15` | `backend/src/utils/tap.ts:3` | ✅ (уровень нормализован до ≥0) |
| Tap income `base_tap * tap_multiplier * (1 + boost)` | `backend/src/services/TapService.ts:69` | ✅ |
| Стоимость постройки `base_cost * (cost_multiplier^count)` | `backend/src/services/ContentService.ts:194` | ✅ (округление вверх `Math.ceil`) |
| Стоимость улучшения `base_cost * 5 * (upgrade_multiplier^level)` | `backend/src/services/ContentService.ts:201` | ✅ (округление вверх) |
| Пассивный доход `base * count * (1 + level * upgrade_bonus)` | `backend/src/services/ContentService.ts:206` | ✅ (floor) |
| Лимит построек `50 + level * 2` | `backend/src/services/ContentService.ts:214` | ✅ (floor) |
| Оффлайн-доход `min(12h, dt) * effectiveIncome * 0.5` | `backend/src/services/SessionService.ts:93-102` + `backend/src/config/index.ts:195-196` | ✅ |

## Следующие шаги
- Контроль: при обновлениях GDD ссылаться на строку в коде, указанную в таблице.
- Автотесты: расширить e2e-тесты монетизации после настройки тестовых env (задача вне текущей десятки).
