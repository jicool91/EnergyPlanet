# Onboarding нового инженера

## Неделя 0 — доступы
- GitHub / репозиторий `energyPlanet` (write).
- Telegram dev bot + мини-приложение (добавить в список админов).
- Jenkins, Kubernetes (kubeconfig), Docker registry, Grafana/Prometheus.
- Slack/Telegram каналы (#energy-planet, #alerts, #release).

## Неделя 1 — погружение
1. Прочитайте `docs/README.md`, `architecture/system.md`, `backend.md`, `frontend.md`, `data-model.md`.
2. Настройте локальную среду (`setup/local-development.md`).
3. Пройдите `training` чеклист:
   - Запустить backend + webapp локально.
   - Авторизоваться через dev bot (либо включить `bypassAuth`).
   - Выполнить `npm run test` (backend) и `npm run test:qa` (frontend).
4. Проанализируйте метрики в Grafana: taps, tick latency, auth error.
5. Прочитайте `runbooks/*.md`.

## Неделя 2 — первая задача
- Выберите «good first issue» (например, новая награда квеста или UI фиксы).
- Добавьте тесты, обновите документацию.
- Пройдите code review, задеплойте через Jenkins (мелкий релиз/PR).

## Лид/менторы
- **Backend**: @BE-lead (владение серверами, миграции, биллинг).
- **Frontend**: @FE-lead (UI/TMA, Zustand, Playwright).
- **DevOps**: @DevOps (Jenkins, Kubernetes, мониторинг).

## Ресурсы
- GitHub Projects / Roadmap (`docs/roadmap/2025.md`).
- Content гайд (`architecture/content-pipeline.md`).
- Release процесс (`process/release-management.md`).

## Обратная связь
- Еженедельно синкайтесь с ментором (15 мин).
- По завершении первой задачи заполните Retro: что было сложно, где улучшить документацию.
