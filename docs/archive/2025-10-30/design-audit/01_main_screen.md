# Дизайн-аудит — MainScreen оболочка

- **Элемент**: `webapp/src/screens/MainScreen.tsx` (корневой контейнер, скролл-область, плавающая кнопка)
- **Статус**: ⚠️ Требует корректировок

## Замечания
1. **Контраст и фон**: Плавающая кнопка `bg-gradient-to-r from-cyan/20 to-lime/20` на тёмном фоне может давать контраст < 3:1. Требуется проверить и усилить непрозрачность (`from-cyan/40`). citeturn2view0turn5view0
2. **Safe area**: Горизонтальные отступы отсутствуют — на iPhone 14 Pro Max в landscape элементы могут “прилипать” к краю. Добавить `px` с использованием `safeArea.safe.left/right`.
3. **Focus state**: `motion.button` без `focus-visible` класса → пользователи клавиатуры не видят фокус. Добавить `focus-visible:ring-2` + `focus-visible:ring-cyan/60`.
4. **Motion**: Framer Motion анимации не учитывают `reduceMotion` (нет проверки). Для контейнерных переходов добавить `prefers-reduced-motion` guard. citeturn2view0

## Рекомендации по Tailwind
- Для плавающей кнопки: `className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+80px)] rounded-full bg-gradient-to-r from-cyan/50 to-lime/50 text-slate-900 shadow-lg focus-visible:ring-2 focus-visible:ring-cyan/70"` + `motion` анимацию оборачивать проверкой `shouldReduceMotion`.
- На корневом контейнере добавить `px-4 sm:px-6` при landscape (`@media (orientation: landscape)`), либо через inline style `paddingInline`.
- Для `ScreenTransition` добавить класс `motion-safe:animate-fade` / `motion-reduce:transition-none`.

## Влияние на UX
- Повышение доступности (фокус), соответствие WCAG контрасту, уменьшение качелей между темами → повышает доверие и воспринимаемое качество.
