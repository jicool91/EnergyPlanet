# Дизайн-аудит — Button System

- **Элемент**: `webapp/src/components/Button.tsx`
- **Статус**: ⚠️ Требует корректировок

## Замечания
1. **Spacing & Radii**: Используются `rounded-sm`, `rounded-md`, `rounded-lg` внутри одного компонента. Лучше задать через variant токен (`rounded`, `rounded-lg`) в дизайн-системе.
2. **Colour tokens**: `btn-primary` полагается на кастомный класс. Убедитесь, что он определён в Tailwind theme (проверить `webapp/src/styles`). Для поддержания темы Telegram лучше использовать прямые Tailwind цвета, настроенные в config. citeturn2view0
3. **Focus Ring**: `focus-visible:ring-[var(--app-accent)]` — хорошо, но для светлой темы может быть нечитаемым. Добавить fallback `focus-visible:ring-cyan-400`.
4. **Motion**: `whileHover`/`whileTap` без проверки `prefers-reduced-motion`. Добавить `motion-reduce` обработку.
5. **Loading State**: Spinner svg окрашен `currentColor`; если кнопка зелёная (`success`), spinner зелёный и теряется. Сделать `text-slate-900`.

## Рекомендации
- Tailwind config: определить `colors: { accent: '#22d3ee', success: '#bef264', danger: '#f87171' }` и использовать `bg-accent`, `bg-success`.
- Добавить класс `motion-reduce:hover:scale-100 motion-reduce:active:scale-100`.
- Loading spinner: `className="w-4 h-4 text-slate-900"` + `motion.svg` inherits fill `currentColor`.

## Влияние на UX
- Консистентные кнопки создают предсказуемые взаимодействия, сокращают когнитивную нагрузку и повышают доверие к оплате/важным действиям.
