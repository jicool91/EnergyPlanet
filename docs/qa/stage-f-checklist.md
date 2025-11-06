# Stage F Feature Integration Checklist (2025-11-06)

## PvP / Events
- [x] Перенести PvP Match Lobby на компоненты DS (Surface, Tabs, Toast). _(см. `webapp/src/components/pvp/MatchLobby.tsx`, stories + preview `visual.html?view=events`)_
- [x] Обновить Event Schedule под dual-accent/light темы и новые токены. _(см. `webapp/src/components/events/EventSchedule.tsx`)_
- [x] Покрыть PvP/Event сценарии Storybook stories + Chromatic снапшотами. _(Chromatic build #3 опубликован `npm run test:storybook -- --exit-zero-on-changes`)_

## Premium Shop & Monetization
- [ ] Мигрировать Admin/Premium Shop экраны на `ShopPanel`/`ProductTile`.
- [x] Доработать PurchaseSuccessModal для премиум-предложений (варианты, локали).
- [x] Обновить Playwright QA для премиум-покупок с mock-инвойсами. _(см. `webapp/tests/qa/stage-f.spec.ts`)_

## Leaderboards & Social
- [ ] Применить DS к Friends/Clan доскам (типографика + фокус).
- [x] Добавить Storybook stories для LeaderboardPanel (dark/light, empty/error).
- [ ] Настроить Chromatic regression для новых social-компонентов.

## Seasonal Rewards
- [ ] Ввести модель «сезон раз в месяц» с фиксацией итоговых рейтингов.
- [x] Реализовать админ-экран с кнопками награждения топ-3 прошлого сезона (разные призы).
- [ ] Подготовить UX/тексты для выдачи купонов (например, Wildberries) и интегрировать в игру (`docs/design/seasonal-rewards.md`).

## Release Readiness
- [ ] Схлопнуть legacy CSS/компоненты (убрать старые `text-*`, `card-*`).
- [ ] Обновить `docs/release-notes/stage-f.md`, перечислив мигрированные фичи и метрики.
- [ ] Провести финальную QA с чеклистами Stage D/E и зафиксировать переход в Stage G.
- [ ] Подтвердить, что админские элементы скрыты на Tap/Exchange/Friends/Earn и доступны только через профиль.
- [ ] Протестировать новую вкладку Chat в нижней навигации (safe area, бейджи, возврат назад).
