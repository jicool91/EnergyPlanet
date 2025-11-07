# Design System Adoption Metrics — 2025-11-07

## KPI
| Метрика | Описание | Источник | Обновление |
|---------|----------|----------|------------|
| **Screens on DS** | Кол-во экранов, переведённых на DS (Stage D/E/F) | `docs/roadmap/migration-plan.md` (парсится скриптом) | daily @ 05:00 UTC |
| **Stories with baselines** | Кол-во Storybook stories, прошедших Chromatic | Chromatic API (`stories` endpoint) | после каждого `npm run test:storybook` |
| **QA coverage** | Доля Playwright spec’ов, привязанных к DS-компонентам | `tests/qa/*.spec.ts` (tag `@ds`) | nightly Playwright report |
| **Feedback NPS** | Средняя оценка из UX опроса | Google Form → Notion view `DS Feedback` | еженедельно |

## Как собираем
1. `scripts/report-ds-adoption.mjs`
   - Читает таблицу миграций → считает `Done`/`In progress`/`Todo`.
   - Подтягивает таймстемпы последних обновлений (git blame) для дашборда.
2. Chromatic REST
   - `CHROMATIC_PROJECT_TOKEN` используется для `GET /snapshot` (ID берём из `.chromatic`). Логика в `scripts/chromatic-metrics.mjs`.
3. Playwright JSON
   - `npm run test:qa -- --reporter=json` кладёт отчёт в `front_build.log`. Сервис `scripts/qa-report.mjs` фильтрует тесты с `@ds`.
4. UX Survey
   - См. `docs/process/ux-audit-survey.md`. Экспортируем `responses.csv`, конвертируем в JSON, пушим в Notion через API.

## Где смотреть
- **Notion:** страница “DS Adoption Dashboard” (блоки: KPI, тренды, heatmap по командам).
- **Grafana:** дашборд `Design System / Adoption` (панели: Screens on DS, Chromatic baseline %, QA coverage %).

## SLA и алерты
- Если `Screens on DS` < планового (line target в Notion), Slack-бот пишет в `#ds-rollout`.
- Если Chromatic < 90% от stories, открывается Jira `DS-visual-regression`.
- UX NPS < 4 → создаётся action item в weekly DS sync.
