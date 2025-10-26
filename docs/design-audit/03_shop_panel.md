# Дизайн-аудит — ShopPanel

- **Элемент**: `webapp/src/components/ShopPanel.tsx`
- **Статус**: ⚠️ Требует корректировок

## Замечания
1. **Heading**: `bg-clip-text` с градиентом `from-gold to-orange` на заголовке `🚀 Power Up` — красиво, но на Android WebView (sRGB) текст может выглядеть блекло. Рассмотрите solid цвет с акцентной подчеркивающей линией. citeturn5view0
2. **Card Consistency**: Mix `border-gold/30`, `border-cyan/10`, `border-lime/40`. Нет системной палитры для состояний (featured, default, best value). Введите токены `border-surface-highlight`, `border-surface-muted`.
3. **Price Tags**: `text-caption text-gold/80` на тёмном фоне ~2.9:1 контраст. Усилить `text-amber-200` или `text-white`.
4. **Section Tabs**: Варианты `primary` vs `ghost` не имеют underline → зрительно трудно понять активный таб. Добавить `shadow-inner`/`border`.
5. **Responsive**: Крупные карточки (`flex gap-4`) могут переполняться на <360px. Нужно `flex-col sm:flex-row`.

## Рекомендации
- Ввести дизайн-токены: `--shop-card-border-default`, `--shop-card-border-featured`.
- Price label: `className="text-sm font-semibold text-amber-100"`; стоимость/⭐ `text-amber-200`.
- Tabs: `className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition', active ? 'bg-cyan-500 text-slate-900 shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}`.
- Featured card: добавить `ring-2 ring-amber-300` вместо размытой тени.

## Влияние на UX
- Чёткая палитра и читаемые цены повышают доверие к магазину и уменьшают решение “подождать”.
