# Prometheus Setup (Railway)

## 1. Build the container

```
docker build -t energyplanet-prometheus infra/prometheus
```

## 2. Railway service configuration

- В проекте Railway нажми “New Service” → “Deploy from GitHub” и выбери репозиторий + папку `infra/prometheus`.
- После деплоя добавь переменные:
  - `PROMETHEUS_SCRAPE_TARGET=api:3000` (внутренний hostname backend’а, см. Private Networking). Если идёшь по публичному домену — `your-api.up.railway.app:443`.
  - `PROMETHEUS_SCRAPE_SCHEME=http` (или `https` при внешнем доступе).
  - `PROMETHEUS_METRICS_PATH=/metrics` (необязательно, это дефолт).
  - Если `/metrics` защищён basic auth: `PROM_AUTH_USER=metrics`, `PROM_AUTH_PASS=metrics` (или свой логин/пароль) — шаблон теперь подставляет их в `basic_auth`.
- Включи Private Networking и для backend, и для prometheus, чтобы адрес `api:3000` резолвился.
- После изменений нажми **Deploy** (prometheus пересоберёт конфиг через `envsubst`).

## 3. API environment

Add to Railway API service:

```
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
LOG_TICK_SAMPLE_RATE=0.01
PROM_AUTH_USER=<basic_auth_user>
PROM_AUTH_PASS=<basic_auth_pass>
```

(If you expose `/metrics` publicly, protect it with Basic Auth or IP allowlist.)

## 4. Scrape verification

```
curl https://<api-host>/metrics -u $PROM_AUTH_USER:$PROM_AUTH_PASS
```

Prometheus UI: `http://localhost:9090/graph` → run query `energyplanet_tick_success_total`.

## 5. Grafana (Railway)

- New Service → “Deploy from GitHub”, папка `infra/grafana`.
- Переменные окружения:
  - `GF_ADMIN_USER=admin` (или другой логин)
  - `GF_ADMIN_PASSWORD=<сильный пароль>`
  - `GF_PROMETHEUS_USER=metrics`
  - `GF_PROMETHEUS_PASS=metrics`
- Включи Private Networking, чтобы `prometheus:9090` резолвился.
- После деплоя datasource `Prometheus` создастся автоматически (см. `provisioning/datasources/prometheus.yml`).

## 6. Alertmanager (optional)

- Add `--config.file=/etc/prometheus/prometheus.yml --web.enable-lifecycle` в команду запуска.
- Deploy Alertmanager (Railway) и подключи к Prometheus через `alerting` блок.
