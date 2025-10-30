# Дизайн-аудит — LeaderboardPanel

- **Элемент**: `webapp/src/components/LeaderboardPanel.tsx`
- **Статус**: ✅ Соответствует (с небольшими правками)

## Замечания
1. **Mobile Layout**: Проверьте ветку `<div className="hidden sm:block">`; для мобильного отсутствует адаптивная версия. Добавить карточки (`flex flex-col gap-2`) и скрыть таблицу. citeturn5view0
2. **Colour Palette**: Медали (emoji) + cyan backgrounds гармоничны. Убедитесь, что `bg-cyan/[0.15]` имеет достаточную контрастность с текстом (можно усилить до `/0.2`).
3. **Motion**: Highlight текущего пользователя с `motion.div` — добавить `motion-reduce:bg-cyan-700` fallback.

## Рекомендации
- Для мобильного режима создать компонент `LeaderboardCard` с Tailwind: `className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-700"`.
- Текущий пользователь: добавить `outline outline-2 outline-cyan-400/60`.

## Влияние на UX
- Улучшение мобильного представления повышает вовлеченность пользователей, заходящих через компактное окно Telegram.
