# Дизайн-аудит — SettingsScreen

- **Элемент**: `webapp/src/components/settings/SettingsScreen.tsx`
- **Статус**: ✅ Исправлено (26.10.2025)


## Обновления 26.10.2025
- Радиокнопки тем/вибрации получили рамку, `focus-ring` и высококонтрастные состояния.
- Ссылки на политику/условия временно заменены на кнопки с уведомлением о статусе документа.
- Внутренние секции используют единый `gap-3`, визуальные отступы согласованы с дизайн-гидом.

## Замечания
1. **SelectButton**: Использует эмодзи + текст без четкой рамки в неактивном состоянии → недостаточный контраст. Добавить `border` и `focus-visible` состояние. citeturn2view0turn5view0
2. **Toggle**: Без видимой ручки тени на тёмной теме. Нужна подсветка `shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]`.
3. **Card spacing**: Одни секции используют `gap-2`, другие `gap-3` — стандартизируйте (`space-y-3`).
4. **Links**: `href="#privacy"` без внешней ссылки → визуально выглядят кликабельными, но ведут в никуда. Пока нет URL, примените `opacity-50 cursor-not-allowed`.

## Рекомендации
- SelectButton: `className={clsx('py-2 rounded-lg font-medium border transition', selected ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-lg' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700', 'focus-visible:ring-2 focus-visible:ring-lime-300')}`.
- Toggle: добавить `role="switch"` и Tailwind классы `focus-visible:ring-2 focus-visible:ring-cyan-300`.
- Card gaps: установить `className="flex flex-col space-y-3"` внутри `SettingsSection`.

## Влияние на UX
- Более четкие состояния и контраст увеличивают понятность настроек и доверие при управлении конфиденциальными действиями (logout, privacy).
