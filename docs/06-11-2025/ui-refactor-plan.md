# UI Refactor Plan — Telegram Mini App (2025-11-06)

## Цель
Перестроить интерфейс Energy Planet Mini App под текущие best practices Telegram Web Apps, закрыть несоответствия из `ui-layout-audit.md` и подготовить продукт к Stage F/G без привлечения макетов и скриншотов.

## Официальные ориентиры
- **Safe Area & Viewport** — использовать `Telegram.WebApp.viewportExpand` и событие `viewport_changed`, получать инкременты через `viewport.safeAreaInsets()` и обновлять layout при смене ориентации.
- **Тема и цвета** — все цвета брать из `themeParams`, включая новые ключи (`accent_text_color`, `section_bg_color`, `destructive_text_color`) в релизах 6.10+.
- **Нижняя навигация** — максимум 5 вкладок, только ключевые пользовательские сценарии; административный контент переносим в отдельное меню.
- **Системные кнопки** — цвета хедера настраиваются через `setHeaderColor`/`setBackgroundColor`, Main/Secondary Button применяются для ключевых CTA.

## Кросс-экранные действия
1. **Убрать кнопку `Админ` из пользовательских экранов.**  
   - Перенести вход в админку в профиль (`webapp/src/screens/ProfileScreen.tsx`, новый раздел «Администрирование»).  
   - Создать `AdminActionsSheet` в `webapp/src/components/admin/AdminActionsSheet.tsx` и рендерить при наличии `gameStore.isAdmin`.
2. **Выравнять верхнюю панель.**  
   - В `webapp/src/components/layout/AppLayout.tsx` добавить синхронизацию `setHeaderColor`/`setBackgroundColor` и использовать `Surface`/`Panel` для статуса.  
   - Обновить `services/tma/viewport.ts`, чтобы safe-area инъекцию передавать в контекст и пересчитывать padding при `viewport_changed`.
3. **Перестроить нижнюю навигацию.**  
   - В `webapp/src/components/layout/BottomNavigation.tsx` заменить вкладку `airdrop` на `chat`, убрать `max-w-xl`, чтобы нижний бар расширялся на всю ширину (использовать `max-w-none`).  
   - В `webapp/src/store/navigationStore.ts` и `webapp/src/App.tsx` обновить маршруты, добавить guard для чата.
4. **Устранить вложенные контейнеры/двойные скроллы.**  
   - `webapp/src/screens/ExchangeScreen.tsx`: заменить `Panel tone="overlayStrong"` на основной `Surface`, удалить внутренние `padding="lg"` и выставить `className="flex-1"`; вынести `BuildingsPanel` из обёртки с дополнительным `Panel`.  
   - `webapp/src/components/BuildingsPanel.tsx`: убрать внутренний `Surface` и высоту «окошка», использовать единый `TabPageSurface` с `overflow-y-auto`.
5. **Единое административное меню.**  
   - `webapp/src/screens/EarnScreen.tsx` и `ExchangeScreen.tsx` — удалить кнопки `openAdminMetrics`, перенести вызов в профильный лист.  
   - `webapp/src/screens/AdminMonetizationScreen.tsx` — доступ только через новый лист.

## Экранные изменения
### Главный экран (`webapp/src/screens/TapScreen.tsx`)
- Блок «Сообщество»: перевести на `Surface` без кастомных margin, ширина = ширине `TabPageSurface`.  
- Проверить `StatsSummary` и `DailyTasksBar`: добавить `className="w-full"` и `gap-md`, исключить дополнительный контейнер для нижнего блока.  
- Вынести административные кнопки (если появятся) в модальное меню.

### Обмен (`webapp/src/screens/ExchangeScreen.tsx`)
- Навигационные табы — оставить, но заменить оболочку `Panel` на `Surface tone="primary"` без рамки, чтобы избежать «окна».  
- `ShopPanel`: прокидывать `fullWidth` проп, чтобы карточки растягивались (правка в `webapp/src/components/ShopPanel.tsx`).  
- `BuildingsPanel`: убрать дополнительный `Panel`, использовать `div className="flex-1 overflow-y-auto"` вместо внутренней прокрутки.

### Друзья (`webapp/src/screens/FriendsScreen.tsx`)
- Блок «Топ игроков»: выровнять по ширине, убрать вторичный контейнер (`Surface tone="overlay"`) и заменить на `Card` в сетке 1хN.  
- Проверить `LeaderboardPanel` на предмет `max-w-lg` или фиксированных ширин; обеспечить `w-full`.

### Earn (`webapp/src/screens/EarnScreen.tsx`)
- Удалить дублирующие секции «Профиль»/«Аккаунт», перенаправить CTA на профиль.  
- Блок бустов: переключить на `Surface tone="secondary"` без внутреннего `Container`, добавить `gap-lg`.

### Новая вкладка «Chat»
- Создать `webapp/src/screens/ChatScreen.tsx` с табами `Global`, `Clan` (пока placeholder).  
- Обновить `navigationStore` и `BottomNavigation` для обработки бейджей (количество непрочитанных сообщений).

## Инфраструктура дизайн-системы
- `webapp/src/components/layout/TabPageSurface.tsx`: добавить props `maxWidth?: 'full' | 'xl'`, дефолтно `full` для мобильных.  
- `webapp/src/styles/tokens.css`: расширить токены overlay, добавить документацию по использованию `--layer-overlay-strong` только для модалок.  
- `webapp/src/components/Surface.tsx`: убедиться, что значения tone `primary | secondary | overlay` корректно поддерживают прозрачность для light/dark.

## QA и документация
- Обновить Chromatic stories: `BottomNavigation`, `ShopPanel`, `BuildingsPanel`, `FriendsPanel`, `EarnBoosts`, `ChatScreen`.  
- Перезаписать Playwright baseline (`docs/qa/baseline/<новая дата>`) после выравнивания ширин.  
- Отметить прогресс в `docs/qa/stage-f-checklist.md`, `docs/roadmap/migration-plan.md`, `docs/release-notes/stage-f.md`.

## Ответственные
- **Lead Product Designer / UX Lead** — владелец плана, контролирует соблюдение гайдлайнов.  
- **Frontend Chapter Lead** — оценивает сложность, распределяет задачи по команде.  
- **Product Manager** — утверждает обновлённую навигацию и чат.  
- **QA Automation** — обновляет визуальные тесты после правок.
