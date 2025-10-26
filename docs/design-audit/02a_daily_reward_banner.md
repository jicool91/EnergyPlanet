# Дизайн-аудит — DailyRewardBanner

- **Элемент**: `webapp/src/components/DailyRewardBanner.tsx`
- **Статус**: ❌ Критично

## Замечания
1. **Градиент и текст**: Фон `bg-gradient-to-r from-gold/40 to-orange/40` на белом тексте `text-[var(--color-gold)]` даёт низкий контраст (<3:1) → нарушает WCAG. Требуется тёмный текст или более светлый фон. citeturn5view0
2. **Motion Overlay**: Анимированный overlay `x: ['-100%', '100%']` без `motion-reduce` → укачивающий эффект, особенно при каждом рендере.
3. **CTA Button**: Цвет `bg-gradient-to-r from-gold to-orange` с текстом `text-dark-bg` (неопределённая переменная). Проверить значение переменной, иначе может оказаться чёрным на тёмно-коричневом.
4. **Layout**: При длинной локализации строка `Приходит через {timeLeft}` может переноситься и ломать сетку (нет `min-w`).

## Рекомендации
- Фон: `bg-amber-200` + текст `text-amber-950`, либо оставить градиент, но текст `text-white` с добавлением `bg-black/30`.
- CTA: `className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:transform-none"`.
- Добавить `motion-reduce:transition-none` и условный `animate-none` при `prefers-reduced-motion`.
- Обеспечить `min-w-[220px]` для левой части и `flex-wrap`.

## Влияние на UX
- Улучшение контраста повышает воспринимаемую ценность награды и снижает утомляемость глаз; корректный CTA важен для дневного retention.
