# Тестирование и контроль качества

## 1. Общие правила
- Любое изменение бизнес-логики сопровождайте минимум unit-тестом (backend — Jest, frontend — React Testing Library/Playwright).
- Метрики (`backend/src/metrics/**`) обновляйте, если добавляете новые события/счётчики.
- Для фич, влияющих на Telegram UI, прогоняйте хотя бы smoke-набор Playwright и визуальные снапшоты.

## 2. Backend (Jest + Supertest)
| Тип | Команда | Описание |
|-----|---------|----------|
| Unit + integration | `npm run test` | Полный прогон с покрытием (Jest, конфиг `backend/jest.config.ts`). |
| Watch | `npm run test:watch` | Интерактивный режим при локальной разработке. |
| Integration only | `npm run test:integration` | Фильтрует тесты по `__tests__/integration`. |
| Lint | `npm run lint` / `npm run lint:fix` | ESLint + @typescript-eslint. |
| Type safety | `npm run typecheck` | `tsc --noEmit`. |

**Где писать тесты**:
- Контроллеры: `backend/src/api/controllers/__tests__` (используйте supertest + in-memory app).
- Сервисы: `backend/src/services/__tests__` (моки репозиториев/Redis).
- Миграции: smoke-тесты на `db/connection` + snapshot схемы (см. `docs/migrations/`).

## 3. Frontend (Vite + Playwright + Storybook)
| Тип | Команда | Контекст |
|-----|---------|----------|
| Lint | `npm run lint` | ESLint (React hooks, TS). |
| Type check | `npm run typecheck` | TS без эмита. |
| QA e2e | `npm run test:qa` | Playwright, конфиг `playwright.qa.config.ts` (Telegram mock runtime). |
| Perf tap loop | `npm run test:perf` | Замер задержек ввода на `tests/performance/tap-loop.spec.ts`. |
| Accessibility/контраст | `npm run test:contrast` | Скрипт `scripts/check-contrast.mjs`. |
| Visual regression | `npm run test:visual` | Playwright + screenshot baseline; базовые снапшоты лежат в `docs/qa/baseline`. |
| Storybook smoke | `npm run storybook` / `npm run build-storybook` | UXR/Design проверка, push на Chromatic (`test:storybook`). |

**Playwright артефакты**: отчёты в `webapp/playwright-report-qa/` и `webapp/test-results/`. Не коммитьте целые каталоги, кроме baseline-скриншотов в `docs/qa/baseline/<date>`.

## 4. QA-доказательства
- Складывайте сырой evidence в `docs/qa/evidence/<YYYY-MM-DD>/...` (скриншоты, HAR-файлы, записи профилей).
- Для визуальных регрессий используйте `npm run baseline:visual` для экспорта нового baseline и опишите причину в PR.

## 5. Статический анализ и форматирование
- Форматирование: `npm run format` (backend) и `npm run format` (frontend) используют Prettier 3.
- Git hooks не настроены — запускайте вручную перед коммитом.

## 6. Smoke-тест чеклист перед релизом
1. `curl https://api.energyplanet.game/health` возвращает `status=ok` (или `degraded` с понятной причиной).
2. В прод-логах нет всплеска `tap_rate_limit_triggered` / `tick_rate_limit_exceeded`.
3. На клиенте проходят `npm run test:qa` + визуальный baseline.
4. Мониторинг (Grafana «telegram-miniapp-product.json») в зелёной зоне: нет алертов `TickLatencyHigh`, `AuthErrorRateHigh`.

## 7. Политика покрытия
- Критические сервисы (Tap, Tick, Session, Purchase, Auth, Referral, Quest, Achievement) — покрытие ≥ 80% по строкам.
- UI-хуки, работающие с Telegram SDK (`webapp/src/services/tma/**`) — минимум smoke-тест или story со скриншотом.
- Миграции: после добавления новой таблицы обязательно описывайте её в `architecture/data-model.md` и добавляйте проверку в SQL smoke (см. `docs/migrations/` при расширении).

Поддерживайте этот документ в актуальном состоянии при появлении новых видов тестов или инструментов QA.
