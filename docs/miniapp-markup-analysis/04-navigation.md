# Navigation (Header, TabBar, Floating Actions)

## Problems
- Нижний таб-бар жестко окрашен (`bg-black/85`, `text-white/60`) и не реагирует на `themeParams`, из-за чего в светлой теме контраст становится недостаточным (`webapp/src/components/TabBar.tsx:69-93`).
- Для набора вкладок не задана семантика ARIA (`role="tablist"`, `role="tab"`), поэтому скринридеры не произносят состояние текущей вкладки (`webapp/src/components/TabBar.tsx:68-105`).
- Фиксированная кнопка «Back to Tap» не использует безопасную зону (повтор проблем из [02-main-screen.md](./02-main-screen.md)), из-за чего закрывается системными элементами (`webapp/src/screens/MainScreen.tsx:373-388`).

## Recommendations
- Перейти на тему-зависимые токены для фона и текста таб-бара (`bg-[var(--app-bottom-bar-bg)]`, `text-[var(--color-text-secondary)]` и пр.).
- Добавить `role="tablist"` на `footer`, `role="tab"` на кнопки и `aria-controls` для связи с контентом вкладок.
- Позиционировать плавающую кнопку через `calc`/CSS-переменные безопасной зоны, либо рендерить ее внутри контейнера, где `paddingBottom` уже учитывает inset.

## Strengths
- Заголовок экрана корректно учитывает верхний safe-area и добавляет `focus-visible` стили для интерактивных элементов (`webapp/src/components/MainScreenHeader.tsx:38-91`).
- Таб-бар автоматически скроллит активную вкладку в видимую область, что улучшает UX на маленьких экранах (`webapp/src/components/TabBar.tsx:53-66`).

## Next steps
- Применить токены к навигации и внедрить ARIA-атрибуты.
- Проверить клавиатурную навигацию и работу скринридеров после правок.
