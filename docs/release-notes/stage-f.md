# Stage F — Feature Integration (TBD)

## Плановые изменения
- PvP Lobby + Event Schedule перенесены на дизайн-систему (Surface/Panel, stories, visual preview `visual.html?view=events`).
- Premium Shop и админские флоу: обновлённый PurchaseSuccessModal с premium/subscription вариантами и локалями.
- Seasonal Rewards: админ-панель для награждения топ‑3, фиксация снапшота сезона.
- Leaderboards/Social: Storybook сценарии для LeaderboardPanel (default/empty/error).

## Чеклист перед релизом
- [ ] Все миграции отмечены в `docs/roadmap/migration-plan.md`.
- [x] Chromatic + Playwright чистые. _(Chromatic build #3 + `npx playwright test tests/qa/stage-f.spec.ts`)_
- [ ] Seasonal Rewards UX согласован и задокументирован. _(см. обновление `docs/design/seasonal-rewards.md`, админ-панель `SeasonRewardsAdminPanel`)_
- [ ] Release QA пройден по `docs/qa/stage-f-checklist.md`.

## Прогресс 2025-11-06
- Добавлены компоненты `MatchLobby`, `EventSchedule`, экран `PvPEventsScreen` и preview для быстрой валидации темной/светлой тем.
- `PurchaseSuccessModal` поддерживает варианты `standard/premium/subscription`, локализацию RU/EN, произвольные награды и вспомогательные ссылки; добавлены storybook-примеры и visual preview параметры `variant`, `locale`, `currency`.
- Storybook пополнен сценариями `MatchLobby`, `EventSchedule`, `LeaderboardPanel`, `SeasonRewardsAdminPanel`; линтер и форматирование проходят (`npm run lint`).
- Админ-интерфейс Seasonal Rewards (top-3, купоны, напоминания) вынесен в `SeasonRewardsAdminPanel` + stories с `NotificationContainer`.
- Playwright QA расширен (`tests/qa/stage-f.spec.ts`) для премиум-покупок и PvP events preview; Chromatic build #3 зафиксировал новые stories.
- Бэкенд: `/admin/seasons/snapshot` и `/admin/seasons/:seasonId/reward` возвращают актуальный снапшот сезона и принимают команды на выдачу наград (логируются события `season_reward_granted`).

## История
- _Заполнить после релиза_
