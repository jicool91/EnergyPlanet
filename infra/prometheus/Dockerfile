FROM alpine:3.20 AS tools
RUN apk add --no-cache gettext
COPY entrypoint.sh /tmp/entrypoint.sh
RUN chmod +x /tmp/entrypoint.sh

FROM prom/prometheus:v2.53.0

COPY --from=tools /usr/bin/envsubst /usr/local/bin/envsubst

COPY prometheus.yml /etc/prometheus/prometheus.yml.template
COPY alerts.yml /etc/prometheus/alerts.yml
COPY --from=tools /tmp/entrypoint.sh /entrypoint.sh

ENV PROMETHEUS_SCRAPE_TARGET=localhost:3000 \
    PROMETHEUS_SCRAPE_SCHEME=http \
    PROMETHEUS_METRICS_PATH=/metrics

ENTRYPOINT ["/entrypoint.sh"]
