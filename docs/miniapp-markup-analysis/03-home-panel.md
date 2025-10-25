# Home Panel & Primary Cards

## Problems
- `StatCard` задает цвета напрямую (`text-white`, `bg-dark-secondary/70`), не подхватывая `themeParams` (`webapp/src/components/StatCard.tsx:16-58`).
- Баннер ежедневной награды полностью на контурах `gold/orange`, что конфликтует с кастомной палитрой и не читабельно в светлой теме (`webapp/src/components/DailyRewardBanner.tsx:44-88`).
- `SocialProofCard` и секция «Следующая цель» снова используют `text-white`/`text-white/70`, обходя дизайн-токены (`webapp/src/components/SocialProofCard.tsx:23-37`, `webapp/src/components/HomePanel.tsx:200-224`).
- Правая колонка объявлена как `overflow-y-auto`, поверх основного скролла `MainScreen`, в итоге на iOS/Android появляются вложенные области прокрутки (`webapp/src/components/HomePanel.tsx:179-180`).

## Recommendations
- Перевести `StatCard`, баннер, social-proof на `var(--color-*)` токены и/или Tailwind классы с CSS переменными. Цветовые состояния можно вынести в тему через `data-scheme`.
- Для CTA/баннеров использовать градиенты, вычисляемые из токенов (`color-mix`), либо добавить стили в тему, чтобы подсветка не ломалась в темной/светлой палитре.
- Убрать `overflow-y-auto` из правой колонки или сделать ее flex-контейнером с `min-h-0`, полагаясь на общий скролл.

## Strengths
- `HomePanel` корректно учитывает `safeArea.content` и резервирует место под таб-бар (`webapp/src/components/HomePanel.tsx:77-84`).
- Центральная кнопка имеет `aria-label`, `focus-ring` и fallback-анимации для low-end устройств (`webapp/src/components/HomePanel.tsx:143-175`).

## Next steps
- Рефакторить карточки и баннеры на дизайн-токены.
- Перепроверить скролл в вертикальной ориентации после удаления nested scroll.
