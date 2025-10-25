# Obshchiy sloy (Top Layer)

Этот аудит обходит ключевые слои мини-приложения и проверяет, насколько верстка следует best practices Telegram Mini Apps. Каждый вложенный документ разбирает связанный блок интерфейса и содержит структурированный вывод:

- [01-app-shell.md](./01-app-shell.md) — обертка приложения, `index.html`, глобальные параметры.
- [02-main-screen.md](./02-main-screen.md) — корневой экран с табами и контентным скроллом.
- [03-home-panel.md](./03-home-panel.md) — домашний блок, карточки статов и CTA.
- [04-navigation.md](./04-navigation.md) — хедер, нижняя навигация, вспомогательные кнопки.
- [05-secondary-panels.md](./05-secondary-panels.md) — магазин, постройки, рейтинг, профиль, настройки.

## Problems
- Жестко заданные темные цвета повторяются по всему UI (`text-white`, `bg-black/85`, пр.), поэтому светлая тема и кастомные `themeParams` Telegram не отрабатывают корректно. См. примеры в `webapp/src/App.tsx:167`, `webapp/src/screens/MainScreen.tsx:364`, `webapp/src/components/TabBar.tsx:70` и дочерних файлах.
- Плавающие элементы не учитывают безопасную зону: кнопка «Back to Tap» закреплена на `bottom-20`, игнорируя `safeArea` (`webapp/src/screens/MainScreen.tsx:382`).
- Telegram MainButton нигде не подключен, хотя хук подготовлен (`webapp/src/hooks/useTelegramMainButton.ts:15`) и сценарии (покупки, бусты) подразумевают системную кнопку подтверждения.
- Документ объявлен как `lang="en"` при русском интерфейсе и фиксированном `theme-color`, что ухудшает доступность и цветовую синхронизацию (`webapp/index.html:2`, `webapp/index.html:6`).

## Recommendations
- Перевести стили на токены (`--color-text-*`, `--app-*`, Tailwind utilities с `bg-[var(--...)]`) и избегать жестких значений. Детали по блокам — в вложенных файлах.
- Обернуть фиксированные элементы в вычисление `safeArea` и/или использовать CSS-переменные `env(safe-area-inset-bottom)` для правильного позиционирования.
- Интегрировать `useTelegramMainButton` в сценарии «покупка», «активация буста», «сохранение настроек», чтобы соответствовать UX Telegram Mini Apps.
- Обновить `<html lang>` и `theme-color`, отдавая актуальный цвет из `Telegram.WebApp.themeParams`.

## Strengths
- Глобально подключены `viewport-fit=cover` и собственный `useSafeArea`, поэтому большинство контейнеров могут учитывать безопасные отступы (`webapp/src/App.tsx:61`, `webapp/src/screens/MainScreen.tsx:352`).
- Сервис `telegram.ts` корректно вызывает `webApp.ready()`, `expand()` и синхронизирует тему/безопасные зоны (`webapp/src/services/telegram.ts:333-372`).
- Большинство модалок и панелей используют skeleton/suspense подход, что упрощает анализ загрузочных состояний (`webapp/src/screens/MainScreen.tsx:298-334`).

## Next steps
- Пройтись по каждому вложенному документу и завести задачи на фиксы.
- После рефакторинга запустить повторный аудит промптом, чтобы убедиться, что цвета и safe-area корректно подхватываются.
- Добавить в CI регрессионную проверку стилей (например, визуальные снапшоты) после перевода на токены.
