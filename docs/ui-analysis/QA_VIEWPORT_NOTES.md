# Отчёт по проверке адаптивности

**Дата:** 2025-10-24  
**Ответственный:** Дмитрий Февралев

## iPhone 12 (390×844) — Задача 6.1.1
- Проверены экраны: Home, Shop, BoostHub, Buildings, Leaderboard, Profile, Settings.
- Safe-area отступы работают: `MainScreen` и панели используют `--tg-content-safe-area-*`, нижний `TabBar` не перекрывает контент.
- В `HomePanel` двухколоночная компоновка корректно возвращается к одной колонке; кнопка тапа не выходит за пределы view.
- Ошибок перекрытия и горизонтального скролла не выявлено.

## iPhone SE (375×667) — Задача 6.1.2
- Проверены те же экраны в режиме уменьшенной высоты.
- Благодаря `card-interactive` и responsive-правкам карточки `BuildingCard` и `LeaderboardPanel` переходят в вертикальный стек.
- Offline summary + Telegram MainButton помещаются внутри safe area.
- Узкие экраны удерживают 44 px touch targets и видимость основного контента.

## Рекомендации
- Оставить Telegram MainButton включённым для модалок — он экономит вертикальное место на SE.
- Для будущих QA итераций сохранять скриншоты (Chrome DevTools → Device Toolbar → Capture screenshot).

