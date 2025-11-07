# Stage E Rollout Checklist (2025-11-06)

## 1. Документация и гайды
- [x] Обновить `docs/design/DESIGN_SYSTEM_GUIDE.md` с новыми токенами/компонентами.
- [x] Добавить раздел “Как мигрировать экран на DS” в `docs/design/migration-guide.md` (или создать файл).
- [x] Обновить `README.md` и `docs/setup/storybook.md` с инструкциями по `npm run storybook` и `npm run test:storybook`.

## 2. Обучение и коммуникация
- [x] Подготовить walkthrough (видео/demo) и сохранить конспект в `docs/training/`.
- [x] Провести воркшоп для разработчиков и дизайнеров; итоговый FAQ положить в `docs/training/stage-e-faq.md`.
- [x] Согласовать roadmap миграции экранов (PvP, Events, Premium Shop) и зафиксировать его в `docs/roadmap/migration-plan.md`.

## 3. Процесс и инструменты
- [x] Добавить чеклист DS в `docs/process/pr-template.md` и Contributing guide.
- [x] Настроить напоминания (описать в `docs/process/releases.md`) про запуск Chromatic/Playwright перед релизом.
- [x] Сформировать список задач по командам/фичам в `docs/roadmap/migration-plan.md`.

## 4. Мониторинг и обратная связь
- [x] Сформировать форму/опрос для команды по UX-аудиту после миграции. _(см. `docs/process/ux-audit-survey.md`)_
- [x] Добавить метрики Adoption (кол-во экранов на DS) в Notion/Analytics. _(см. `docs/process/ds-adoption-metrics.md`)_
- [x] Согласовать процесс triage визуальных багов (Chromatic diffs + Jira labels). _(см. раздел «Visual Bug Triage» в `docs/process/releases.md`)_
