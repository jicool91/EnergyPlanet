# App Shell (Index + Root)

## Problems
- Корневой контейнер использует фиксированный градиент `bg-gradient-to-b from-dark-bg to-black`, поэтому тема Telegram не влияет на фон (`webapp/src/App.tsx:167`).
- Разметка объявлена как английская, хотя интерфейс и тексты на русском (`webapp/index.html:2`).
- `meta name="theme-color"` захардкожена в `#000000`, игнорируя `themeParams` и режим `auto` (`webapp/index.html:6`).

## Recommendations
- Подменить фон на `bg-[var(--app-bg)]` или другой токен, сохранив градиент через CSS-переменные, чтобы светлая/кастомная тема выглядела корректно.
- Выставить правильный язык (`lang="ru"`) либо динамически подтягивать его из настроек локализации.
- При инициализации `Telegram.WebApp` обновлять `meta[name="theme-color"]` текущим значением `themeParams.bg_color`; helper уже есть в `telegramTheme.ts`.

## Strengths
- В `index.html` уже прописан `viewport-fit=cover`, что раскрывает безопасные зоны (`webapp/index.html:5`).
- `App` получает `safeArea` и прокидывает обертку padding'ами, уменьшая вероятность перекрытия контента на устройствах с вырезами (`webapp/src/App.tsx:61-71`).
- `initializeTelegramWebApp` вызывает `ready()`, `expand()` и `disableVerticalSwipes()`, корректно инициализируя окружение (`webapp/src/services/telegram.ts:333-360`).

## Next steps
- Перевести фон и цветовую схему на токены.
- Пропатчить `index.html` (lang + theme-color) и убедиться, что `updateThemeVariables` действительно синхронизирует метатеги при смене темы.
