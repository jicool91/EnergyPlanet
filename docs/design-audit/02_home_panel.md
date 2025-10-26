# Дизайн-аудит — HomePanel

- **Элемент**: `webapp/src/components/HomePanel.tsx`
- **Статус**: ⚠️ Требует корректировок

## Замечания
1. **Типографика**: Смешение размеров (`text-lg`, `text-caption`, кастомные классы) без единой шкалы. Предлагается зафиксировать шкалу (12/14/16/20/24) и использовать дизайн-токены (`text-body`, `text-heading`). citeturn5view0
2. **Tap Button**: Градиент `from-cyan via-lime to-gold` + `border-cyan/50` создаёт “нечёткие” края в тёмной теме, а glow-слой с `opacity-20` может превышать доступную яркость. Рассмотреть `bg-gradient-to-br from-cyan-400 to-lime-300` и `shadow-[0_0_30px_rgba(34,211,238,0.5)]`.
3. **Streak Badge**: Текст `text-sm` на градиентном фоне без solid подложки → низкая читаемость. Добавить `bg-black/40` и `backdrop-blur`.
4. **Card Layout**: Отступы `px-4 py-2` и `gap-2` различаются от правой колонки `gap-2 px-4`. Выровнять spacing (например, использовать `gap-3` и консистентные paddings).
5. **Motion**: Glowing tap button анимирует scale 1 → 1.2 каждые 2 сек — на low-performance может вызвать jank (уже отключено, но добавьте `motion-safe` класс вместо JS логики).

## Рекомендации по Tailwind
- Применить токены: `className="text-token-primary text-[length:theme(fontSize.base)]"` / `text-heading`.
- Tap button: `className="relative w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 via-lime-400 to-amber-300 text-slate-900 font-black text-4xl shadow-[0_20px_40px_rgba(5,150,105,0.35)] focus-visible:ring-4 focus-visible:ring-cyan-300/70 motion-reduce:transform-none"`.
- Streak badge: `className="bg-black/40 text-white px-3 py-1 rounded-full backdrop-blur-sm"`.
- Присвоить родителю `lg:px-6` и правой колонке `gap-3`.

## Влияние на UX
- Стандартизованная типографика и контраст улучшают читабельность (особенно в тёмной теме) и создают ощущение “премиум” качества — важно для монетизации и удержания.
