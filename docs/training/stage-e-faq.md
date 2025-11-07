# Stage E Walkthrough & FAQ

## Walkthrough (TL;DR)
1. **Design review** — изучаем `docs/design/DESIGN_SYSTEM_GUIDE.md` и `docs/design/migration-guide.md`.
2. **Playwright/Chromatic** — перед демо прогоняем `npm run test:qa` и `npm run test:storybook`, делимся ссылками.
3. **Созвоны/демо** — показываем ключевые паттерны: ShopPanel, ModalBase, LevelUpScreen с reduced-motion.
4. **Feedback loop** — после воркшопа фиксируем вопросы/решения здесь, обновляем roadmap.

## Частые вопросы
### Как запустить Storybook и Chromatic?
- `cd webapp && npm install` (один раз)
- `npm run storybook` — локальный просмотр на `http://localhost:6006`
- `npm run test:storybook` — опубликовать снапшоты (Chromatic)
- Детали: `docs/setup/storybook.md`

### Какие чеклисты обязательны перед PR?
- `npm run lint`, `npm run typecheck`
- `npm run test:contrast`
- `npm run test:storybook`
- Обновить `docs/roadmap/migration-plan.md`
- Приложить скриншоты dark/light

### Что делать, если diff в Chromatic легитимный?
- Оставьте комментарий в PR
- Аппрувните дифф в Chromatic UI
- Зафиксируйте изменение в `docs/release-notes/stage-f.md`, если это фича

### Где хранятся материалы воркшопов?
- Слайды/скринкасты: `docs/training/assets/` (создавайте при необходимости)
- Конспекты: текущий файл (`stage-e-faq.md`) + ссылки на записи в комментариях

### Как следить за миграцией экранов?
- Таблица в `docs/roadmap/migration-plan.md` — обновляйте статус, владельца и дату

### Что делать при спорных решениях по UX?
- Поднимайте вопрос в `docs/training/stage-e-faq.md` (раздел «Open Questions» ниже)
- Созваниваемся в ближайший DS синк и затем обновляем гайд

## Open Questions
- _Добавьте сюда нерешённые темы после воркшопов._
