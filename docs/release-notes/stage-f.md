# Stage F — Feature Integration (TBD)

## Плановые изменения
- PvP Lobby + Event Schedule перенесены на дизайн-систему (Surface/Panel, stories, visual preview `visual.html?view=events`).
- Premium Shop и админские флоу: обновлённый PurchaseSuccessModal с premium/subscription вариантами и локалями.
- Seasonal Rewards: админ-панель для награждения топ‑3, фиксация снапшота сезона.
- Leaderboards/Social: Storybook сценарии для LeaderboardPanel (default/empty/error).

## Чеклист перед релизом
- [x] Все миграции отмечены в `docs/roadmap/migration-plan.md`.
- [x] Chromatic + Playwright чистые. _(Chromatic build #4 + `npx playwright test tests/qa/stage-f.spec.ts`)_
- [x] Seasonal Rewards UX согласован и задокументирован. _(см. раздел «Ежемесячный цикл сезона» в `docs/design/seasonal-rewards.md`)_
- [x] Release QA пройден по `docs/qa/stage-f-checklist.md`. _(подтверждено `docs/qa/stage-f-final-qa.md`)_

## Прогресс 2025-11-06
- Навигация приведена к мобильным гайдлайнам Telegram: вкладка `Airdrop` заменена на `Chat`, бар растянут до `max-w-screen-md`, safe area учитывается для padding.
- Добавлен экран `ChatScreen` с переключением Global/Clan (плейсхолдер до запуска чатов), обновлены роуты и guard.
- Верхний статус-бар синхронизирован с `setHeaderColor`/`setBackgroundColor`, safe area пересчитывается через `viewport_changed`.
- Админские действия спрятаны из Tap/Exchange/Friends/Earn; вход в админку доступен только через профиль и проверку роли.
- Добавлены компоненты `MatchLobby`, `EventSchedule`, экран `PvPEventsScreen` и preview для быстрой валидации темной/светлой тем.
- `PurchaseSuccessModal` поддерживает варианты `standard/premium/subscription`, локализацию RU/EN, произвольные награды и вспомогательные ссылки; добавлены storybook-примеры и visual preview параметры `variant`, `locale`, `currency`.
- Storybook пополнен сценариями `MatchLobby`, `EventSchedule`, `LeaderboardPanel`, `SeasonRewardsAdminPanel`; линтер и форматирование проходят (`npm run lint`).
- Админ-интерфейс Seasonal Rewards (top-3, купоны, напоминания) вынесен в `SeasonRewardsAdminPanel` + stories с `NotificationContainer`.
- Playwright QA расширен (`tests/qa/stage-f.spec.ts`) для премиум-покупок и PvP events preview; Chromatic build #3 зафиксировал новые stories.
- Бэкенд: `/admin/seasons/snapshot` и `/admin/seasons/:seasonId/reward` возвращают актуальный снапшот сезона и принимают команды на выдачу наград (логируются события `season_reward_granted`).

## Прогресс 2025-11-07
- FriendsScreen приведён к дизайн-системе: единые `Surface`, новая Chromatic story, обновлённый `FriendsList` и `ReferralRevenueCard`.
- Seasonal Rewards UX финализирован: утверждены призовые пакеты, добавлены купонные скрипты и тексты (`docs/design/seasonal-rewards.md`, i18n `season.reward.*`).
- Ежемесячный сезонный цикл задокументирован: cron → snapshot → admin выдача (см. `docs/design/seasonal-rewards.md`), TTL/архив описаны для поддержания Stage G.
- Playwright `stage-f.spec.ts` проходит на `npm run preview` (покупки, PvP превью, чаты); конфиг автоматически поднимает превью-сервер.
- Premium Shop завершён на DS: `ShopPanel` получил storybook-витрины, а `AdminMonetizationScreen` теперь показывает тот же каталог (проверено Playwright `stage-f.spec.ts` через admin-modal).
- Chromatic build #4 фиксирует FriendsScreen/LeaderboardPanel/ShopPanel stories и служит регрессионной сеткой для социальных экранов.
- Legacy `text-token-*` классы убраны, компоненты используют `text-text-*` токены Tailwind; подготовлено к чистке остальных `card-*` хелперов.

## История
- _Заполнить после релиза_
