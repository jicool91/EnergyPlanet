# Stage D — QA & Automation Rollout (2025-11-06)

## Кратко
- Playwright QA-раннер закрывает лидборд, магазин и покупки (mock invoice → purchase) с сохранением артефактов в `docs/qa/evidence/2025-11-06`.
- Контраст и reduced-motion протестированы; LevelUp/AuthError модалки прокручивают фокус корректно.
- Storybook + Chromatic добавлены в пайплайн (`npm run test:storybook`) для компонентных регрессий.

## Что сделано
- Детерминированные StageMocks для `leaderboard`, `purchase/packs`, `invoice/purchase`, `boosts`, `referrals`.
- Новые визуальные превью `/visual.html?view=…` и базлайны Playwright в `docs/qa/baseline/2025-11-06`.
- Метрики `render_latency` и `tap_success` отправляются на Prometheus/Grafana Stage D дашборд.

## Что дальше
- Stage E: обновить гайды в `docs/design/`, подготовить walkthrough и roadmap миграции.
- Stage F: перенос PvP/Events/Premium Shop на дизайн-систему + запуск сезонных наград.
