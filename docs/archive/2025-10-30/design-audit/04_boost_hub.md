# Дизайн-аудит — BoostHub

- **Элемент**: `webapp/src/components/BoostHub.tsx`
- **Статус**: ⚠️ Требует корректировок

## Замечания
1. **Card Layout**: Кнопка и текст находятся в одной колонке; на узких экранах текст “Длительность / Кулдаун” ломается. Необходимо адаптивное расположение (`flex-col md:flex-row`). citeturn5view0
2. **Badge**: `Badge variant="warning"` (желтый) на градиенте может быть плохо виден. Добавить outline или сменить фон карточки.
3. **Countdown Label**: `buttonLabel` часто длинный (“Кулдаун 01м30с”) вмещается, но на других языках выйдет за рамки. Нужен `min-w` + `whitespace-nowrap`.
4. **Refresh Button**: Используется `Button variant="secondary"` — визуально слабый, можно добавить иконку `svg` (clock) и `aria-label`.

## Рекомендации
- Карточка: `className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20"`.
- Сетка durations: `className="flex flex-wrap gap-3 text-sm text-slate-300"` + `space-y` для вертикального режима.
- CTA: `className={clsx('px-4 py-2 rounded-lg font-semibold transition', disabled ? 'bg-slate-700 text-slate-400' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950')}` + `motion-reduce`.

## Влияние на UX
- Повышает читаемость и предотвращает layout shift, особенно важный при таймерах/ограничениях.
