# Release management

## 1. Цикл
1. **Planning** (пн) — собрать список задач, обновить `roadmap/2025.md`.
2. **Development** (пн–чт) — feature branches, PR → review (минимум 1 backend + 1 frontend reviewer, если фуллстек).
3. **Freeze** (пт, 12:00 UTC) — merge window закрыт, только hotfix.
4. **Deploy** (пт, 15:00 UTC) — Jenkins main pipeline, мониторинг 2 часа.
5. **Post-release** — метрики, user feedback, QA evidence.
6. **Season wrap-up** — после завершения сезона запустите `npm run season:rewards` (backend) или аналогичную Jenkins-задачу, чтобы автоматически начислить лидербордные награды по конфигу `season_XXX.yaml`.

## 2. PR чеклист
- [ ] Обновлены/созданы тесты.
- [ ] Документация (`docs/…`) актуальна.
- [ ] Локально прошли `npm run lint && npm run test` (backend) / `npm run lint && npm run typecheck` (frontend).
- [ ] Нет TODO/console.log в коде.
- [ ] Для контентных правок — приложен diff JSON + обоснование.

## 3. Версионирование
- Семафор: пока монорепо без пакета версий, используем `git tag vYYYY.MM.DD` при крупных релизах.
- Привязывайте релиз к набору миграций (`migrations/0xx`).
- Release notes — складываем в `docs/release-notes/` (создавайте файл `YYYY-MM-DD.md`).

## 4. Rollback политика
- При критических багах откатываем деплой через `kubectl rollout undo`.
- Если проблема в миграции — откат SQL (если `DOWN` безопасен) или восстановление из snapshot.
- В течение 24 часов после релиза допускаются hotfix’ы (новый commit → Jenkins → deploy).

## 5. Коммуникации
- Slack/Telegram канал `#energy-planet-release` получает уведомления Jenkins.
- После релиза пишем короткий отчёт (что вышло, что проверить) + статус метрик.
- При инциденте — следуем runbook, создаём postmortem.

## 6. Артефакты
- Docker images: `${DOCKER_REGISTRY}/energy-planet-backend:${commit}` и `${DOCKER_REGISTRY}/energy-planet-webapp:${commit}`.
- DB миграции: лог в Jenkins + job output.
- QA отчёты: `webapp/playwright-report-qa`, `docs/qa/evidence/<date>`.

## 7. Compliance
- Все изменения, касающиеся данных пользователей (auth/session, purchases), требуют code review от BE lead.
- Конфигурации secrets не коммитим — только шаблоны (`k8s/secrets.yaml`).
- Контент с экономикой (quests, star packs) согласуется с геймдизайном/монетизацией до merge.

Поддерживайте этот процесс в актуальном состоянии, фиксируйте отступления (например, динамичные релизы во время ивентов).
