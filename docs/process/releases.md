# Release Process — Energy Planet DS

## Перед релизом
- [ ] Обновить `docs/release-notes/<stage>.md`
- [ ] Проверить `docs/qa/stage-*-checklist.md` — нет открытых пунктов
- [ ] Убедиться, что Chromatic и Playwright зелёные
- [ ] Проверить доступность (contrast, focus) на ключевых экранах

## Чеклист деплоя
1. `npm run build` (webapp/backend) — локальная сборка.
2. `npm run test:storybook` — ссылка в релиз-нотах.
3. `npm run test:qa` — ссылка на Playwright репорт.
4. Обновить `docs/process/releases.md` (раздел «История релизов»).

## После выката
- [ ] Проверить метрики (render latency, tap success) в Grafana.
- [ ] Собрать обратную связь → `docs/training/stage-e-faq.md`.
- [ ] Обновить статусы в `docs/roadmap/migration-plan.md`.

## История релизов
- 2025-11-06 — Stage D QA & Chromatic rollout (см. `docs/release-notes/stage-d.md`)

## Visual Bug Triage (Chromatic + Jira)
1. **Дифф обнаружен**
   - Chromatic помечает story как `changes`. Отвечаем в UI → оставляем комментарий с контекстом (ссылка на PR/commit).
2. **Классификация**
   - `severity:major` (блокер релиза) → создаём Jira `DS-VISUAL` + label `chromatic-regression`.
   - `severity:minor` → если ожидаемое изменение, фиксируем комментарий + approve diff.
3. **Роутинг**
   - Команда-владелец story указана в описании (см. `stories/*.stories.tsx`, параметр `parameters.owner`). Slack-бот `#ds-visual-alerts` дублирует ссылку.
4. **Фикс / апрув**
   - После мерджа из PR → снова `npm run test:storybook -- --exit-zero-on-changes`.
   - Accept/Reject выполняет только владелец фичи или DS Tech Lead.
5. **Отчётность**
   - Скрипт `scripts/chromatic-metrics.mjs` агрегирует кол-во diff’ов и экспортирует в `docs/qa/evidence/<date>/chromatic-*.md`.
