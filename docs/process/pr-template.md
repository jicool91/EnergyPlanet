# PR Checklist — Design System Rollout

Копируйте секцию в описание PR:

```markdown
## Design System Checklist
- [ ] Обновил(а) `docs/roadmap/migration-plan.md`
- [ ] Приложил(а) скриншоты dark/light (Telegram frame)
- [ ] `npm run lint && npm run typecheck`
- [ ] `npm run test:contrast`
- [ ] `npm run test:storybook` (ссылка на Chromatic build: …)
- [ ] Для визуальных диффов: приложен комментарий/approve в Chromatic
- [ ] Обновлены релиз-ноты при необходимости (`docs/release-notes/...`)

## Notes
- Кратко опишите изменения/риски
- Укажите, требуется ли manual QA (какие сценарии)
```

Добавьте ссылку на этот файл в репозиторный шаблон PR (GitHub → Settings → PR template) при необходимости.
