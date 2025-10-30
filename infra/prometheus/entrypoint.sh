#!/bin/sh
set -eu

cat <<EOF >/etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'energyplanet-api'
    honor_labels: true
    honor_timestamps: true
    scheme: ${PROMETHEUS_SCRAPE_SCHEME}
    metrics_path: ${PROMETHEUS_METRICS_PATH}
    static_configs:
      - targets:
          - ${PROMETHEUS_SCRAPE_TARGET}
EOF

if [ "${PROM_AUTH_USER:-}" != "" ] && [ "${PROM_AUTH_PASS:-}" != "" ]; then
cat <<EOF >>/etc/prometheus/prometheus.yml
    basic_auth:
      username: ${PROM_AUTH_USER}
      password: ${PROM_AUTH_PASS}
EOF
fi

cat <<'EOF' >>/etc/prometheus/prometheus.yml
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
EOF

exec /bin/prometheus   --config.file=/etc/prometheus/prometheus.yml   --web.enable-lifecycle   --web.listen-address='[::]:9090'   --log.level=debug
