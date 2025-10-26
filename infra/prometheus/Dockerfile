FROM prom/prometheus:v2.53.0

USER root
RUN apt-get update && apt-get install -y --no-install-recommends gettext-base && rm -rf /var/lib/apt/lists/*

COPY prometheus.yml /etc/prometheus/prometheus.yml.template
COPY alerts.yml /etc/prometheus/alerts.yml

ENV PROMETHEUS_SCRAPE_TARGET=localhost:3000 \
    PROMETHEUS_SCRAPE_SCHEME=http \
    PROMETHEUS_METRICS_PATH=/metrics

CMD /bin/sh -c 'envsubst "$$PROMETHEUS_SCRAPE_TARGET $$PROMETHEUS_SCRAPE_SCHEME $$PROMETHEUS_METRICS_PATH $$PROM_AUTH_USER $$PROM_AUTH_PASS" < /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml && exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --web.enable-lifecycle'
