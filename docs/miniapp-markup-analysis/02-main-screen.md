# Main Screen & Tab Container

## Problems
- Заголовок и описание вторичных вкладок используют `text-white`/`text-white/60`, что ломает контраст в светлой теме (`webapp/src/screens/MainScreen.tsx:364-366`).
- Флоат-кнопка «Back to Tap» привязана к `bottom-20`, без учета безопасной зоны Telegram, из-за чего на iPhone с жестовой полосой кнопка частично перекрывается (`webapp/src/screens/MainScreen.tsx:373-388`).
- При смене вкладок контентный `ScreenTransition` получает `overflow-auto`, тогда как родитель уже `overflow-y-auto`; двойное колесо прокрутки ломает скролл-инерцию и makes scroll chaining непредсказуемым (`webapp/src/screens/MainScreen.tsx:298-339`).

## Recommendations
- Перевести `h2`/`p` на токены (`text-text-primary`, `text-text-secondary`) или Tailwind-утилиты, зависящие от темы.
- Расчитать отступ кнопки через `safeArea.safe.bottom` или CSS-переменные (`calc(16px + var(--safe-area-bottom))`) вместо жесткого `bottom-20`.
- Удалить внутренний `overflow-auto` из `ScreenTransition` и позволить скроллу жить на уровне `scrollRef`, либо задать `overflow-visible` внутри, чтобы не создавать nested scrolling.

## Strengths
- Основной контейнер опирается на `useSafeArea` и передает нижний паддинг с учетом таб-бара (`webapp/src/screens/MainScreen.tsx:108-110`, `webapp/src/screens/MainScreen.tsx:352-357`).
- Lazy + `Suspense` дают понятные skeleton'ы и не блокируют главный поток (`webapp/src/screens/MainScreen.tsx:296-343`).

## Next steps
- Обновить стили вкладок и плавающей кнопки.
- Проверить поведение скролла на устройствах с низкой высотой, исправив nested scroll.
