# Prometheus Setup (Railway)

## 1. Build the container

```
docker build -t energyplanet-prometheus infra/prometheus
```

## 2. Railway service configuration

- Create a new service based on the built image (or connect GitHub repo).
- Set environment variables:
  - `PROMETHEUS_SCRAPE_TARGET=api:3000` (use private hostname/port).
  - `PROMETHEUS_SCRAPE_SCHEME=http` (or `https` if exposed publicly).
  - `PROMETHEUS_METRICS_PATH=/metrics` (default).
- Mount `alerts.yml` if alertmanager is configured; otherwise ignore.

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

## 5. Alertmanager (optional)

- Add `--config.file=/etc/prometheus/prometheus.yml --web.enable-lifecycle` in Railway start command.
- Deploy Alertmanager (Railway) and wire to Prometheus via `alerting` section.

