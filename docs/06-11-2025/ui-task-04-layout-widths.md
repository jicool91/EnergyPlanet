# Task 04 — Единая ширина секций (Tap, Exchange, Friends, Earn) — 2025-11-06

## Цель
Устранить визуальные «ступеньки» и суженные контейнеры на основных экранах, привести их к рекомендациям Telegram Mini Apps по layout blocks.

## Исходное состояние
- **TapScreen**: нижний блок «Сообщество» уже остальных секций, часть панелей обёрнута во вложенные `Card`/`Surface`.  
- **ExchangeScreen**: магазин и постройки находятся во внутренних `Panel` с `tone="overlayStrong"` и фиксированными padding, создавая «окошко».  
- **FriendsScreen**: «Топ игроков» обёрнут в дополнительный контейнер и визуально сужен по сравнению с остальными блоками.  
- **EarnScreen**: блок бустов имеет собственный контейнер и выглядит менее широким; есть дублирование секции профиля.

## Требования Telegram Mini Apps
- Основной контент должен тянуться на ширину контейнера, без двойных рамок/scroll внутри блока (`Layout Blocks` в Design Guidelines).
- Safe area и padding должны рассчитываться централизованно (`viewport.safeAreaInsets()`), чтобы секции не «заезжали» под системные элементы.
- Для списков/каталогов рекомендуется использовать единый scroll, избегая nested scroll (особенно в мобильном контексте).

## Рекомендации по экранам
### TapScreen (`webapp/src/screens/TapScreen.tsx`)
- Заменить контейнер «Сообщество» на `Surface tone="secondary"` с `className="w-full"`, убрать дополнительные margin.  
- Проверить `StatsSummary`, `DailyTasksBar`, `PurchaseInsightCard` — добавить `w-full`, использовать grid/tokens для gap.  
- Убедиться, что все секции находятся в одном `TabPageSurface` без nested `Card`.

### ExchangeScreen (`webapp/src/screens/ExchangeScreen.tsx`)
- Удалить вложенный `Panel tone="overlayStrong"` вокруг магазина; передавать `fullWidth` проп в `ShopPanel`, чтобы карточки растягивались.  
- Для `BuildingsPanel` использовать `div className="flex-1 overflow-y-auto"` без дополнительного `Panel`.  
- Навигацию табов (`EXCHANGE_TABS`) разместить на плоском `Surface` без рамки.

### FriendsScreen (`webapp/src/screens/FriendsScreen.tsx`)
- Перевести «Топ игроков» на `Surface`/`Card` с `w-full`.  
- Списки друзей и топа объединить в одну scroll-область, убрать вложенный `Surface`.  
- Проверить состояния `empty/error` — использовать стандартные layout блоки из DS.

### EarnScreen (`webapp/src/screens/EarnScreen.tsx`)
- Удалить отдельный контейнер для бустов, растянуть блок на ширину основного layout.  
- Секции «Профиль»/«Аккаунт» перенести в профильный экран или свернуть в единый CTA.

## Универсальные шаги
1. В `TabPageSurface` добавить опцию `maxWidth="full"` по умолчанию, чтобы экраны не сужались.  
2. Пересмотреть `Surface`/`Panel` токены — `tone="overlayStrong"` оставить только для модалок.  
3. После правок обновить визуальные тесты (`docs/qa/baseline/<new-date>`) и Chromatic stories (`TapScreen`, `ExchangeScreen`, `FriendsScreen`, `EarnScreen`).

## Следующие шаги
1. Провести рефакторинг каждого экрана с учётом рекомендаций.  
2. Прогнать `npm run test:visual` и `npm run test:storybook`.  
3. Зафиксировать изменения в `docs/release-notes/stage-f.md` и `docs/qa/stage-f-checklist.md`.
