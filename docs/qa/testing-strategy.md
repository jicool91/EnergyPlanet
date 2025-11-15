# QA стратегия

## 1. Покрытие по уровням
| Уровень | Инструмент | Ответственные |
|---------|------------|---------------|
| Unit | Jest (backend), Vitest/RTL (frontend) | Разработчики. |
| Integration | Supertest (API), Playwright (UI flows) | Разработчики + QA. |
| E2E (Telegram flows) | Playwright QA конфиг (`playwright.qa.config.ts`) | QA. |
| Визуальные снапшоты | Playwright Visual + Chromatic | QA/Design. |
| Перфоманс | Playwright `tests/performance/tap-loop.spec.ts`, профилирование tick/tap latency | TechOps. |
| Регрессы контента | Smoke скрипты (`/content/*`), ручные чек-листы | Продакты/LiveOps. |

## 2. E2E сценарии (Playwright)
- **Tap loop**: авторизация → open session → 50 тапов → tick → проверка энергии/XP.
- **Магазин**: открытие ShopScreen → покупка star pack (mock) → проверка Stars.
- **Boosts/quests**: claim boost, выполнить daily quest, проверить награду.
- **Рефералы**: ввод кода, ожидание наград, проверка milestones.
- **Чат**: отправка сообщения с `client_message_id`, убедиться в доставке и idempotency.
- **Season screen**: загрузка `/season/current`, отображение прогресса, claim награды (если доступно).

## 3. Визуальные тесты
- Снапшоты хранятся в `docs/qa/baseline/<date>/<spec>`.
- Workflow: `npm run test:visual` → если изменения легитимны, `npm run test:visual:baseline` и обновить baseline.
- Дополнительно используем Chromatic (`npm run test:storybook`).

## 4. Регрессы/backend smoke
- Перед релизом выполнить `npm run test` (backend) и `npm run test:qa` (frontend).
- Smoke-эндпоинты: `/health`, `/api/v1/session`, `/api/v1/tap`, `/api/v1/tick`, `/api/v1/quests`, `/api/v1/achievements`, `/api/v1/boost`, `/api/v1/referrals`, `/api/v1/chat/global/messages`.
- Проверить, что метрики `/metrics` доступны и отражают активность.

## 5. QA evidence
- Складывайте скриншоты, HAR, видео в `docs/qa/evidence/YYYY-MM-DD/`.
- Заполняйте checklist в PR описании: тесты, линты, визуал.

## 6. Негативные сценарии
- Rate-limit tap (50/сек) → ожидаем 429 + event `tap_rate_limit`.
- Истёкший refresh → `sessionManager` должен запросить новый токен.
- Спам в чат → runbook `chat-spam.md`.
- Ошибка /tick → проверяем `recordTickError(reason)` и ответ 400/500.

## 7. Роли и SLA
- **Разработчик**: пишет unit + минимум один интеграционный тест, обновляет документацию.
- **QA**: запускает e2e + визуальные перед релизом, хранит evidence.
- **DevOps**: следит за Jenkins pipeline, интегрирует артефакты (Playwright reports).
- **Product/design**: валидирует визуальные расхождения в Chromatic.

Обновляйте стратегию при появлении новых типов тестов или изменении границ ответственности.
