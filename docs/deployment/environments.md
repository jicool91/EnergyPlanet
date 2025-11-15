# Environments & Deployment

## 1. Среды
| Среда | Описание | URL | Хранение секретов |
|-------|----------|-----|--------------------|
| Local | Docker Compose (postgres+redis+backend+webapp) или ручной запуск. | `http://localhost:5173` / `http://localhost:3000` | `.env` в репозитории, не коммитить. |
| Dev / Preview | Railway backend (`https://backgame-production.up.railway.app/api/v1`), frontend может жить в Cloudflare Pages/Telegram dev bot. | Telegram dev bot, Railway URL | Railway env vars (консоль). |
| Production | Kubernetes namespace `energy-planet` (см. `k8s/`). Frontend сервится из Nginx контейнера (Dockerfile в `webapp/`) за Cloudflare. | `https://energyplanet.game`, `https://api.energyplanet.game` | Kubernetes Secrets (`k8s/secrets.yaml` шаблон) + внешние vault/CI. |

## 2. Jenkins pipeline (см. `Jenkinsfile`)
1. **Checkout** → `agent any`.
2. **Test Backend** → `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test` в `backend/`.
3. **Test Webapp** → `npm ci`, `npm run lint`, `npm run typecheck` в `webapp/` (Playwright/Chromatic запускаются отдельно при необходимости).
4. **Build Docker images** (параллельно)
   - Backend: `docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG}` (Dockerfile в `backend/`, копирует compiled dist + content).
   - Webapp: `docker build -t ${WEBAPP_IMAGE}:${IMAGE_TAG}` (Dockerfile в `webapp/`, билдит `npm run build` + Nginx).
5. **Push to registry** (только `main`) — логин по `docker-registry-creds`, пуш tag + `latest`.
6. **Миграции** — `kubectl apply -f k8s/migrations-job.yaml` (job должен присутствовать; если файла нет, добавьте). Ожидание `kubectl wait --for=condition=complete job/db-migration`.
7. **Deploy** — `kubectl set image deployment/backend ...`, `kubectl set image deployment/webapp ...`, `kubectl rollout status ...`.
8. **Smoke tests** — `curl -f https://api.energyplanet.game/health`.
9. **Cleanup** — `docker system prune -f`, `cleanWs()`.

## 3. Kubernetes (см. `k8s/`)
- **Namespace**: `energy-planet` (`namespace.yaml`).
- **ConfigMap**: `backend-config` (порт 3000, флаги, CONTENT_PATH, CORS). Для контента используется отдельный ConfigMap `game-content` (см. `deploy.yaml` → volume `content`).
- **Secrets**: `backend-secrets` (DB_HOST, REDIS_HOST, JWT_SECRET, TELEGRAM tokens, платежные ключи). Заполняйте через `kubectl create secret generic backend-secrets --from-literal=...`.
- **Deployments**:
  - `backend`: 3 реплики, ресурсы 250m/512Mi, probes `/health`, экспонирует порты 3000 (http) и 9090 (metrics). Volume `content` readOnly.
  - `webapp`: 2 реплики, Nginx (порт 80), ресурсы 50m/64Mi.
  - `postgres`: StatefulSet/Deployment в `deploy.yaml` (кластерIP None), PVC.
  - `redis`: Deployment + Service (ClusterIP 6379).
- **HPA**: `backend-hpa` (min 3, max 10, CPU 70%, Memory 80%).
- **Ingress**: `energy-planet-ingress` (host `energyplanet.game`/`api.energyplanet.game`), TLS `energy-planet-tls`, аннотации для cert-manager и rate-limit.

## 4. Инфраструктурные контейнеры
- **Prometheus** (`infra/prometheus`): Dockerfile + `prometheus.yml` (scrape target, basic auth), `alerts.yml`.
- **Grafana** (`infra/grafana`): Dockerfile, provisioning, dashboards `telegram-miniapp-*.json`.
- **start.sh**: локальный entrypoint (можно использовать в CI).

## 5. Настройка окружения
- **DB миграции**: `backend/package.json` → `npm run migrate:up` (использует `dist/db/migrate.js`). Перед деплоем убедитесь, что dist актуален (`npm run build`).
- **Контент**: при деплое обновите ConfigMap `game-content` или замените volume (например, `kubectl create configmap game-content --from-file=backend/content -n energy-planet --dry-run=client -o yaml | kubectl apply -f -`).
- **Secrets rotation**: обновите secret → перезапустите pods (`kubectl rollout restart deployment/backend`).
- **Логи**: используйте `kubectl logs deployment/backend` + `kubectl logs deployment/webapp`. Для долгосрочной аналитики подключите Loki/ELK (TODO).

## 6. Дежурный чеклист перед выкатом
1. Jenkins pipeline зелёный.
2. Все миграции применены (`/admin/migrations` = 0 pending).
3. Prometheus `HealthStatus`/Grafana без красных алертов.
4. Telegram bot подключен, `TELEGRAM_BOT_TOKEN` в secrets, mini-app доступен.
5. Контент ConfigMap синхронизирован (проверьте checksum/commit hash в аннотациях).

## 7. Откат
- **Код**: `kubectl rollout undo deployment/backend --to-revision=<n>` и аналогично для webapp.
- **Миграции**: используйте `npm run migrate:down` (осторожно — не все миграции обратимы). Для быстрого отката лучше иметь бэкап БД или флаг, который отключает новую функциональность.
- **Контент**: катните предыдущий ConfigMap (`kubectl apply -f content-configmap-<timestamp>.yaml`).

## 8. Observability & alerts
- Prometheus scrape config использует env-переменные `PROMETHEUS_SCRAPE_TARGET`, `PROM_AUTH_USER/PASS`.
- Alert правила в `infra/prometheus/alerts.yml` — убедитесь, что Alertmanager подписан на Slack/Telegram.
- Grafana dashboards лежат в `infra/grafana/dashboards`. При изменениях экспортируйте JSON и обновляйте репозиторий.

Поддерживайте этот файл актуальным при любых изменениях инфраструктуры (новый хостинг, новые сервисы, обновлённые секреты).
