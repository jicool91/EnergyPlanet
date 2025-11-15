# CI/CD

## 1. Pipeline обзор
- **Оркестратор**: Jenkins (pipeline-as-code в `Jenkinsfile`).
- **Триггеры**: PR → lint/test, merge в `main` → полный pipeline + deploy.
- **Образы**: publish в `${DOCKER_REGISTRY}` (`your-registry.azurecr.io`) с тегами `${IMAGE_TAG}` (первые 7 символов commit) и `latest`.

## 2. Стадии подробно
1. `Checkout` — `checkout scm`.
2. `Test Backend` — `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test` внутри `backend/`.
3. `Test Webapp` — `npm ci`, `npm run lint`, `npm run typecheck` внутри `webapp/`. (Добавьте Playwright/Storybook шаги, если нужно.)
4. `Build Docker Images`
   - Backend Dockerfile: копирует исходники, `npm ci`, `npm run build`, `npm prune --production`, копирует контент/миграции, стартует `dist/index.js`.
   - Webapp Dockerfile: `npm ci`, `npm run build`, затем Nginx.
5. `Push to Registry` (only main) — логин через `docker-registry-creds`, push два тега.
6. `Run Database Migrations` — `kubectl apply -f k8s/migrations-job.yaml` + ожидание completion. (Job файл создайте при первой необходимости.)
7. `Deploy to Kubernetes` — `kubectl set image deployment/backend ...:${IMAGE_TAG}` и для webapp, затем `kubectl rollout status ...`.
8. `Run Smoke Tests` — `curl -f https://api.energyplanet.game/health`.
9. `post` блоки — success/failure logs, `docker system prune -f`, `cleanWs()`.

## 3. Branch/Release стратегия
- **main**: продуктив. Каждый merge → новая версия контейнеров.
- **feature/***: ветки разработчиков. Jenkins может запускать короткий pipeline (только тесты).
- **release tags**: опционально `vYYYY.MM.DD` — используйте для freeze.
- **hotfix**: делайте ветку от `main`, после мержа pipeline автоматически задеплоит фиксы.

## 4. Автоматизация миграций
- Миграции запускаются в отдельном job’е. Требования:
  - Сборка backend должна содержать актуальные файлы в `dist/migrations` (скрипт `npm run build` копирует).
  - Job должен использовать тот же image и доступ к БД.
  - После успешных миграций — удалить job/cleanup, чтобы не повторялась.

## 5. Observability pipeline
- Логи Jenkins → убедитесь, что подключён Slack/Telegram для алертов о падениях.
- Метрики сборки (build time, тесты) — TODO (можно отправлять в Prometheus).

## 6. Secrets в CI
- Jenkins credentials: `kubeconfig-prod`, `docker-registry-creds`.
- При необходимости добавить `TELEGRAM_BOT_TOKEN`, `YANDEX_AD_TOKEN_SECRET` и т. д. как Jenkins credentials и экспортировать в шаге deploy.

## 7. Лучшие практики
- Не увеличивайте Stage без таймаутов. Оборачивайте сетевые операции (`kubectl`, `docker push`) в retry.
- Старайтесь держать `npm ci` в build stage (не переносить node_modules между этапами).
- Для долгих тестов (Playwright) используйте отдельные агенты и публикуйте отчёты (JUnit/HTML) в Jenkins.

Обновляйте этот документ при изменении pipeline (например, добавили Sonar, запараллелили тесты, поменяли registry).
