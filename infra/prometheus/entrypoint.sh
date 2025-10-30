#!/bin/sh
set -eu

envsubst '${PROMETHEUS_SCRAPE_TARGET} ${PROMETHEUS_SCRAPE_SCHEME} ${PROMETHEUS_METRICS_PATH} ${PROM_AUTH_USER} ${PROM_AUTH_PASS}' \
  < /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml

exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --web.enable-lifecycle \
  --web.listen-address='[::]:9090'
