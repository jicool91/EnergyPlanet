# Task 02 — Верхний статус-бар и safe area (2025-11-06)

## Цель
Согласовать верхнюю панель приложения с требованиями Telegram Web Apps к безопасным областям и цветовым темам, чтобы она не конфликтовала с системными кнопками Mini App и не выглядела «инородным» элементом.

## Исходное состояние
- `AppLayout` (`webapp/src/components/layout/AppLayout.tsx`) вручную добавляет отступы `pt-6` и `pb-3`, фиксированную ширину `max-w-xl`, а также не вызывает `Telegram.WebApp.setHeaderColor`.
- Верхняя панель визуально отделена от контента и может накладываться под системные кнопки Mini App («Закрыть», «Назад», «Меню»).
- При смене темы/ориентации цвет панели не обновляется — только Tailwind классы, прочитанные из токенов.

## Требования Telegram Mini Apps
- Безопасная область должна учитываться через `viewport.safeAreaInsets()` и событие `viewport_changed`; отступы обязаны обновляться при изменение ориентации/режима.
- Цвета статуса настраиваются методами `setHeaderColor` и `setBackgroundColor`, чтобы панель не контрастировала с системными элементами.
- Рекомендуется избегать фиксированных ширин, чтобы макет корректно выглядел на Fold/Tablet и десктопных превью; контейнеры должны тянуться по ширине доступной веб-области.

## Анализ существующего UI
- `AppLayout` ограничивает ширину `max-w-xl`, что сужает верхний бар относительно системных кнопок.
- Отступы рассчитываются единожды (`useSafeArea`), но нет подписки на `viewport_changed`, поэтому при `viewportExpand(true)` или смене ориентации возникают «ступеньки».
- Цвет панели фиксирован (`bg-surface-primary`), не синхронизирован с `setHeaderColor`, из-за чего в светлой теме сверху появляется полоска другого цвета.

## Рекомендации
1. **Динамический safe area**  
   - В `services/tma/viewport.ts` подписаться на `Telegram.WebApp.onEvent('viewport_changed', ...)` и обновлять стор safe area.  
   - В `AppLayout` заменить `pt-6` на вычисляемое значение из safe area + токенов, убрать фиксированные значения.

2. **Синхронизация цвета**  
   - При монтировании `AppLayout` вызывать `Telegram.WebApp.setHeaderColor(themeTokens.header)` и `setBackgroundColor(themeTokens.background)` в соответствии с текущей темой.  
   - При смене темы повторно обновлять цвета (через `themeChanged` событие).

3. **Гибкая ширина**  
   - Убрать `max-w-xl` у корневого контейнера или сделать его адаптивным (например, `max-w-3xl` на планшетах) в зависимости от типа viewport (`isExpanded`, `isFullscreen`).

4. **Визуальное упрощение**  
   - Использовать `Surface`/`Panel` с токенами `tone="primary"` вместо кастомных padding, чтобы верхняя панель выглядела частью дизайн-системы.  
   - Проверить, что фокус-кольца и кнопки не перекрываются системным статус-баром.

## Следующие шаги
1. Обновить `useSafeArea`/`AppLayout`, добавить реакцию на `viewport_changed` и `themeChanged`.  
2. Унифицировать стили верхней панели через дизайн-токены.  
3. Прогнать визуальные тесты на iOS/Android (expanded vs default) и обновить `docs/qa/baseline`.

## Статус 2025-11-07
- ✅ `useSafeArea` переписан на `useSyncExternalStore`, возвращает `safeTopWithBuffer`, `isFullscreen` (см. `webapp/src/hooks/useSafeArea.ts`).
- ✅ `AppLayout` использует CSS-переменные `--app-header-offset-top`, синхронизирует `miniApp.setHeaderColor`, включает класс `status-bar-shell`.
- ✅ `docs/telegram-fullscreen-status-bar.md` описывает процесс и чек-листы, `webapp/docs/DESIGN_SYSTEM.md` дополнен состояниями шапки.
- ✅ Добавлены Playwright тесты (`tests/qa/safe-area.spec.ts`) и dev-команда `/debug_safe_area`.
